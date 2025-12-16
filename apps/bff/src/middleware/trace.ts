import type { Context, Next } from 'koa';

function genTraceId() {
  const r = Math.random().toString(16).slice(2, 10);
  return `${Date.now().toString(16)}-${r}`;
}

export default function traceMiddleware() {
  return async (ctx: Context, next: Next) => {
    const incoming = ctx.get('X-Trace-Id');
    const traceId = incoming || genTraceId();
    (ctx.state as any).traceId = traceId;
    ctx.set('X-Trace-Id', traceId);
    await next();
  };
}
