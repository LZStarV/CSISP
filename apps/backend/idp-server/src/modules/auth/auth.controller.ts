import { ApiIdpController } from '@common/decorators/controller.decorator';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { Body, Post } from '@nestjs/common';

import { LoginInternalDto } from './dto/login-internal.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendLoginOtpDto } from './dto/send-login-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';
import {
  RegistrationService,
  LoginService,
  OtpService,
  PasswordResetService,
} from './service';

@ApiIdpController('auth')
export class AuthController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loginService: LoginService,
    private readonly otpService: OtpService,
    private readonly passwordResetService: PasswordResetService
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
  async authSendOtp(@Body(RequestBodyPipe) sendLoginOtpDto: SendLoginOtpDto) {
    return this.otpService.sendLoginOtp(sendLoginOtpDto);
  }

  @Post('verify-otp')
  async authVerifyOtp(@Body(RequestBodyPipe) verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyLoginOtp(verifyOtpDto);
  }

  @Post('reset_password')
  async authResetPassword(
    @Body(RequestBodyPipe) resetPasswordDto: ResetPasswordDto
  ) {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }
}
