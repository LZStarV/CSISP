import { ApiIdpController } from '@common/decorators/controller.decorator';
import { IdpSessionGuard } from '@common/guards/idp-session.guard';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { UseGuards } from '@nestjs/common';
import { Body, Post, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';

import { LoginInternalDto } from './dto/login-internal.dto';
import { AuthLogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';
import {
  RegistrationService,
  LoginService,
  OtpService,
  LogoutService,
} from './service';

@ApiIdpController('auth')
export class AuthController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loginService: LoginService,
    private readonly otpService: OtpService,
    private readonly logoutService: LogoutService
  ) {}

  @Post('login')
  async authLogin(@Body(RequestBodyPipe) loginInternalDto: LoginInternalDto) {
    return this.loginService.loginEmailPassword(loginInternalDto);
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

  @Post('send-otp')
  async authSendOtp(@Body(RequestBodyPipe) body: { tempToken: string }) {
    return this.otpService.sendOtpStepUp(body);
  }

  @Post('verify-otp')
  async authVerifyOtp(
    @Body(RequestBodyPipe) verifyOtpDto: VerifyOtpDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.otpService.verifyOtpStepUp(verifyOtpDto, request, response);
  }

  @Post('reset_password')
  @UseGuards(IdpSessionGuard)
  async authLogout(
    @Body(RequestBodyPipe) authLogoutDto: AuthLogoutDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.logoutService.logout(authLogoutDto, request, response);
  }

  @Post('session')
  @UseGuards(IdpSessionGuard)
  async authSession(@Req() request: ExpressRequest) {
    const uid = (request as any).idpUserId;
    if (!uid) return { logged: false };
    const user = await this.registrationService.findUserById(uid);
    return {
      logged: true,
      student_id: user?.student_id ?? undefined,
    };
  }
}
