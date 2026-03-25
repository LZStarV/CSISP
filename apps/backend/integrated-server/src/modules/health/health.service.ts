import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  ping(): { ok: boolean; ts: number } {
    return { ok: true, ts: Date.now() };
  }

  mongo(): {
    ok: boolean;
    state: number;
    stateText: string;
    db?: string;
    host?: string | null;
  } {
    const state = this.conn.readyState;
    const stateText =
      state === 1
        ? 'connected'
        : state === 0
          ? 'disconnected'
          : state === 2
            ? 'connecting'
            : state === 3
              ? 'disconnecting'
              : 'unknown';
    const db = this.conn.name;
    const host = (this.conn as any).host ?? null;
    const ok = state === 1;
    return { ok, state, stateText, db, host };
  }
}
