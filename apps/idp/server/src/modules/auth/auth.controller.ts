import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';
import { getIdpLogger } from '../../infra/logger';

import { AuthService } from './auth.service';

// 控制器说明：
// - 统一接收 JSON-RPC 风格的请求体，通过 RpcRequestPipe 校验并解析 { id, params }
// - 路由格式：POST /api/idp/auth/:action，其中 :action 为 rsatoken/login/multifactor/reset_password/enter
// - 使用 passthrough 响应以便在 enter 阶段设置 Cookie 后仍返回 JSON-RPC 响应
@Controller('auth')
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
    // 入口日志（不记录敏感信息）
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
        logger.warn({ action }, 'method not found');
        return makeRpcError(id, -32601, 'Method not found');
    }
    // 完成日志
    logger.info({ action, id }, 'request completed');
    return makeRpcResponse(id, result);
  }
}
