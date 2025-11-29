import type { Context, Next } from 'koa';
type CorsOptions = {
  origin?: string | string[] | ((ctx: Context) => string);
  credentials?: boolean;
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  maxAge?: number;
};
export default function cors(options: CorsOptions = {}) {
  const {
    origin = '*',
    credentials = false,
    allowMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders = [],
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
    if (allowMethods.length) ctx.set('Access-Control-Allow-Methods', allowMethods.join(', '));
    if (allowHeaders.length) ctx.set('Access-Control-Allow-Headers', allowHeaders.join(', '));
    if (exposeHeaders.length) ctx.set('Access-Control-Expose-Headers', exposeHeaders.join(', '));
    if (maxAge) ctx.set('Access-Control-Max-Age', String(maxAge));
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }
    await next();
  };
}
