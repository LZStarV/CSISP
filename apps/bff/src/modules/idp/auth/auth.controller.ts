import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  CreateExchangeCodeParams,
  EnterParams,
  ForgotChallengeParams,
  ForgotInitParams,
  ForgotVerifyParams,
  IDP_AUTH_ACTION,
  IDP_AUTH_PATH_PREFIX,
  IDP_PATH_PREFIX,
  LoginParams,
  MultifactorParams,
  RegisterParams,
  ResetPasswordParams,
  ResendSignupOtpParams,
  SessionParams,
  VerifyOtpParams,
  VerifySignupOtpParams,
  createExchangeCodeBodySchema,
  enterBodySchema,
  forgotChallengeBodySchema,
  forgotInitBodySchema,
  forgotVerifyBodySchema,
  loginBodySchema,
  multifactorBodySchema,
  registerBodySchema,
  resendSignupOtpBodySchema,
  resetPasswordBodySchema,
  sessionBodySchema,
  verifyOtpBodySchema,
  verifySignupOtpBodySchema,
} from '@csisp/contracts';
import { AuthService } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const IDP_AUTH_CONTROLLER_PREFIX = `${IDP_PATH_PREFIX}${IDP_AUTH_PATH_PREFIX}`;

@Controller(IDP_AUTH_CONTROLLER_PREFIX)
export class IdpAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(IDP_AUTH_ACTION.LOGIN)
  async authLogin(
    @Body(new ZodValidationPipe(loginBodySchema))
    loginInternalDto: LoginParams
  ) {
    return firstValueFrom(
      this.authService
        .authLogin({ LoginInternalDto: loginInternalDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.REGISTER)
  async authRegister(
    @Body(new ZodValidationPipe(registerBodySchema))
    registerDto: RegisterParams
  ) {
    return firstValueFrom(
      this.authService
        .authRegister({ RegisterDto: registerDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.VERIFY_SIGNUP_OTP)
  async authVerifySignupOtp(
    @Body(new ZodValidationPipe(verifySignupOtpBodySchema))
    verifySignupOtpDto: VerifySignupOtpParams
  ) {
    return firstValueFrom(
      this.authService
        .authVerifySignupOtp({ VerifySignupOtpDto: verifySignupOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.RESEND_SIGNUP_OTP)
  async authResendSignupOtp(
    @Body(new ZodValidationPipe(resendSignupOtpBodySchema))
    resendSignupOtpDto: ResendSignupOtpParams
  ) {
    return firstValueFrom(
      this.authService
        .authResendSignupOtp({ ResendSignupOtpDto: resendSignupOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.SEND_OTP)
  async authSendOtp() {
    return firstValueFrom(
      this.authService.authSendOtp({}).pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.VERIFY_OTP)
  async authVerifyOtp(
    @Body(new ZodValidationPipe(verifyOtpBodySchema))
    verifyOtpDto: VerifyOtpParams
  ) {
    return firstValueFrom(
      this.authService
        .authVerifyOtp({ VerifyOtpDto: verifyOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.CREATE_EXCHANGE_CODE)
  async authCreateExchangeCode(
    @Body(new ZodValidationPipe(createExchangeCodeBodySchema))
    createExchangeCodeDto: CreateExchangeCodeParams
  ) {
    return firstValueFrom(
      this.authService
        .authCreateExchangeCode({
          CreateExchangeCodeDto: createExchangeCodeDto,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.MULTIFACTOR)
  async authMultifactor(
    @Body(new ZodValidationPipe(multifactorBodySchema))
    authMultifactorRequest: MultifactorParams
  ) {
    return firstValueFrom(
      this.authService
        .authMultifactor({
          AuthMultifactorRequest: authMultifactorRequest,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.RESET_PASSWORD)
  async authResetPassword(
    @Body(new ZodValidationPipe(resetPasswordBodySchema))
    resetPasswordDto: ResetPasswordParams
  ) {
    return firstValueFrom(
      this.authService
        .authResetPassword({
          ResetPasswordDto: resetPasswordDto,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.ENTER)
  async authEnter(
    @Body(new ZodValidationPipe(enterBodySchema))
    authEnterRequest: EnterParams
  ) {
    return firstValueFrom(
      this.authService
        .authEnter({ AuthEnterRequest: authEnterRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.MFA_METHODS)
  async authMfaMethods() {
    return firstValueFrom(
      this.authService.authMfaMethods({}).pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.FORGOT_INIT)
  async authForgotInit(
    @Body(new ZodValidationPipe(forgotInitBodySchema))
    authForgotInitRequest: ForgotInitParams
  ) {
    return firstValueFrom(
      this.authService
        .authForgotInit({
          AuthForgotInitRequest: authForgotInitRequest,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.FORGOT_CHALLENGE)
  async authForgotChallenge(
    @Body(new ZodValidationPipe(forgotChallengeBodySchema))
    authForgotChallengeRequest: ForgotChallengeParams
  ) {
    return firstValueFrom(
      this.authService
        .authForgotChallenge({
          AuthForgotChallengeRequest: authForgotChallengeRequest,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.FORGOT_VERIFY)
  async authForgotVerify(
    @Body(new ZodValidationPipe(forgotVerifyBodySchema))
    authForgotVerifyRequest: ForgotVerifyParams
  ) {
    return firstValueFrom(
      this.authService
        .authForgotVerify({ AuthForgotVerifyRequest: authForgotVerifyRequest })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_AUTH_ACTION.SESSION)
  async authSession(
    @Body(new ZodValidationPipe(sessionBodySchema))
    authSessionRequest: SessionParams
  ) {
    return firstValueFrom(
      this.authService
        .authSession({ AuthSessionRequest: authSessionRequest })
        .pipe(map(res => res.data))
    );
  }
}
