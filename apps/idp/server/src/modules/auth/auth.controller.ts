import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { JsonRpcInterceptor } from '@common/rpc/json-rpc.interceptor';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import {
  MFAType,
  MfaMethodsResult,
  ResetReason,
  SessionResult,
} from '@csisp/idl/idp';
import { parseEnum } from '@csisp/utils';
import { RedisPrefix } from '@idp-types/redis';
import { del as redisDel } from '@infra/redis';
import {
  Body,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';

/**
 * AuthController 重构：采用声明式路由与拦截器模式
 * - 移除手动的 makeAuthDispatch 映射表
 * - 利用 JsonRpcInterceptor 自动包装响应体
 * - 保持 /api/idp/auth/:action 的路由兼容性
 */
@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
@UseInterceptors(JsonRpcInterceptor)
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('rsatoken')
  async rsatoken() {
    return this.service.rsatoken({});
  }

  @Post('login')
  async login(
    @Body(RpcRequestPipe) { params }: any,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.service.login(
      {
        studentId: String(params.studentId ?? ''),
        password: String(params.password ?? ''),
      },
      res
    );
  }

  @Post('multifactor')
  async multifactor(
    @Body(RpcRequestPipe) { params }: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const typeParsed = parseEnum(params.type, MFAType, MFAType.Sms);
    return this.service.multifactor(
      {
        type: typeParsed,
        codeOrAssertion: String(params.codeOrAssertion ?? ''),
        phoneOrEmail: String(params.phoneOrEmail ?? ''),
      },
      res
    );
  }

  @Post('reset_password_request')
  async resetPasswordRequest(@Body(RpcRequestPipe) { params }: any) {
    return this.service.resetPasswordRequest({
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('reset_password')
  async resetPassword(@Body(RpcRequestPipe) { params }: any) {
    const reasonParsed = parseEnum(
      params.reason,
      ResetReason,
      ResetReason.WeakPassword
    );
    return this.service.resetPassword({
      studentId: String(params.studentId ?? ''),
      newPassword: String(params.newPassword ?? ''),
      reason: reasonParsed,
      resetToken: String(params.resetToken ?? ''),
    });
  }

  @Post('enter')
  async enter(
    @Body(RpcRequestPipe) { params }: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    type IdpRequest = Request & { idpUserId?: number };
    const uid = (request as IdpRequest).idpUserId;
    return this.service.enter(
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
  }

  @Post('mfa_methods')
  async mfaMethods(@Req() request: Request) {
    type IdpRequest = Request & { idpSession?: string };
    const sid = (request as IdpRequest).idpSession;
    const list = await this.service.mfaMethodsBySession(sid);
    return new MfaMethodsResult({ multifactor: list });
  }

  @Post('forgot_init')
  async forgotInit(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotInit({
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('forgot_challenge')
  async forgotChallenge(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotChallenge({
      type: String(params.type ?? ''),
      studentId: String(params.studentId ?? ''),
    });
  }

  @Post('forgot_verify')
  async forgotVerify(@Body(RpcRequestPipe) { params }: any) {
    return this.service.forgotVerify({
      type: String(params.type ?? ''),
      studentId: String(params.studentId ?? ''),
      code: String(params.code ?? ''),
    });
  }

  @Post('session')
  async session(
    @Body(RpcRequestPipe) { params }: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    type IdpRequest = Request & { idpUserId?: number; idpSession?: string };
    const req = request as IdpRequest;
    const logout = !!params?.logout;
    const sid = req.idpSession;
    if (logout && sid) {
      try {
        await redisDel(`${RedisPrefix.IdpSession}${sid}`);
      } catch {}
      response.clearCookie?.('idp_session');
      return new SessionResult({ logged: false });
    }
    const uid = req.idpUserId;
    return this.service.session(uid);
  }
}
