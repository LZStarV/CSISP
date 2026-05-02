import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { config } from '@config';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { StepUpStore } from '@infra/redis/stepup.store';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SessionIssuer, SessionMode, SameSite } from '@utils/session.issuer';
import type { Request, Response } from 'express';

import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly gotrue: GotrueService,
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async sendOtpStepUp(req: Request): Promise<{ ok: true }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'No step-up session'
      );
    }
    const store = new StepUpStore(this.kv);
    const cur = await store.getState(sid);
    if (!cur) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Step-up session not found'
      );
    }
    if (cur.state === 'VERIFIED') {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Already verified'
      );
    }
    if (cur.state !== 'PENDING_PASSWORD') {
      throw new AuthApiException(
        AuthErrorCode.AuthStepUpRequired,
        'Step-up state mismatch'
      );
    }
    if (!cur.email) {
      throw new AuthApiException(AuthErrorCode.Unauthorized, 'Email missing');
    }
    await store.setPendingEmailOtp(sid, 600);
    await this.gotrue.sendLoginOtp({ email: cur.email });
    logger.info(
      {
        event: 'send_otp',
        result: 'success',
        email: cur.email,
        sid,
      },
      'auth send otp success'
    );
    return { ok: true };
  }

  async resendLoginOtp(req: Request): Promise<{ ok: true }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'No step-up session'
      );
    }
    const store = new StepUpStore(this.kv);
    const cur = await store.getState(sid);
    if (!cur) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Step-up session not found'
      );
    }
    if (cur.state !== 'PENDING_EMAIL_OTP' && cur.state !== 'PENDING_PASSWORD') {
      throw new AuthApiException(
        AuthErrorCode.AuthStepUpRequired,
        'Cannot resend OTP at this state'
      );
    }
    if (!cur.email) {
      throw new AuthApiException(AuthErrorCode.Unauthorized, 'Email missing');
    }
    await this.gotrue.sendLoginOtp({ email: cur.email });
    logger.info(
      {
        event: 'resend_otp',
        result: 'success',
        email: cur.email,
        sid,
      },
      'auth resend otp success'
    );
    return { ok: true };
  }

  async verifyOtpStepUp(
    dto: VerifyOtpDto,
    req: Request,
    res: Response
  ): Promise<{ verified: true }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    const sid = (req as any).cookies?.idp_stepup as string | undefined;
    if (!sid) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'No step-up session'
      );
    }
    const store = new StepUpStore(this.kv);
    const cur = await store.getState(sid);
    if (!cur) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Step-up session not found'
      );
    }
    if (cur.state === 'VERIFIED') {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Already verified'
      );
    }
    if (cur.state !== 'PENDING_EMAIL_OTP') {
      throw new AuthApiException(
        AuthErrorCode.AuthStepUpRequired,
        'Step-up state mismatch'
      );
    }
    try {
      await this.gotrue.verifyOtp({
        email: cur.email!,
        token: dto.token,
        type: 'email',
      });
      await store.setVerified(sid, 600);

      // 先通过 email 获取 auth user ID
      const authUserId = await this.gotrue.getAuthIdByEmail(cur.email!);
      let user = null;
      if (authUserId) {
        user = await this.userRepository.findByAuthUserId(authUserId);
      }

      if (user && user.id) {
        const sessionIssuer = new SessionIssuer(
          {
            ttlShort: 300,
            ttlLong: 3600,
            redisPrefix: 'idp:sess:',
            cookie: {
              name: 'idp_session',
              httpOnly: true,
              sameSite: SameSite.Lax,
              secure: config.runtime.isProduction,
              domain: config.session.cookieDomain,
              path: '/',
            },
          },
          this.kv
        );
        await sessionIssuer.issue(res, user.id, SessionMode.Long);
        logger.info(
          {
            event: 'create_session',
            result: 'success',
            userId: user.id,
            email: cur.email,
          },
          'auth create session success'
        );
      } else {
        logger.warn(
          {
            event: 'create_session',
            result: 'failed',
            email: cur.email,
            reason: 'user_not_found',
          },
          'auth create session failed - user not found'
        );
      }

      return { verified: true };
    } catch {
      throw new AuthApiException(
        AuthErrorCode.OtpInvalidOrExpired,
        'OTP invalid or expired'
      );
    }
  }
}
