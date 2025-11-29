import type { Context, Next } from 'koa';
import type { ZodSchema } from 'zod';
export function validateQuery(schema: ZodSchema<any>) {
  return async (ctx: Context, next: Next) => {
    const r = (schema as any).safeParse(ctx.request.query);
    if (!r.success) ctx.throw(400, 'Invalid query');
    (ctx.state as any).query = r.data;
    await next();
  };
}
