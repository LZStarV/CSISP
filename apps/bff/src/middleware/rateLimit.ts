import type { Context, Next } from 'koa';

import { redis } from '../infra/redis';

// 简易滑窗限流中间件（内存实现）
//
// 作用：
// - 按调用方标识（默认使用 ctx.ip）统计某时间窗口内的请求次数
// - 当超过 max 次时返回 429，并在响应头中附带限流信息
// - 支持按路径排除不参与限流的接口（如 /health）
type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  keyGenerator?: (ctx: Context) => string;
  excludePaths?: string[];
  message?: string;
};

const windowDefault = 60000;

export default function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = windowDefault,
    max = 100,
    keyGenerator = (ctx: Context) => `${ctx.ip}:${ctx.path}`,
    excludePaths = ['/health'],
    message = 'Too Many Requests',
  } = options;

  return async (ctx: Context, next: Next) => {
    if (excludePaths.some(p => ctx.path.startsWith(p))) return next();
    const key = `bff:ratelimit:${keyGenerator(ctx)}`;
    const n = await (redis as any).incr?.(key);
    if (n === 1) {
      await (redis as any).expire?.(key, Math.floor(windowMs / 1000));
    }
    if (typeof n === 'number' && n > max) {
      ctx.status = 429;
      ctx.body = {
        code: 429,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      };
      return;
    }
    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set(
      'X-RateLimit-Remaining',
      String(max - (typeof n === 'number' ? n : 0))
    );
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());
    await next();
  };
}
