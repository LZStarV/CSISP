import { getRedis } from './client';

type CtxKey = string;
const memoryBuckets = new Map<CtxKey, { count: number; resetAt: number }>();

export async function checkAndIncr(
  ip: string,
  path: string,
  windowMs = 60_000,
  max = Number(process.env.RATE_LIMIT || 60)
) {
  const key = `rl:${ip}|${path}`;
  const r = getRedis();
  if (r) {
    const ttl = await r.pttl(key);
    if (ttl < 0) {
      await r.set(key, 1, 'PX', windowMs);
      return { allowed: true, remaining: max - 1, resetMs: windowMs };
    }
    const count = await r.incr(key);
    const remaining = Math.max(0, max - count);
    return { allowed: count <= max, remaining, resetMs: ttl };
  } else {
    const now = Date.now();
    const bucket = memoryBuckets.get(key) || {
      count: 0,
      resetAt: now + windowMs,
    };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    memoryBuckets.set(key, bucket);
    const remaining = Math.max(0, max - bucket.count);
    return {
      allowed: bucket.count <= max,
      remaining,
      resetMs: bucket.resetAt - now,
    };
  }
}
