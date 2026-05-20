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
  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {}

  async logout(
    dto: AuthLogoutDto,
    req: Request,
    res: Response
  ): Promise<LogoutResult> {
    const sid = (req as any).cookies?.idp_session as string | undefined;

    if (sid) {
      await this.kv.del(`${RedisPrefix.IdpSession}${sid}`);
      logger.info({ sid }, 'Session deleted from Redis');
    }

    res.clearCookie('idp_session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return { logged: false };
  }
}
