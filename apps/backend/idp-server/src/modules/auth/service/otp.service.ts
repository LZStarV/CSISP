import {
  AuthApiException,
  AuthErrorCode,
} from '@common/errors/auth-error-codes';
import { config } from '@config';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { getIdpBaseLogger } from '@infra/logger';
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

  async sendOtpStepUp(dto: { tempToken: string }): Promise<{ ok: true }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });

    // 从 tempToken 获取 email
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
    dto: VerifyOtpDto,
    req: Request,
    res: Response
  ): Promise<{ verified: true; supabaseSession?: any }> {
    const logger = getIdpBaseLogger().child({ module: 'auth' });

    // 从 tempToken 获取数据
    const tempData = await this.kv.get<{
      email: string;
      supabaseSession: any;
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

      // 先通过 email 获取 auth user ID
      const authUserId = await this.gotrue.getAuthIdByEmail(tempData.email);
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
            email: tempData.email,
          },
          'auth create session success'
        );
      }

      // 删除临时凭证（一次性使用）
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
