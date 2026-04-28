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

import { CreateExchangeCodeDto } from './dto/create-exchange-code.dto';
import { EnterDto } from './dto/enter.dto';
import { LoginInternalDto } from './dto/login-internal.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendSignupOtpDto } from './dto/resend-signup-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';
import {
  SessionService,
  RegistrationService,
  LoginService,
  OtpService,
  PasswordResetService,
  OidcAuthService,
  MfaService,
  ForgotPasswordService,
} from './service';

@ApiIdpController('auth')
@UseGuards(IdpSessionGuard)
export class AuthController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loginService: LoginService,
    private readonly otpService: OtpService,
    private readonly passwordResetService: PasswordResetService,
    private readonly oidcAuthService: OidcAuthService,
    private readonly mfaService: MfaService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly sessionService: SessionService
  ) {}

  @Post('login')
  async authLogin(
    @Body(RequestBodyPipe) loginInternalDto: LoginInternalDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.loginService.loginEmailPassword(loginInternalDto, response);
  }

  @Post('register')
  async authRegister(@Body(RequestBodyPipe) registerDto: RegisterDto) {
    return this.registrationService.register(registerDto);
  }

  @Post('verifySignupOtp')
  async authVerifySignupOtp(
    @Body(RequestBodyPipe) verifySignupOtpDto: VerifySignupOtpDto
  ) {
    return this.registrationService.verifySignupOtp(verifySignupOtpDto);
  }

  @Post('resendSignupOtp')
  async authResendSignupOtp(
    @Body(RequestBodyPipe) resendSignupOtpDto: ResendSignupOtpDto
  ) {
    return this.registrationService.resendSignupOtp(resendSignupOtpDto);
  }

  @Post('send-otp')
  async authSendOtp(@Req() request: ExpressRequest) {
    return this.otpService.sendOtpStepUp(request);
  }

  @Post('verify-otp')
  async authVerifyOtp(
    @Body(RequestBodyPipe) verifyOtpDto: VerifyOtpDto,
    @Req() request: ExpressRequest
  ) {
    return this.otpService.verifyOtpStepUp(verifyOtpDto, request);
  }

  @Post('createExchangeCode')
  async authCreateExchangeCode(
    @Body(RequestBodyPipe) createExchangeCodeDto: CreateExchangeCodeDto,
    @Req() request: ExpressRequest
  ) {
    return this.oidcAuthService.createExchangeCode(
      createExchangeCodeDto,
      request
    );
  }

  @Post('multifactor')
  async authMultifactor(
    @Body(RequestBodyPipe) authMultifactorRequest: AuthMultifactorRequest,
    @Req() request: ExpressRequest
  ) {
    return this.mfaService.multifactor(authMultifactorRequest, request.res);
  }

  @Post('reset_password')
  async authResetPassword(
    @Body(RequestBodyPipe) resetPasswordDto: ResetPasswordDto
  ) {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }

  @Post('enter')
  async authEnter(
    @Body(RequestBodyPipe) enterDto: EnterDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    const uid = (request as any).idpUserId;
    return this.oidcAuthService.enter(enterDto, response, uid);
  }

  @Post('mfa_methods')
  async authMfaMethods(@Req() request: ExpressRequest) {
    const sid = (request as any).idpSession;
    return this.mfaService.mfaMethodsBySession(sid);
  }

  @Post('forgot_init')
  async authForgotInit(
    @Body(RequestBodyPipe) authForgotInitRequest: AuthForgotInitRequest
  ) {
    return this.forgotPasswordService.forgotInit(authForgotInitRequest);
  }

  @Post('forgot_challenge')
  async authForgotChallenge(
    @Body(RequestBodyPipe)
    authForgotChallengeRequest: AuthForgotChallengeRequest
  ) {
    return this.forgotPasswordService.forgotChallenge(
      authForgotChallengeRequest
    );
  }

  @Post('forgot_verify')
  async authForgotVerify(
    @Body(RequestBodyPipe) authForgotVerifyRequest: AuthForgotVerifyRequest
  ) {
    return this.forgotPasswordService.forgotVerify(authForgotVerifyRequest);
  }

  @Post('session')
  async authSession(
    @Body(RequestBodyPipe) _authSessionRequest: AuthSessionRequest,
    @Req() request: ExpressRequest
  ) {
    const uid = (request as any).idpUserId;
    if (!uid) return { logged: false };
    const userId = await this.sessionService.get(String(uid));
    if (!userId) return { logged: false };
    const user = await this.registrationService.findUserById(userId);
    return {
      logged: true,
      student_id: user?.student_id ?? undefined,
    };
  }
}
