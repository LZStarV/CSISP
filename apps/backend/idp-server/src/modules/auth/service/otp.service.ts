import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { StepUpStore } from '@infra/redis/stepup.store';
import { GotrueService } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Request } from 'express';

import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly gotrue: GotrueService,
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
    await this.gotrue.signInWithOtp({ email: cur.email });
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

  async verifyOtpStepUp(
    dto: VerifyOtpDto,
    req: Request
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
      logger.info(
        {
          event: 'verify_otp',
          result: 'success',
          email: cur.email,
          sid,
        },
        'auth verify otp success'
      );
      return { verified: true };
    } catch {
      logger.warn(
        {
          event: 'verify_otp',
          result: 'failed',
          email: cur?.email,
          sid,
          err: { code: 'OTP_INVALID_OR_EXPIRED' },
        },
        'auth verify otp failed'
      );
      throw new AuthApiException(
        AuthErrorCode.OtpInvalidOrExpired,
        'OTP invalid or expired'
      );
    }
  }
}
