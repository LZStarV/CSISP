import crypto from 'crypto';

import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { config } from '@config';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { StepUpStore } from '@infra/redis/stepup.store';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Response } from 'express';

import { LoginInternalDto } from '../dto/login-internal.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly gotrue: GotrueService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async loginEmailPassword(
    dto: LoginInternalDto,
    res: Response
  ): Promise<{ stepUp: 'PENDING_PASSWORD' }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });
    try {
      await this.gotrue.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });
      const sid = crypto.randomUUID();
      const store = new StepUpStore(this.kv);
      await store.setPendingPassword(sid, dto.email, 600);
      res.cookie('idp_stepup', sid, {
        httpOnly: true,
        secure: config.runtime.isProduction,
        sameSite: 'strict',
        domain: config.session.cookieDomain,
        path: '/',
        maxAge: 600 * 1000,
      });
      logger.info(
        { event: 'login', result: 'success', email: dto.email, sid },
        'auth login success'
      );
      return { stepUp: 'PENDING_PASSWORD' };
    } catch {
      logger.warn(
        { event: 'login', result: 'failed', email: dto.email },
        'auth login failed'
      );
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        'Invalid email or password'
      );
    }
  }
}
