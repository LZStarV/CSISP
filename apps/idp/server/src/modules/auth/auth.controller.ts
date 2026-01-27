import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';
import { getIdpLogger } from '../../infra/logger';

import { AuthService } from './auth.service';

@Controller('api/idp/auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post(':action')
  async handle(
    @Param('action') action: string,
    @Body(new RpcRequestPipe())
    body: { id: string | number | null; params: any },
    @Res({ passthrough: true }) res: Response
  ) {
    const logger = getIdpLogger('auth-controller');
    logger.info(
      { action, id: body.id, hasParams: !!body.params },
      'request received'
    );
    const id = body.id;
    const params = body.params;
    let result: any;
    switch (action) {
      case 'rsatoken':
        result = await this.svc.rsatoken(params);
        break;
      case 'login':
        logger.debug({ studentId: params?.studentId }, 'login attempt');
        result = await this.svc.login(params);
        break;
      case 'multifactor':
        logger.debug({ type: params?.type }, 'multifactor call');
        result = await this.svc.multifactor(params);
        break;
      case 'reset_password':
        logger.info({ studentId: params?.studentId }, 'reset password');
        result = await this.svc.resetPassword(params);
        break;
      case 'enter':
        logger.info({ studentId: params?.studentId }, 'enter');
        result = await this.svc.enter(params, res);
        break;
      default:
        logger.warn({ action }, 'method not found');
        return makeRpcError(id, -32601, 'Method not found');
    }
    logger.info({ action, id }, 'request completed');
    return makeRpcResponse(id, result);
  }
}
