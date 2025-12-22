/**
 * 角色守卫
 *
 * 配合 @Roles 装饰器使用，从元数据中读取所需角色，
 * 再与 req.user.roles 比较，未满足时抛出 403。
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const user = req.user;
    const roles: string[] = user?.roles ?? [];

    const hasRole = requiredRoles.some(role => roles.includes(role));
    if (!hasRole) {
      throw new HttpException({ code: 403, message: '权限不足' }, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
