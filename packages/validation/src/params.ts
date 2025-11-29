import type { Context, Next } from 'koa';
import type { ZodSchema } from 'zod';
export function validateParams(schema: ZodSchema<any>) {
  return async (ctx: Context, next: Next) => {
    const r = (schema as any).safeParse(ctx.params);
    if (!r.success) ctx.throw(400, 'Invalid params');
    (ctx.state as any).params = r.data;
    await next();
  };
}
