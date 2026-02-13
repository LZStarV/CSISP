import type { Context, Next } from 'koa';

import { verifyAuth, AuthGuardOptions } from './guard';

/**
 * Koa 认证配置选项
 */
export interface KoaAuthOptions extends AuthGuardOptions {
  /**
   * 是否强制要求认证，默认为 true。
   * 如果为 false，且未提供 token 或 token 无效时，会继续执行后续中间件，但 ctx.state.user 为空。
   */
  required?: boolean;
  /**
   * 需要的角色列表（任一满足即可）。
   * 仅在提供且 token 有效时生效。
   */
  roles?: string[];
  /**
   * 排除的路径（不进行认证拦截）。
   */
  excludePaths?: string[];
}

/**
 * Koa JWT 认证中间件
 *
 * 作用：
 * - 从 Authorization: Bearer <token> 头中解析并验证 JWT。
 * - 集成核心 verifyAuth 逻辑，支持 JWT 验证与 Session 状态检查。
 * - 支持角色校验（roles）。
 * - 将解码后的用户信息写入 ctx.state.user，角色列表写入 ctx.state.roles。
 *
 * @param options 认证配置项
 */
export function koaAuth(options: KoaAuthOptions) {
  const { required = true, roles = [], excludePaths = [] } = options;

  return async (ctx: Context, next: Next) => {
    // 1. 检查路径排除逻辑
    if (excludePaths.length > 0 && excludePaths.includes(ctx.path)) {
      return next();
    }

    // 2. 从 Header 中提取 Bearer Token
    const authHeader = ctx.get('Authorization');
    let token: string | undefined;

    if (authHeader) {
      const [type, credentials] = authHeader.split(' ');
      if (type === 'Bearer') {
        token = credentials;
      }
    }

    // 3. 如果没有 Token
    if (!token) {
      if (required) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: 'Authentication token missing',
        };
        return;
      }
      return next();
    }

    // 4. 调用核心验证逻辑
    const user = await verifyAuth(token, options);

    if (!user) {
      if (required) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: 'Invalid or expired token',
        };
        return;
      }
      return next();
    }

    // 5. 将用户信息与角色挂载到 Koa Context State
    ctx.state.user = user;
    ctx.state.roles = Array.isArray(user.roles) ? user.roles : [];

    // 6. 角色权限校验
    if (roles.length > 0) {
      const userRoles = ctx.state.roles as string[];
      const hasRole = roles.some(role => userRoles.includes(role));
      if (!hasRole) {
        ctx.status = 403;
        ctx.body = {
          code: 403,
          message: 'Insufficient permissions',
        };
        return;
      }
    }

    await next();
  };
}

/**
 * 独立的 Koa 角色校验中间件
 * 用于在已认证的基础上，对特定路由进行更细粒度的角色限制
 *
 * @param roles 允许访问的角色列表
 */
export function requireRoles(roles: string[]) {
  return async (ctx: Context, next: Next) => {
    const userRoles = (ctx.state.roles || []) as string[];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: 'Insufficient permissions',
      };
      return;
    }

    await next();
  };
}
