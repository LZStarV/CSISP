import type { Context, Next } from 'koa';

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

const store = new Map<string, { count: number; resetTime: number }>();

export default function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = (ctx: Context) => `${ctx.ip}:${ctx.path}`,
    excludePaths = ['/health'],
    message = 'Too Many Requests',
  } = options;

  return async (ctx: Context, next: Next) => {
    if (excludePaths.some(p => ctx.path.startsWith(p))) return next();
    const key = keyGenerator(ctx);
    const now = Date.now();
    let rec = store.get(key);
    if (!rec || now > rec.resetTime) {
      rec = { count: 0, resetTime: now + windowMs };
      store.set(key, rec);
    }
    if (rec.count >= max) {
      ctx.status = 429;
      ctx.body = { code: 429, message, retryAfter: Math.ceil((rec.resetTime - now) / 1000) };
      return;
    }
    rec.count++;
    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(max - rec.count));
    ctx.set('X-RateLimit-Reset', new Date(rec.resetTime).toISOString());
    await next();
  };
}
