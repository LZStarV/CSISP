import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { GotrueService, SupabaseSession } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly gotrue: GotrueService,
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async sendOtpStepUp(dto: { tempToken: string }): Promise<{ ok: true }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });

    const tempData = await this.kv.get<{ email: string }>(
      `temp:${dto.tempToken}`
    );
    if (!tempData || !tempData.email) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        '临时凭证无效或已过期'
      );
    }

    await this.gotrue.sendLoginOtp({ email: tempData.email });
    logger.info(
      {
        event: 'send_otp',
        result: 'success',
        email: tempData.email,
      },
      'auth send otp success'
    );
    return { ok: true };
  }

  async verifyOtpStepUp(
    dto: VerifyOtpDto
  ): Promise<{ verified: true; supabaseSession?: SupabaseSession }> {
    const tempData = await this.kv.get<{
      email: string;
      supabaseSession: SupabaseSession;
    }>(`temp:${dto.tempToken}`);

    if (!tempData || !tempData.email) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        '临时凭证无效或已过期'
      );
    }

    try {
      await this.gotrue.verifyOtp({
        email: tempData.email,
        token: dto.token,
        type: 'email',
      });

      await this.kv.del(`temp:${dto.tempToken}`);

      return {
        verified: true,
        supabaseSession: tempData.supabaseSession,
      };
    } catch {
      throw new AuthApiException(
        AuthErrorCode.OtpInvalidOrExpired,
        'OTP invalid or expired'
      );
    }
  }
}
