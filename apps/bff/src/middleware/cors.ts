import type { Context, Next } from 'koa';

// CORS 中间件
//
// 作用：
// - 为所有响应设置跨域相关响应头
// - 支持自定义允许来源、方法、头部、是否携带凭证等
// - 处理 OPTIONS 预检请求并返回 204
type CorsOptions = {
  origin?: string | string[] | ((ctx: Context) => string);
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
};

export default function cors(options: CorsOptions = {}) {
  const {
    origin = '*',
    allowMethods = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    allowHeaders = ['Content-Type', 'Authorization', 'X-Trace-Id'],
    exposeHeaders = ['Content-Length', 'Date', 'X-Request-Id'],
    credentials = true,
    maxAge = 86400,
  } = options;

  return async (ctx: Context, next: Next) => {
    const reqOrigin = ctx.get('Origin');
    let allowed = false;
    if (typeof origin === 'string') {
      allowed = origin === '*' || origin === reqOrigin;
      if (allowed) ctx.set('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      allowed = origin.includes(reqOrigin);
      if (allowed) ctx.set('Access-Control-Allow-Origin', reqOrigin);
    } else if (typeof origin === 'function') {
      const o = origin(ctx);
      ctx.set('Access-Control-Allow-Origin', o);
      allowed = true;
    }
    if (credentials) ctx.set('Access-Control-Allow-Credentials', 'true');
    if (allowMethods.length)
      ctx.set('Access-Control-Allow-Methods', allowMethods.join(', '));
    if (allowHeaders.length)
      ctx.set('Access-Control-Allow-Headers', allowHeaders.join(', '));
    if (exposeHeaders.length)
      ctx.set('Access-Control-Expose-Headers', exposeHeaders.join(', '));
    if (maxAge) ctx.set('Access-Control-Max-Age', String(maxAge));
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }
    await next();
  };
}
