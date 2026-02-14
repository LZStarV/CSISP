import { checkAndIncr } from '@/src/infra/redis';

export async function limit(
  ctx: { ip?: string; path?: string },
  maxPerMin = 60
) {
  const ip = ctx.ip || '0';
  const path = ctx.path || '';
  const res = await checkAndIncr(ip, path, 60_000, maxPerMin);
  if (!res.allowed) {
    const err = new Error('Rate limit exceeded');
    (err as any).code = -32602;
    (err as any).data = { remaining: res.remaining, resetMs: res.resetMs };
    throw err;
  }
}
