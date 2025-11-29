import type { Context, Next } from 'koa';
type ErrorOptions = { showDetailsInDev?: boolean; logErrors?: boolean };
export default function error(options: ErrorOptions = {}) {
  const { showDetailsInDev = true, logErrors = true } = options;
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (e: any) {
      if (logErrors) process.stderr.write(`error:${ctx.method} ${ctx.path} ${e?.message}\n`);
      ctx.status = e?.status || (ctx.status && ctx.status >= 400 ? ctx.status : 500);
      const body: any = { code: ctx.status, message: e?.message || 'Internal Error' };
      if (showDetailsInDev && process.env.NODE_ENV === 'development') {
        body.stack = e?.stack;
      }
      ctx.body = body;
    }
  };
}
