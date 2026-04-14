import {
  AuthEnterRequest,
  AuthForgotChallengeRequest,
  AuthForgotInitRequest,
  AuthForgotVerifyRequest,
  AuthMultifactorRequest,
  AuthService,
  AuthSessionRequest,
  CreateExchangeCodeDto,
  LoginInternalDto,
  RegisterDto,
  ResendSignupOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
  VerifySignupOtpDto,
} from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

@Controller('idp/auth')
export class IdpAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async authLogin(@Body() loginInternalDto: LoginInternalDto) {
    return firstValueFrom(
      this.authService
        .authLogin({ LoginInternalDto: loginInternalDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('register')
  async authRegister(@Body() registerDto: RegisterDto) {
    return firstValueFrom(
      this.authService
        .authRegister({ RegisterDto: registerDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('verifySignupOtp')
  async authVerifySignupOtp(@Body() verifySignupOtpDto: VerifySignupOtpDto) {
    return firstValueFrom(
      this.authService
        .authVerifySignupOtp({ VerifySignupOtpDto: verifySignupOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('resendSignupOtp')
  async authResendSignupOtp(@Body() resendSignupOtpDto: ResendSignupOtpDto) {
    return firstValueFrom(
      this.authService
        .authResendSignupOtp({ ResendSignupOtpDto: resendSignupOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('send-otp')
  async authSendOtp() {
    return firstValueFrom(
      this.authService.authSendOtp({}).pipe(map(res => res.data))
    );
  }

  @Post('verify-otp')
  async authVerifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return firstValueFrom(
      this.authService
        .authVerifyOtp({ VerifyOtpDto: verifyOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('createExchangeCode')
  async authCreateExchangeCode(
    @Body() createExchangeCodeDto: CreateExchangeCodeDto
  ) {
    return firstValueFrom(
      this.authService
        .authCreateExchangeCode({
          CreateExchangeCodeDto: createExchangeCodeDto,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post('multifactor')
  async authMultifactor(
    @Body() authMultifactorRequest: AuthMultifactorRequest
  ) {
    return firstValueFrom(
      this.authService
        .authMultifactor({ AuthMultifactorRequest: authMultifactorRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post('reset_password')
  async authResetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return firstValueFrom(
      this.authService
        .authResetPassword({ ResetPasswordDto: resetPasswordDto })
        .pipe(map(res => res.data))
    );
  }

  @Post('enter')
  async authEnter(@Body() authEnterRequest: AuthEnterRequest) {
    return firstValueFrom(
      this.authService
        .authEnter({ AuthEnterRequest: authEnterRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post('mfa_methods')
  async authMfaMethods() {
    return firstValueFrom(
      this.authService.authMfaMethods({}).pipe(map(res => res.data))
    );
  }

  @Post('forgot_init')
  async authForgotInit(@Body() authForgotInitRequest: AuthForgotInitRequest) {
    return firstValueFrom(
      this.authService
        .authForgotInit({ AuthForgotInitRequest: authForgotInitRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post('forgot_challenge')
  async authForgotChallenge(
    @Body() authForgotChallengeRequest: AuthForgotChallengeRequest
  ) {
    return firstValueFrom(
      this.authService
        .authForgotChallenge({
          AuthForgotChallengeRequest: authForgotChallengeRequest,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post('forgot_verify')
  async authForgotVerify(
    @Body() authForgotVerifyRequest: AuthForgotVerifyRequest
  ) {
    return firstValueFrom(
      this.authService
        .authForgotVerify({ AuthForgotVerifyRequest: authForgotVerifyRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post('session')
  async authSession(@Body() authSessionRequest: AuthSessionRequest) {
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: authSessionRequest })
        .pipe(map(res => res.data))
    );
  }
}
