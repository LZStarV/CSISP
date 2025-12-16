import type { Context, Next } from 'koa';
type LoggerOptions = { excludePaths?: string[]; logResponse?: boolean };
export default function logger(options: LoggerOptions = {}) {
  const { excludePaths = ['/health', '/favicon.ico'], logResponse = false } = options;
  return async (ctx: Context, next: Next) => {
    if (excludePaths.some(p => ctx.path.startsWith(p))) return next();
    const s = Date.now();
    await next();
    const ms = Date.now() - s;
    const traceId = (ctx.state as any)?.traceId;
    const base = `${ctx.method} ${ctx.path} ${ctx.status} ${ms}ms${traceId ? ` traceId=${traceId}` : ''}`;
    if (logResponse && ctx.body) {
      process.stdout.write(`${base} body=${JSON.stringify(ctx.body).slice(0, 500)}\n`);
    } else {
      process.stdout.write(`${base}\n`);
    }
  };
}
