import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import {
  SessionIssuer,
  defaultSessionOptions,
  SessionMode,
} from '@utils/session.issuer';
import type { Response } from 'express';

@Injectable()
export class SessionService {
  private readonly sessionIssuer: SessionIssuer;

  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {
    this.sessionIssuer = new SessionIssuer(defaultSessionOptions, kv);
  }

  async issue(res: Response, uid: number, mode: SessionMode): Promise<void> {
    await this.sessionIssuer.issue(res, uid, mode);
  }

  async get(sid: string): Promise<number | null> {
    const result = await this.sessionIssuer.get(sid);
    return result ? Number(result) : null;
  }
}
