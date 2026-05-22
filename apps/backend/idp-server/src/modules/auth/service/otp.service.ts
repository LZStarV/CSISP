import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
import { GotrueService, SupabaseSession } from '@infra/supabase';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { SendLoginOtpDto } from '../dto/send-login-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly gotrue: GotrueService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  /**
   * 发送邮箱登录 OTP（独立入口，不依赖密码登录）
   */
  async sendLoginOtp(dto: SendLoginOtpDto): Promise<{
    ok: true;
    tempToken: string;
  }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });

    // 通过 Supabase GoTrue 发送 OTP
    await this.gotrue.sendLoginOtp({ email: dto.email });

    // 生成 tempToken，将 email 存入 Redis
    const tempToken =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    await this.kv.set(
      `temp:${tempToken}`,
      JSON.stringify({ email: dto.email }),
      300 // 5 分钟有效期
    );

    logger.info(
      {
        event: 'send_login_otp',
        result: 'success',
        email: dto.email,
      },
      'send login otp success'
    );

    return { ok: true, tempToken };
  }

  /**
   * 验证邮箱登录 OTP 并返回 Supabase session（独立登录）
   */
  async verifyLoginOtp(
    dto: VerifyOtpDto
  ): Promise<{ verified: true; supabaseSession: SupabaseSession }> {
    const tempData = await this.kv.get<{ email: string }>(
      `temp:${dto.tempToken}`
    );

    if (!tempData || !tempData.email) {
      throw new AuthApiException(
        AuthErrorCode.Unauthorized,
        '临时凭证无效或已过期'
      );
    }

    const supabaseSession = await this.gotrue.verifyOtp({
      email: tempData.email,
      token: dto.token,
      type: 'email',
    });

    if (!supabaseSession) {
      await this.kv.del(`temp:${dto.tempToken}`);
      throw new AuthApiException(
        AuthErrorCode.OtpInvalidOrExpired,
        'OTP 验证失败，未能获取 session'
      );
    }

    await this.kv.del(`temp:${dto.tempToken}`);

    return {
      verified: true,
      supabaseSession,
    };
  }
}
