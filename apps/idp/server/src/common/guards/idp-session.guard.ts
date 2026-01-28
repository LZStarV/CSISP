import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { get as redisGet } from '../../infra/redis';

@Injectable()
export class IdpSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sid: string | undefined = (req as any).cookies?.idp_session;
    (req as any).idpSession = sid;
    if (sid) {
      const uid = await redisGet(`idp:sess:${sid}`);
      if (uid) (req as any).idpUserId = Number(uid);
    }
    return true;
  }
}
