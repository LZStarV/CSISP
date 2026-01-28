import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';

import { IdpSessionGuard } from '../../common/guards/idp-session.guard';
import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';
import { getIdpLogger } from '../../infra/logger';

import { AuthService } from './auth.service';

// 控制器说明：
// - 统一接收 JSON-RPC 风格的请求体，通过 RpcRequestPipe 校验并解析 { id, params }
// - 路由格式：POST /api/idp/auth/:action，其中 :action 为 rsatoken/login/multifactor/reset_password/enter
// - 使用 passthrough 响应以便在 enter 阶段设置 Cookie 后仍返回 JSON-RPC 响应
@Controller('auth')
@UseGuards(IdpSessionGuard)
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post(':action')
  async handle(
    @Param('action') action: string,
    @Body(new RpcRequestPipe())
    body: { id: string | number | null; params: any },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const logger = getIdpLogger('auth-controller');
    // 入口日志（不记录敏感信息）
    logger.info(
      { action, id: body.id, hasParams: !!body.params },
      'request received'
    );
    const id = body.id;
    const params = body.params;
    const dispatch: Record<
      string,
      (p: any, r: Request, s: Response) => Promise<any>
    > = {
      rsatoken: async p => this.svc.rsatoken(p),
      login: async (p, _r, s) => this.svc.login(p, s),
      multifactor: async (p, _r, s) => this.svc.multifactor(p, s),
      reset_password: async p => this.svc.resetPassword(p),
      enter: async (p, _r, s) => this.svc.enter(p, s),
      mfa_methods: async (_p, r) => {
        const sid = (r as any).idpSession as string | undefined;
        const list = await this.svc.mfaMethodsBySession(sid);
        return { multifactor: list };
      },
      session: async (_p, r) => {
        const uid = (r as any).idpUserId as number | undefined;
        return { logged: !!uid };
      },
    };
    const handler = dispatch[action];
    if (!handler) {
      logger.warn({ action }, 'method not found');
      return makeRpcError(id, -32601, 'Method not found');
    }
    const result = await handler(params, req, res);
    // 完成日志
    logger.info({ action, id }, 'request completed');
    return makeRpcResponse(id, result);
  }
}
