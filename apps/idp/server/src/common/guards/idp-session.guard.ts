import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { RedisPrefix } from '@idp-types/redis';
import { getIdpLogger } from '@infra/logger';
import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

const logger = getIdpLogger('idp-session-guard');

// IDP 会话守卫，检查 HTTP 请求是否包含有效的会话 ID
@Injectable()
export class IdpSessionGuard implements CanActivate {
  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sid: string | undefined = (req as any).cookies?.idp_session;
    (req as any).idpSession = sid;

    if (sid) {
      const uid = await this.kv.get<string>(`${RedisPrefix.IdpSession}${sid}`);
      logger.info({ sid, uid }, 'Checking idp_session');
      if (uid !== null && uid !== undefined && uid !== '') {
        (req as any).idpUserId = Number(uid);
      }
    } else {
      logger.warn('No idp_session cookie found');
    }
    return true;
  }
}
