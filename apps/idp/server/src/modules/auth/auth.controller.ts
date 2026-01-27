import { Body, Controller, Param, Post, UsePipes, Res } from '@nestjs/common';
import type { Response } from 'express';

import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';

import { AuthService } from './auth.service';

@Controller('api/idp/auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post(':action')
  @UsePipes(new RpcRequestPipe())
  async handle(
    @Param('action') action: string,
    @Body() body: { id: string | number | null; params: any },
    @Res() res: Response
  ) {
    const id = body.id;
    const params = body.params;
    let result: any;

    switch (action) {
      case 'rsatoken':
        result = await this.svc.rsatoken(params);
        break;
      case 'login':
        result = await this.svc.login(params);
        break;
      case 'multifactor':
        result = await this.svc.multifactor(params);
        break;
      case 'reset_password':
        result = await this.svc.resetPassword(params);
        break;
      case 'enter':
        result = await this.svc.enter(params, res);
        break;
      default:
        return makeRpcError(id, -32601, 'Method not found');
    }

    return makeRpcResponse(id, result);
  }
}
