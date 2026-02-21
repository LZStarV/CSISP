import Redis from 'ioredis';

import { config } from '@/src/server/config';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;
  const { host, port, db, password } = config.redis;
  redis = new Redis({ host, port, db, password, lazyConnect: true });
  return redis;
}

export async function health(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  clients?: number;
}> {
  try {
    const r = getRedis();
    const start = Date.now();
    await r.ping();
    const latency = Date.now() - start;
    let clients: number | undefined = undefined;
    try {
      const info = await r.info('clients');
      const m = info.match(/connected_clients:(\\d+)/);
      clients = m ? Number(m[1]) : undefined;
    } catch {}
    return { ok: true, latencyMs: latency, clients };
  } catch {
    return { ok: false, latencyMs: null };
  }
}
