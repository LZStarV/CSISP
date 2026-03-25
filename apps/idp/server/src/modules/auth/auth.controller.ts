import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import {
  UseRpcDtoValidation,
  RpcDtoValidationInterceptor,
} from '@common/rpc/dto-validation.interceptor';
import { AuthErrorCode, JsonRpcAuthException } from '@common/rpc/error-codes';
import { JsonRpcInterceptor } from '@common/rpc/json-rpc.interceptor';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { parseEnum } from '@csisp/utils';
import { RedisPrefix } from '@idp-types/redis';
import { ResetReason } from '@modules/auth/enums';
import { Inject } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import {
  Body,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { CreateExchangeCodeDto } from './dto/create-exchange-code.dto';
import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendSignupOtpDto } from './dto/resend-signup-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';

/**
 * AuthController 重构：采用声明式路由与拦截器模式
 * - 移除手动的 makeAuthDispatch 映射表
 * - 利用 JsonRpcInterceptor 自动包装响应体
 * - 保持 /api/idp/auth/:action 的路由兼容性
 */
@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
@UseInterceptors(JsonRpcInterceptor, RpcDtoValidationInterceptor)
@UseRpcDtoValidation({
  login: LoginInternalDto,
  verifyOtp: VerifyOtpDto,
  createExchangeCode: CreateExchangeCodeDto,
  resetPassword: ResetPasswordDto,
  enter: EnterDto,
  register: RegisterDto,
  verifySignupOtp: VerifySignupOtpDto,
  resendSignupOtp: ResendSignupOtpDto,
})
export class AuthController {
  constructor(
    private readonly service: AuthService,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  @Post('rsatoken')
  async rsatoken() {
    return this.service.rsatoken({});
  }

  @Post('login')
  async login(
    @Body(RpcRequestPipe) { params }: any,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.service.loginEmailPassword(params as LoginInternalDto, res);
  }

  @Post('register')
  async register(@Body(RpcRequestPipe) { params }: any) {
    return this.service.register(params as RegisterDto);
  }

  @Post('verifySignupOtp')
  async verifySignupOtp(@Body(RpcRequestPipe) { params }: any) {
    const dto = plainToInstance(VerifySignupOtpDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.verifySignupOtp(dto as any);
  }

  @Post('resendSignupOtp')
  async resendSignupOtp(@Body(RpcRequestPipe) { params }: any) {
    const dto = plainToInstance(ResendSignupOtpDto, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) throw new BadRequestException('Invalid params');
    return this.service.resendSignupOtp(dto as any);
  }

  @Post('send-otp')
  async sendOtp(@Body(RpcRequestPipe) _body: any, @Req() req: Request) {
    return this.service.sendOtpStepUp(req);
  }

  @Post('verify-otp')
  async verifyOtp(@Body(RpcRequestPipe) { params }: any, @Req() req: Request) {
    return this.service.verifyOtpStepUp(params as VerifyOtpDto, req);
  }

  @Post('createExchangeCode')
  async createExchangeCode(
    @Body(RpcRequestPipe) { params }: any,
    @Req() req: Request
  ) {
    return this.service.createExchangeCode(
      params as CreateExchangeCodeDto,
      req
    );
  }

  @Post('multifactor')
  async multifactor(
    @Body(RpcRequestPipe) { params: _params }: any,
    @Res({ passthrough: true }) _res: Response
  ) {
    throw new JsonRpcAuthException(
      AuthErrorCode.UNAUTHORIZED,
      'Not implemented',
      HttpStatus.NOT_IMPLEMENTED
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
    return { multifactor: list };
  }

  @Post('forgot_init')
  async forgotInit(@Body(RpcRequestPipe) { params }: any) {
    const email = typeof params.email === 'string' ? params.email : '';
    return this.service.forgotInit({ email });
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
        await this.kv.del(`${RedisPrefix.IdpSession}${sid}`);
      } catch {}
      response.clearCookie?.('idp_session');
      return { logged: false };
    }
    const uid = req.idpUserId;
    return this.service.session(uid);
  }
}
