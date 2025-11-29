import type { Context, Next } from 'koa';
import type { ZodSchema } from 'zod';
export function validateBody(schema: ZodSchema<any>) {
  return async (ctx: Context, next: Next) => {
    const r = (schema as any).safeParse((ctx.request as any).body);
    if (!r.success) ctx.throw(400, 'Invalid body');
    (ctx.state as any).body = r.data;
    await next();
  };
}
