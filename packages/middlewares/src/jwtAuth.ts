import type { Context, Next } from 'koa';
export default function jwtAuth() {
  return async (ctx: Context, next: Next) => {
    await next();
  };
}
