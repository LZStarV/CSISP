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
import { BadRequestException } from '@nestjs/common';
import {
  Body,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { EnterDto } from './dto/enter.dto';
import { LoginDto } from './dto/login.dto';
import { MultifactorDto } from './dto/multifactor.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    const dto = plainToInstance(LoginDto, {
      studentId: params.studentId,
      password: params.password,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.login(dto, res);
  }

  @Post('multifactor')
  async multifactor(
    @Body(RpcRequestPipe) { params }: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const typeParsed = parseEnum(params.type, MFAType, MFAType.Sms);
    const dto = plainToInstance(MultifactorDto, {
      type: typeParsed,
      codeOrAssertion: params.codeOrAssertion,
      phoneOrEmail: params.phoneOrEmail,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.multifactor(dto, res);
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
    const dto = plainToInstance(ResetPasswordDto, {
      studentId: params.studentId,
      newPassword: params.newPassword,
      resetToken: params.resetToken,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.resetPassword({
      ...dto,
      reason: reasonParsed,
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
    const dto = plainToInstance(EnterDto, {
      state: params.state,
      ticket: params.ticket,
      studentId: params.studentId,
      redirectMode:
        typeof params.redirectMode === 'string'
          ? (params.redirectMode as string)
          : undefined,
    });
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.enter(dto as any, response, uid);
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
