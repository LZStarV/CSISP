import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import type {
  AuthForgotChallengeRequest,
  AuthForgotInitRequest,
  AuthForgotVerifyRequest,
  AuthMultifactorRequest,
  AuthSessionRequest,
} from '@csisp-api/idp-server';
import { UseGuards } from '@nestjs/common';
import { Body, Post, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';

import { AuthService } from './auth.service';
import { CreateExchangeCodeDto } from './dto/create-exchange-code.dto';
import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendSignupOtpDto } from './dto/resend-signup-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';

@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async authLogin(
    @Body(RequestBodyPipe) loginInternalDto: LoginInternalDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.loginEmailPassword(loginInternalDto, response);
  }

  @Post('register')
  async authRegister(@Body(RequestBodyPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verifySignupOtp')
  async authVerifySignupOtp(
    @Body(RequestBodyPipe) verifySignupOtpDto: VerifySignupOtpDto
  ) {
    return this.authService.verifySignupOtp(verifySignupOtpDto);
  }

  @Post('resendSignupOtp')
  async authResendSignupOtp(
    @Body(RequestBodyPipe) resendSignupOtpDto: ResendSignupOtpDto
  ) {
    return this.authService.resendSignupOtp(resendSignupOtpDto);
  }

  @Post('send-otp')
  async authSendOtp(@Req() request: ExpressRequest) {
    return this.authService.sendOtpStepUp(request);
  }

  @Post('verify-otp')
  async authVerifyOtp(
    @Body(RequestBodyPipe) verifyOtpDto: VerifyOtpDto,
    @Req() request: ExpressRequest
  ) {
    return this.authService.verifyOtpStepUp(verifyOtpDto, request);
  }

  @Post('createExchangeCode')
  async authCreateExchangeCode(
    @Body(RequestBodyPipe) createExchangeCodeDto: CreateExchangeCodeDto,
    @Req() request: ExpressRequest
  ) {
    return this.authService.createExchangeCode(createExchangeCodeDto, request);
  }

  @Post('multifactor')
  async authMultifactor(
    @Body(RequestBodyPipe) authMultifactorRequest: AuthMultifactorRequest,
    @Req() request: ExpressRequest
  ) {
    return this.authService.multifactor(authMultifactorRequest, request.res);
  }

  @Post('reset_password')
  async authResetPassword(
    @Body(RequestBodyPipe) resetPasswordDto: ResetPasswordDto
  ) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('enter')
  async authEnter(
    @Body(RequestBodyPipe) enterDto: EnterDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    const uid = (request as any).idpUserId;
    return this.authService.enter(enterDto, response, uid);
  }

  @Post('mfa_methods')
  async authMfaMethods(@Req() request: ExpressRequest) {
    const sid = (request as any).idpSession;
    return this.authService.mfaMethodsBySession(sid);
  }

  @Post('forgot_init')
  async authForgotInit(
    @Body(RequestBodyPipe) authForgotInitRequest: AuthForgotInitRequest
  ) {
    return this.authService.forgotInit(authForgotInitRequest);
  }

  @Post('forgot_challenge')
  async authForgotChallenge(
    @Body(RequestBodyPipe)
    authForgotChallengeRequest: AuthForgotChallengeRequest
  ) {
    return this.authService.forgotChallenge(authForgotChallengeRequest);
  }

  @Post('forgot_verify')
  async authForgotVerify(
    @Body(RequestBodyPipe) authForgotVerifyRequest: AuthForgotVerifyRequest
  ) {
    return this.authService.forgotVerify(authForgotVerifyRequest);
  }

  @Post('session')
  async authSession(
    @Body(RequestBodyPipe) _authSessionRequest: AuthSessionRequest,
    @Req() request: ExpressRequest
  ) {
    const uid = (request as any).idpUserId;
    return this.authService.session(uid);
  }
}
