import crypto from 'crypto';

import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import {
  SupabaseOidcClientRepository,
  SupabaseUserRepository,
} from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { NextResult, AuthNextStep } from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { getIdpBaseLogger } from '@infra/logger';
import { ExchangeStore } from '@infra/redis/exchange.store';
import { StepUpStore } from '@infra/redis/stepup.store';
import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OidcPolicyHelper } from '@utils/oidc/oidc.policy';
import { SessionMode } from '@utils/session.issuer';
import { TicketIssuer, TicketIdType } from '@utils/ticket.issuer';
import type { Request } from 'express';
import type { Response } from 'express';

import { CreateExchangeCodeDto } from '../dto/create-exchange-code.dto';
import { EnterDto } from '../dto/enter.dto';

import { SessionService } from './session.service';

@Injectable()
export class OidcAuthService {
  private readonly oidcTicketIssuer: TicketIssuer<any>;
  private readonly oidcAuthReqIssuer: TicketIssuer<any>;
  private readonly oidcCodeIssuer: TicketIssuer<any>;

  constructor(
    private readonly oidcClientRepository: SupabaseOidcClientRepository,
    private readonly userRepository: SupabaseUserRepository,
    private readonly sessionService: SessionService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {
    this.oidcTicketIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcTicket, ttl: 600, idType: TicketIdType.UUID },
      kv
    );
    this.oidcAuthReqIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcAuthReq, ttl: 600 },
      kv
    );
    this.oidcCodeIssuer = new TicketIssuer<any>(
      { prefix: RedisPrefix.OidcCode, ttl: 600 },
      kv
    );
  }

  async createExchangeCode(
    dto: CreateExchangeCodeDto,
    req: Request
  ): Promise<{ code: string; redirect_uri: string; state?: string | null }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new AuthApiException(
        AuthErrorCode.AuthStepUpRequired,
        'No step-up session'
      );
    }
    const step = new StepUpStore(this.kv);
    const cur = await step.getState(sid);
    if (!cur || cur.state !== 'VERIFIED') {
      throw new AuthApiException(
        AuthErrorCode.AuthStepUpRequired,
        'Step-up not verified'
      );
    }
    const quotaKey = `xchg:quota:${sid}`;
    const n = await this.kv.incr(quotaKey);
    if (n === 1) {
      await this.kv.expire(quotaKey, 30);
    }
    if (n > 1) {
      logger.warn(
        {
          event: 'create_exchange_code',
          result: 'failed',
          email: cur.email,
          sid,
          app_id: dto.app_id,
          redirect_uri: dto.redirect_uri,
          err: { code: 'RATE_LIMITED' },
        },
        'auth create exchange code rate limited'
      );
      throw new AuthApiException(
        AuthErrorCode.RateLimited,
        'Too many requests'
      );
    }
    const client = await this.oidcClientRepository.findByClientId(dto.app_id);
    const active = client && client.status === 'active';
    const allowed =
      active &&
      OidcPolicyHelper.isRedirectUriAllowed(
        dto.redirect_uri,
        client!.allowed_redirect_uris as string | string[] | null
      );
    if (!allowed) {
      throw new AuthApiException(
        AuthErrorCode.ExchangeCodeInvalid,
        'redirect_uri not allowed'
      );
    }
    const code = crypto.randomBytes(32).toString('base64url');
    const ua = req.headers['user-agent'];
    const ip = (req as any).ip as string | undefined;
    const store = new ExchangeStore(this.kv);
    await store.issue(
      code,
      {
        sid,
        email: cur.email ?? null,
        app_id: dto.app_id,
        redirect_uri: dto.redirect_uri,
        ua: typeof ua === 'string' ? ua : undefined,
        ip,
      },
      60
    );
    try {
      await step.clear(sid);
    } catch {}
    logger.info(
      {
        event: 'create_exchange_code',
        result: 'success',
        email: cur.email,
        sid,
        app_id: dto.app_id,
        redirect_uri: dto.redirect_uri,
      },
      'auth create exchange code success'
    );
    return { code, redirect_uri: dto.redirect_uri, state: dto.state };
  }

  async enter(
    params: EnterDto,
    res?: Response,
    uidFromSess?: number
  ): Promise<NextResult> {
    const ticket = params.ticket;
    let state = params.state;
    let auth: any = null;

    if (ticket) {
      auth = await this.oidcTicketIssuer.verify(ticket);
      if (auth) {
        state = auth.state;
      }
    }

    if (!auth && state) {
      auth = await this.oidcAuthReqIssuer.verify(state);
    }

    const studentId = params.studentId;
    let user: any = null;
    if (studentId) {
      user = await this.userRepository.findByStudentId(studentId);
    } else if (uidFromSess) {
      user = await this.userRepository.findById(uidFromSess);
    } else {
      user = null;
    }

    getIdpLogger('auth-service').info(
      { studentId, uidFromSess, userId: user?.id },
      'Resolved user in enter'
    );

    const uid = user ? user.id : null;
    getIdpLogger('auth-service').info(
      { studentId, uidFromSess, userId: user?.id, uid },
      'Resolved final uid in enter'
    );

    if (res && uid !== null && uid !== undefined) {
      await this.sessionService.issue(res, uid, SessionMode.Long);
    }

    if (!auth) {
      return { nextSteps: [AuthNextStep.NUMBER_3] };
    }

    if (uid === null || uid === undefined) {
      throw new CommonApiException(
        CommonErrorCode.Unauthorized,
        'Unauthorized: session invalid',
        HttpStatus.UNAUTHORIZED
      );
    }

    const code = await this.oidcCodeIssuer.issue({
      client_id: auth.client_id,
      redirect_uri: auth.redirect_uri,
      code_challenge: auth.code_challenge,
      sub: String(uid),
      nonce: auth.nonce,
      acr: 'mfa',
      amr: ['sms'],
      scope: auth.scope || 'openid',
    });

    const redirectTo = `${auth.redirect_uri}?code=${code}&state=${encodeURIComponent(String(state || ''))}`;
    if (res && params.redirectMode === 'http') {
      res.redirect(302, redirectTo);
      return { nextSteps: [AuthNextStep.NUMBER_3] };
    }
    return { nextSteps: [AuthNextStep.NUMBER_3], redirectTo };
  }
}
