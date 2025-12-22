/**
 * 自身或管理员守卫
 *
 * 允许当前登录用户访问自己的资源（如 /users/:id），
 * 也允许拥有 admin 角色的用户越权访问。
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private readonly paramName: string = 'id') {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    const user = req.user;
    const userId: number | undefined = user?.userId;
    const roles: string[] = user?.roles ?? [];

    const paramValue = req.params?.[this.paramName];
    const targetId = typeof paramValue === 'string' ? Number(paramValue) : paramValue;

    if (!userId) {
      throw new HttpException({ code: 401, message: '未登录' }, HttpStatus.UNAUTHORIZED);
    }

    const isAdmin = roles.includes('admin');
    const isSelf = Number.isFinite(targetId) && userId === Number(targetId);

    if (!isAdmin && !isSelf) {
      throw new HttpException({ code: 403, message: '只能访问自己的资源' }, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
