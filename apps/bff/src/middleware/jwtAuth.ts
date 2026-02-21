import { koaAuth } from '@csisp/auth/server';
import type { Context, Next } from 'koa';

import { config } from '../config';

// JWT 鉴权中间件
//
// 作用：
// - 使用 @csisp/auth/server 的 koaAuth 实现标准 JWT 校验
// - 支持 required=false 时允许匿名访问
// - 角色白名单校验，限制仅特定角色可访问
// - excludePaths 跳过指定路径（如登录/注册）
type JwtAuthOptions = {
  required?: boolean;
  roles?: string[];
  excludePaths?: string[];
};

export default function jwtAuth(options: JwtAuthOptions = {}) {
  const basePrefix = config.routes.basePrefix;
  const {
    required = true,
    roles = [],
    excludePaths = [
      `${basePrefix}/health`,
      `${basePrefix}/admin/openrpc.json`,
      `${basePrefix}/portal/openrpc.json`,
      `${basePrefix}/auth/login`,
      `${basePrefix}/auth/register`,
    ],
  } = options;

  const authMiddleware = koaAuth({
    jwtSecret: config.auth.jwtSecret,
    required,
    roles,
    excludePaths,
  });

  return async (ctx: Context, next: Next) => {
    // 1. 如果是 RPC 路径以外的路径（且不在排除名单内），则直接通过
    // 注意：BFF 绝大部分业务逻辑在 RPC 路径下
    const rest = ctx.path.startsWith(basePrefix)
      ? ctx.path.slice(basePrefix.length)
      : '';
    const isRpcPath = /^\/[^/]+\/[^/]+\/[^/]+$/.test(rest);
    if (!isRpcPath && !excludePaths.includes(ctx.path)) {
      return next();
    }

    // 2. 调用标准认证中间件
    return authMiddleware(ctx, next);
  };
}
