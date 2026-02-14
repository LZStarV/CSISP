import { requireEnv } from '@csisp/utils';
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;
  const host = requireEnv('REDIS_HOST');
  const portRaw = requireEnv('REDIS_PORT');
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid environment variable: REDIS_PORT=${portRaw}`);
  }
  const dbRaw = requireEnv('REDIS_DB');
  const db = Number(dbRaw);
  if (!Number.isInteger(db) || db < 0) {
    throw new Error(`Invalid environment variable: REDIS_DB=${dbRaw}`);
  }
  const passwordRaw = process.env.REDIS_PASSWORD;
  const password = passwordRaw === '' ? undefined : passwordRaw;
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
