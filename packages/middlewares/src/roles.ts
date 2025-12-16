import type { Context, Next } from 'koa';

export const requireRole = (roles: string | string[]) => {
  const list = Array.isArray(roles) ? roles : [roles];
  return async (ctx: Context, next: Next) => {
    const userRoles: string[] = ((ctx.state as any)?.roles || []) as string[];
    if (!userRoles.length || !list.some(r => userRoles.includes(r))) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '权限不足' };
      return;
    }
    await next();
  };
};

export const requireAdmin = async (ctx: Context, next: Next) => {
  const roles: string[] = ((ctx.state as any)?.roles || []) as string[];
  const user = (ctx.state as any)?.user;
  const isAdminRole = roles.includes('admin');
  const isAdminUser = user && user.username === 'admin';
  if (!isAdminRole && !isAdminUser) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '需要管理员权限' };
    return;
  }
  await next();
};
