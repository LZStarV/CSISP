import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const enabled = String(process.env.REDIS_ENABLED || 'false') === 'true';
  if (!enabled) return null;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const db = Number(process.env.REDIS_DB || 0);
  const password = process.env.REDIS_PASSWORD || undefined;
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
    if (!r) return { ok: false, latencyMs: null };
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
