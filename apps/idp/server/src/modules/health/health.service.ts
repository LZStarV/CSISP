import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return { ok: true, ts: Date.now() };
  }
}
