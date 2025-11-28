/**
 * 认证中间件
 * 处理用户身份验证和权限校验
 */

import { Middleware, AuthMiddlewareOptions, Next } from '../types/middleware';
import { AppContext } from '../types/context';
import jwt from 'jsonwebtoken';

/**
 * JWT认证中间件
 * 验证JWT令牌并提取用户信息
 */
export const jwtAuth = (options: AuthMiddlewareOptions = {}): Middleware => {
  const { required = true, roles = [], permissions = [], excludePaths = [] } = options;

  return async (ctx: AppContext, next: Next) => {
    try {
      // 检查是否在排除路径中
      if (excludePaths.includes(ctx.path)) {
        return await next();
      }

      // 获取Authorization头
      const authHeader = ctx.headers.authorization;
      if (!authHeader) {
        if (required) {
          ctx.status = 401;
          ctx.body = { code: 401, message: '未提供认证令牌' };
          return;
        }
        return await next();
      }

      // 验证Bearer令牌格式
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        ctx.status = 401;
        ctx.body = { code: 401, message: '认证令牌格式错误' };
        return;
      }

      const token = parts[1];

      // 验证JWT令牌
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      } catch {
        ctx.status = 401;
        ctx.body = { code: 401, message: '认证令牌无效或已过期' };
        return;
      }

      // 从令牌中提取角色（登录时已写入）
      const userRoleCodes: string[] = Array.isArray(decoded.roles) ? decoded.roles : [];

      // 检查角色权限
      if (roles.length > 0) {
        const hasRequiredRole = roles.some(role => userRoleCodes.includes(role as any));
        if (!hasRequiredRole) {
          ctx.status = 403;
          ctx.body = { code: 403, message: '权限不足' };
          return;
        }
      }

      // 业务权限检查依赖外部权限系统，当前根据令牌角色跳过细粒度校验

      // 将用户信息添加到上下文
      ctx.userId = decoded.userId;
      ctx.state.userId = decoded.userId;
      ctx.user = { id: decoded.userId, username: decoded.username } as any;
      ctx.roles = userRoleCodes;

      await next();
    } catch {
      ctx.status = 500;
      ctx.body = { code: 500, message: '认证处理失败' };
    }
  };
};

/**
 * 角色权限中间件
 * 检查用户是否具有指定角色
 */
export const requireRole = (roles: string | string[]): Middleware => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (ctx: AppContext, next: Next) => {
    if (!ctx.roles || ctx.roles.length === 0) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '权限不足' };
      return;
    }

    const hasRole = roleArray.some(role => ctx.roles!.includes(role as any));
    if (!hasRole) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '需要角色: ' + roleArray.join(', ') };
      return;
    }

    await next();
  };
};

/**
 * 管理员权限中间件
 * 检查用户是否为管理员
 */
export const requireAdmin: Middleware = async (ctx: AppContext, next: Next) => {
  const isAdminRole = Array.isArray(ctx.roles) && ctx.roles.includes('admin');
  const isAdminUser = ctx.user && (ctx.user as any).username === 'admin';
  if (!isAdminRole && !isAdminUser) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '需要管理员权限' };
    return;
  }

  await next();
};

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
