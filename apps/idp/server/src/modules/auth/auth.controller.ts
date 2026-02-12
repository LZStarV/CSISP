import {
  auth as IdlAuth,
  MfaMethodsResult,
  SessionResult,
  RSATokenResult,
  LoginResult,
  Next,
  MFAType,
  ResetReason,
} from '@csisp/idl/idp';
import { Body, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';

import { ApiIdpController } from '../../common/decorators/controller.decorator';
import { IdpSessionGuard } from '../../common/guards/idp-session.guard';
import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';
import { getIdpLogger } from '../../infra/logger';
import { del as redisDel } from '../../infra/redis';
import { parseEnum } from '../../utils/idl';

import { AuthService } from './auth.service';

type AuthActions = (typeof IdlAuth.methodNames)[number];
const logger = getIdpLogger('auth-controller');

function makeAuthDispatch(
  service: AuthService
): Record<
  AuthActions,
  (
    params: Record<string, unknown>,
    request: Request,
    response: Response
  ) => Promise<
    RSATokenResult | LoginResult | Next | MfaMethodsResult | SessionResult
  >
> {
  return {
    rsatoken: async (_params: Record<string, unknown>) => service.rsatoken({}),
    login: async (
      params: Record<string, unknown>,
      _request: Request,
      response: Response
    ) =>
      service.login(
        {
          studentId: String(params.studentId ?? ''),
          password: String(params.password ?? ''),
        },
        response
      ),
    multifactor: async (
      params: Record<string, unknown>,
      _request: Request,
      response: Response
    ) => {
      const typeParsed = parseEnum(params.type, MFAType, MFAType.Sms);
      return service.multifactor(
        {
          type: typeParsed,
          codeOrAssertion: String(params.codeOrAssertion ?? ''),
          phoneOrEmail: String(params.phoneOrEmail ?? ''),
        },
        response
      );
    },
    reset_password_request: async (params: Record<string, unknown>) => {
      return service.resetPasswordRequest({
        studentId: String(params.studentId ?? ''),
      });
    },
    reset_password: async (params: Record<string, unknown>) => {
      const reasonParsed = parseEnum(
        params.reason,
        ResetReason,
        ResetReason.WeakPassword
      );
      return service.resetPassword({
        studentId: String(params.studentId ?? ''),
        newPassword: String(params.newPassword ?? ''),
        reason: reasonParsed,
        resetToken: String((params as any).resetToken ?? ''),
      });
    },
    enter: async (
      params: Record<string, unknown>,
      request: Request,
      response: Response
    ) => {
      type IdpRequest = Request & { idpUserId?: number };
      const uid = (request as IdpRequest).idpUserId;
      return service.enter(
        {
          state: String(params.state ?? ''),
          ticket: params.ticket ? String(params.ticket) : undefined,
          studentId: params.studentId ? String(params.studentId) : undefined,
          redirectMode:
            typeof params.redirectMode === 'string'
              ? (params.redirectMode as string)
              : undefined,
        },
        response,
        uid
      );
    },
    mfa_methods: async (_params: Record<string, unknown>, request: Request) => {
      type IdpRequest = Request & { idpSession?: string };
      const sid = (request as IdpRequest).idpSession;
      const list = await service.mfaMethodsBySession(sid);
      return new MfaMethodsResult({ multifactor: list });
    },
    forgot_init: async (params: Record<string, unknown>) =>
      service.forgotInit({ studentId: String(params.studentId ?? '') }),
    forgot_challenge: async (params: Record<string, unknown>) =>
      service.forgotChallenge({
        type: String(params.type ?? ''),
        studentId: String(params.studentId ?? ''),
      }),
    forgot_verify: async (params: Record<string, unknown>) =>
      service.forgotVerify({
        type: String(params.type ?? ''),
        studentId: String(params.studentId ?? ''),
        code: String(params.code ?? ''),
      }),
    session: async (
      params: Record<string, unknown>,
      request: Request,
      response: Response
    ) => {
      type IdpRequest = Request & { idpUserId?: number; idpSession?: string };
      const req = request as IdpRequest;
      const logout = !!params?.logout;
      const sid = req.idpSession;
      if (logout && sid) {
        try {
          await redisDel(`idp:sess:${sid}`);
        } catch {}
        response.clearCookie?.('idp_session');
        return new SessionResult({ logged: false });
      }
      const uid = req.idpUserId;
      return service.session(uid);
    },
  } as any;
}

// 控制器说明：
// - 统一接收 JSON-RPC 风格的请求体，通过 RpcRequestPipe 校验并解析 { id, params }
// - 路由格式：POST /api/idp/auth/:action，其中 :action 为 rsatoken/login/multifactor/reset_password/enter
// - 使用 passthrough 响应以便在 enter 阶段设置 Cookie 后仍返回 JSON-RPC 响应
@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post(':action')
  async handle(
    @Param('action') action: string,
    @Body(new RpcRequestPipe())
    body: { id: string | number | null; params: any },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    // 入口日志（不记录敏感信息）
    logger.info(
      { action, id: body.id, hasParams: !!body.params },
      'request received'
    );
    const id = body.id;
    const params = body.params || {};
    type AuthActions = (typeof IdlAuth.methodNames)[number];

    const dispatch = makeAuthDispatch(this.service);
    const handler = dispatch[action as AuthActions];
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
