import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { RPCErrorCode } from '../rpc/jsonrpc';
import { RpcError } from '../rpc/rpc-error';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const user = req.user;
    const roles: string[] = user?.roles ?? [];

    const hasRole = requiredRoles.some(role => roles.includes(role));
    if (!hasRole) {
      throw new RpcError(null, RPCErrorCode.ServerError, 'Forbidden', {
        requiredRoles,
        roles,
      });
    }

    return true;
  }
}
