import { config } from '@config';
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

  async upstash(): Promise<{ ok: boolean; region?: string; count?: number }> {
    const base = config.supabase.url.replace(/\/+$/, '');
    const url = `${base}/functions/v1/upstash-health`;
    try {
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) return { ok: false };
      const data: any = await resp.json();
      return {
        ok: true,
        region: data?.region,
        count: Number(data?.count ?? 0),
      };
    } catch {
      return { ok: false };
    }
  }
}
