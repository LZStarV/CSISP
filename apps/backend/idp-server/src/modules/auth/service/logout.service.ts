import crypto from 'crypto';

import {
  SupabaseRefreshTokenRepository,
  SupabaseUserRepository,
} from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import type { LogoutResult } from '@csisp-api/idp-server';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthLogoutDto } from '../dto/logout.dto';

const logger = getIdpLogger('logout-service');

@Injectable()
export class LogoutService {
  constructor(
    private readonly userRepository: SupabaseUserRepository,
    private readonly refreshTokenRepository: SupabaseRefreshTokenRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  async logout(
    dto: AuthLogoutDto,
    req: Request,
    res: Response
  ): Promise<LogoutResult> {
    const sid = (req as any).cookies?.idp_session as string | undefined;

    if (sid) {
      const uid = await this.kv.get<string>(`${RedisPrefix.IdpSession}${sid}`);
      if (uid) {
        const subHash = this.hashSubject(uid);
        try {
          const revokedCount =
            await this.refreshTokenRepository.revokeBySub(subHash);
          logger.info({ uid, revokedCount }, 'Revoked refresh tokens for user');
        } catch (error) {
          logger.warn({ uid, error }, 'Failed to revoke refresh tokens');
        }
      }

      await this.kv.del(`${RedisPrefix.IdpSession}${sid}`);
      logger.info({ sid }, 'Session deleted from Redis');
    }

    res.clearCookie('idp_session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('idp_stepup', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });

    return { logged: false };
  }

  private hashSubject(sub: string): string {
    return crypto.createHash('sha256').update(sub).digest('hex');
  }
}
