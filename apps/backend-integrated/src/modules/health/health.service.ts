import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  ping(): { ok: boolean; ts: number } {
    return { ok: true, ts: Date.now() };
  }
}
