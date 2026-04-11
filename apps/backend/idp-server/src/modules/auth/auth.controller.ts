import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import type {
  AuthEnterRequest,
  AuthForgotChallengeRequest,
  AuthForgotInitRequest,
  AuthForgotVerifyRequest,
  AuthMultifactorRequest,
  AuthSessionRequest,
} from '@csisp-api/idp-server';
import { UseGuards } from '@nestjs/common';
import { Body, Post, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';

import { AuthApiImpl } from './auth-api.impl';
import { CreateExchangeCodeDto } from './dto/create-exchange-code.dto';
import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendSignupOtpDto } from './dto/resend-signup-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';

/**
 * AuthController 实现：采用纯 REST 接口契约
 * - 实现由 OpenAPI 生成的 AuthApi 抽象类
 * - 保持 /api/idp/auth/:action 的路由兼容性
 */
@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
export class AuthController {
  constructor(private readonly authApi: AuthApiImpl) {}

  private getTraceId(request: ExpressRequest): string | undefined {
    const traceIdHeader = request.headers['x-trace-id'];
    return typeof traceIdHeader === 'string' ? traceIdHeader : undefined;
  }

  /**
   * Request 类型桥接（伪装端）
   * 将 NestJS 实际注入的 ExpressRequest 强转为 OpenAPI 契约要求的全局 Request 类型。
   * 解决 typescript-nestjs-server 生成的标准 Web Request 类型与 Express 特性需求之间的编译期类型冲突。
   */
  private toContractRequest(request: ExpressRequest): Request {
    return request as unknown as Request;
  }

  @Post('login')
  async authLogin(
    @Body(RequestBodyPipe) loginInternalDto: LoginInternalDto,
    @Res({ passthrough: true }) _response: Response,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authLogin(
      {
        loginInternalDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('register')
  async authRegister(
    @Body(RequestBodyPipe) registerDto: RegisterDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authRegister(
      {
        registerDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('verifySignupOtp')
  async authVerifySignupOtp(
    @Body(RequestBodyPipe) verifySignupOtpDto: VerifySignupOtpDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authVerifySignupOtp(
      {
        verifySignupOtpDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('resendSignupOtp')
  async authResendSignupOtp(
    @Body(RequestBodyPipe) resendSignupOtpDto: ResendSignupOtpDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authResendSignupOtp(
      {
        resendSignupOtpDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('send-otp')
  async authSendOtp(@Req() request: ExpressRequest) {
    return this.authApi.authSendOtp(
      { xTraceId: this.getTraceId(request) },
      this.toContractRequest(request)
    );
  }

  @Post('verify-otp')
  async authVerifyOtp(
    @Body(RequestBodyPipe) verifyOtpDto: VerifyOtpDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authVerifyOtp(
      {
        verifyOtpDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('createExchangeCode')
  async authCreateExchangeCode(
    @Body(RequestBodyPipe) createExchangeCodeDto: CreateExchangeCodeDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authCreateExchangeCode(
      {
        createExchangeCodeDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('multifactor')
  async authMultifactor(
    @Body(RequestBodyPipe) authMultifactorRequest: AuthMultifactorRequest,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authMultifactor(
      {
        authMultifactorRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('reset_password')
  async authResetPassword(
    @Body(RequestBodyPipe) resetPasswordDto: ResetPasswordDto,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authResetPassword(
      {
        resetPasswordDto,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('enter')
  async authEnter(
    @Body(RequestBodyPipe) enterDto: EnterDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) _response: Response
  ) {
    return this.authApi.authEnter(
      {
        authEnterRequest: enterDto as AuthEnterRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('mfa_methods')
  async authMfaMethods(@Req() request: ExpressRequest) {
    return this.authApi.authMfaMethods(
      { xTraceId: this.getTraceId(request) },
      this.toContractRequest(request)
    );
  }

  @Post('forgot_init')
  async authForgotInit(
    @Body(RequestBodyPipe) authForgotInitRequest: AuthForgotInitRequest,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authForgotInit(
      {
        authForgotInitRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('forgot_challenge')
  async authForgotChallenge(
    @Body(RequestBodyPipe)
    authForgotChallengeRequest: AuthForgotChallengeRequest,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authForgotChallenge(
      {
        authForgotChallengeRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('forgot_verify')
  async authForgotVerify(
    @Body(RequestBodyPipe) authForgotVerifyRequest: AuthForgotVerifyRequest,
    @Req() request: ExpressRequest
  ) {
    return this.authApi.authForgotVerify(
      {
        authForgotVerifyRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }

  @Post('session')
  async authSession(
    @Body(RequestBodyPipe) authSessionRequest: AuthSessionRequest,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) _response: Response
  ) {
    return this.authApi.authSession(
      {
        authSessionRequest,
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }
}
