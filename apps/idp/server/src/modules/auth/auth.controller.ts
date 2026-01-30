import {
  MfaMethodsResult,
  SessionResult,
  RSATokenResult,
  LoginResult,
  Next,
  MFAType,
  ResetReason,
} from '@csisp/idl/idp';
import { AuthService as IdlAuth } from '@csisp/idl/idp';
import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { IdpSessionGuard } from '../../common/guards/idp-session.guard';
import { makeRpcError, makeRpcResponse } from '../../common/rpc/jsonrpc';
import { RpcRequestPipe } from '../../common/rpc/rpc-request.pipe';
import { getIdpLogger } from '../../infra/logger';
import { del as redisDel } from '../../infra/redis';

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
    const params = body.params || {};
    type AuthActions = (typeof IdlAuth.methodNames)[number];

    const dispatch: Record<
      AuthActions,
      (
        params: Record<string, unknown>,
        request: Request,
        response: Response
      ) => Promise<
        RSATokenResult | LoginResult | Next | MfaMethodsResult | SessionResult
      >
    > = {
      rsatoken: async _params => this.svc.rsatoken({}),
      login: async (params, _request, response) =>
        this.svc.login(
          {
            studentId: String(params.studentId ?? ''),
            password: String(params.password ?? ''),
          },
          response
        ),
      multifactor: async (params, _request, response) => {
        let typeParsed: MFAType;
        if (typeof params.type === 'string' && params.type in MFAType) {
          typeParsed = (MFAType as any)[params.type as keyof typeof MFAType];
        } else if (typeof params.type === 'number') {
          typeParsed = params.type as MFAType;
        } else {
          typeParsed = MFAType.Sms;
        }
        return this.svc.multifactor(
          {
            type: typeParsed,
            codeOrAssertion: String(params.codeOrAssertion ?? ''),
            phoneOrEmail: String(params.phoneOrEmail ?? ''),
          },
          response
        );
      },
      reset_password_request: async params => {
        return this.svc.resetPasswordRequest({
          studentId: String(params.studentId ?? ''),
        });
      },
      reset_password: async params => {
        let reasonParsed: ResetReason;
        if (typeof params.reason === 'string' && params.reason in ResetReason) {
          reasonParsed = (ResetReason as any)[
            params.reason as keyof typeof ResetReason
          ];
        } else if (typeof params.reason === 'number') {
          reasonParsed = params.reason as ResetReason;
        } else {
          reasonParsed = ResetReason.WeakPassword;
        }
        return this.svc.resetPassword({
          studentId: String(params.studentId ?? ''),
          newPassword: String(params.newPassword ?? ''),
          reason: reasonParsed,
          resetToken: String(params.resetToken ?? ''),
        });
      },
      enter: async (params, _request, response) =>
        this.svc.enter(
          {
            state: String(params.state ?? ''),
            redirectMode:
              typeof params.redirectMode === 'string'
                ? (params.redirectMode as string)
                : undefined,
          },
          response
        ),
      mfa_methods: async (_params, request) => {
        type IdpRequest = Request & { idpSession?: string };
        const sid = (request as IdpRequest).idpSession;
        const list = await this.svc.mfaMethodsBySession(sid);
        return new MfaMethodsResult({ multifactor: list });
      },
      forgot_init: async params =>
        this.svc.forgotInit({ studentId: String(params.studentId ?? '') }),
      forgot_challenge: async params =>
        this.svc.forgotChallenge({
          type: String(params.type ?? ''),
          studentId: String(params.studentId ?? ''),
        }),
      forgot_verify: async params =>
        this.svc.forgotVerify({
          type: String(params.type ?? ''),
          studentId: String(params.studentId ?? ''),
          code: String(params.code ?? ''),
        }),
      session: async (params, request, response) => {
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
        return this.svc.session(uid);
      },
    };
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
