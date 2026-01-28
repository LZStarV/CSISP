import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /**
   * 获取健康状态
   * - 返回 { ok: true, ts }，用于前端与监控探活
   */
  getStatus() {
    return { ok: true, ts: Date.now() };
  }
}
