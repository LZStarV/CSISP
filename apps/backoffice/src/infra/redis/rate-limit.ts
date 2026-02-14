import { getRedis } from './client';

export async function checkAndIncr(
  ip: string,
  path: string,
  windowMs = 60_000,
  max = 60
) {
  const key = `rl:${ip}|${path}`;
  const r = getRedis();
  const ttl = await r.pttl(key);
  if (ttl < 0) {
    await r.set(key, 1, 'PX', windowMs);
    return { allowed: true, remaining: max - 1, resetMs: windowMs };
  }
  const count = await r.incr(key);
  const remaining = Math.max(0, max - count);
  return { allowed: count <= max, remaining, resetMs: ttl };
}
