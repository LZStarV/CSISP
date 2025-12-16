import type { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';

type JwtAuthOptions = {
  required?: boolean;
  roles?: string[];
  excludePaths?: string[];
};

export default function jwtAuth(options: JwtAuthOptions = {}) {
  const { required = false, roles = [], excludePaths = [] } = options;
  return async (ctx: Context, next: Next) => {
    if (excludePaths.length && excludePaths.includes(ctx.path)) return next();

    const authHeader = ctx.get('Authorization');
    if (!authHeader) {
      if (required) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未提供认证令牌' };
        return;
      }
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = { code: 401, message: '认证令牌格式错误' };
      return;
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    try {
      const decoded: any = jwt.verify(token, secret || 'default-secret');
      (ctx.state as any).userId = decoded.userId;
      (ctx.state as any).user = { id: decoded.userId, username: decoded.username };
      (ctx.state as any).roles = Array.isArray(decoded.roles) ? decoded.roles : [];

      if (roles.length) {
        const hasRole = roles.some(r => (ctx.state as any).roles.includes(r));
        if (!hasRole) {
          ctx.status = 403;
          ctx.body = { code: 403, message: '权限不足' };
          return;
        }
      }

      await next();
    } catch {
      ctx.status = 401;
      ctx.body = { code: 401, message: '认证令牌无效或已过期' };
    }
  };
}
