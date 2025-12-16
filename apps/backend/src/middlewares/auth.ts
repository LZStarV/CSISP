/**
 * 认证中间件
 */
import { Middleware, AuthMiddlewareOptions, Next } from '../types/middleware';
import { AppContext } from '../types/context';
import {
  jwtAuth as sharedJwtAuth,
  requireAdmin as sharedRequireAdmin,
  requireRole as sharedRequireRole,
} from '@csisp/middlewares';

/**
 * JWT 认证（默认 required=true），映射到通用中间件
 */
export const jwtAuth = (options: AuthMiddlewareOptions = {}): Middleware => {
  const { required = true, roles = [], excludePaths = [] } = options;
  // permissions 参数由后端自用，当前忽略以保持与通用中间件一致
  return sharedJwtAuth({ required, roles, excludePaths }) as unknown as Middleware;
};

/**
 * 角色权限
 */
export const requireRole = (roles: string | string[]): Middleware => {
  return sharedRequireRole(roles) as unknown as Middleware;
};

/**
 * 管理员权限
 */
export const requireAdmin: Middleware = sharedRequireAdmin as unknown as Middleware;

/**
 * 教师权限中间件
 * 检查用户是否为教师
 */
export const requireTeacher: Middleware = async (ctx: AppContext, next: Next) => {
  if (!ctx.roles || (!ctx.roles.includes('teacher') && !ctx.roles.includes('admin'))) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '需要教师权限' };
    return;
  }

  await next();
};

/**
 * 学生权限中间件
 * 检查用户是否为学生
 */
export const requireStudent: Middleware = async (ctx: AppContext, next: Next) => {
  if (!ctx.roles || (!ctx.roles.includes('student') && !ctx.roles.includes('admin'))) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '需要学生权限' };
    return;
  }

  await next();
};

/**
 * 当前用户或管理员中间件
 * 允许用户访问自己的资源或管理员访问
 */
export const requireSelfOrAdmin = (paramName = 'id'): Middleware => {
  return async (ctx: AppContext, next: Next) => {
    const targetId = parseInt(ctx.params[paramName]);
    const currentUserId = ctx.userId;

    if (!currentUserId) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '未登录' };
      return;
    }

    const isAdmin = ctx.roles?.includes('admin') || false;
    const isSelf = currentUserId === targetId;

    if (!isSelf && !isAdmin) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '只能访问自己的资源' };
      return;
    }

    await next();
  };
};
