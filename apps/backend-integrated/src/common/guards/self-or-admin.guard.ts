import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RpcError } from '../rpc/rpc-error';
import { RPCErrorCode } from '../rpc/jsonrpc';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private readonly paramName: string = 'id') {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    const user = req.user;
    const userId: number | undefined = user?.userId;
    const roles: string[] = user?.roles ?? [];

    const paramValue = req.body?.params?.[this.paramName] ?? req.params?.[this.paramName];
    const targetId = typeof paramValue === 'string' ? Number(paramValue) : paramValue;

    if (!userId) {
      throw new RpcError(null, RPCErrorCode.ServerError, 'Unauthorized');
    }

    const isAdmin = roles.includes('admin');
    const isSelf = Number.isFinite(targetId) && userId === Number(targetId);

    if (!isAdmin && !isSelf) {
      throw new RpcError(null, RPCErrorCode.ServerError, 'Forbidden');
    }

    return true;
  }
}
