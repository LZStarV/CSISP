/**
 * JWT 鉴权守卫
 *
 * 从 Authorization Bearer Token 中解析 JWT，
 * 验证通过后将 { userId, username, roles } 注入到 req.user，
 * 失败时抛出 401，统一由 HttpExceptionFilter 格式化。
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    const authHeader: string | undefined =
      req.headers['authorization'] ?? req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException({ code: 401, message: '未登录' }, HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.slice(7);
    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const payload = jwt.verify(token, secret) as any;

      req.user = {
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles ?? [],
      };

      return true;
    } catch {
      throw new HttpException({ code: 401, message: '登录已过期或无效' }, HttpStatus.UNAUTHORIZED);
    }
  }
}
