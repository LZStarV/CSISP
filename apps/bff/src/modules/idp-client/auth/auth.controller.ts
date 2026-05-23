import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  EnterParams,
  IDP_CLIENT_AUTH_ACTION,
  IDP_CLIENT_AUTH_PATH_PREFIX,
  IDP_CLIENT_PATH_PREFIX,
  LoginParams,
  RegisterParams,
  ResetPasswordParams,
  SendOtpParams,
  VerifyOtpParams,
  VerifySignupOtpParams,
  enterBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  sendOtpBodySchema,
  verifyOtpBodySchema,
  verifySignupOtpBodySchema,
} from '@csisp/contracts';
import { AuthService } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const IDP_AUTH_CONTROLLER_PREFIX = `${IDP_CLIENT_PATH_PREFIX}${IDP_CLIENT_AUTH_PATH_PREFIX}`;

@Controller(IDP_AUTH_CONTROLLER_PREFIX)
export class IdpAuthController {
  private readonly logger = getBffLogger('idp-auth');

  constructor(private readonly authService: AuthService) {}

  private logAction(action: string) {
    this.logger.info({ action }, 'IDP auth proxy request');
  }

  @Post(IDP_CLIENT_AUTH_ACTION.LOGIN)
  async authLogin(
    @Body(new ZodValidationPipe(loginBodySchema))
    loginInternalDto: LoginParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.LOGIN);
    return firstValueFrom(
      this.authService
        .authLogin({ LoginInternalDto: loginInternalDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.REGISTER)
  async authRegister(
    @Body(new ZodValidationPipe(registerBodySchema))
    registerDto: RegisterParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.REGISTER);
    return firstValueFrom(
      this.authService
        .authRegister({ RegisterDto: registerDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.VERIFY_SIGNUP_OTP)
  async authVerifySignupOtp(
    @Body(new ZodValidationPipe(verifySignupOtpBodySchema))
    verifySignupOtpDto: VerifySignupOtpParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.VERIFY_SIGNUP_OTP);
    return firstValueFrom(
      this.authService
        .authVerifySignupOtp({ VerifySignupOtpDto: verifySignupOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.SEND_OTP)
  async authSendOtp(
    @Body(new ZodValidationPipe(sendOtpBodySchema))
    sendOtpDto: SendOtpParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.SEND_OTP);
    return firstValueFrom(
      this.authService
        .authSendOtp({ AuthSendOtpRequest: sendOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.VERIFY_OTP)
  async authVerifyOtp(
    @Body(new ZodValidationPipe(verifyOtpBodySchema))
    verifyOtpDto: VerifyOtpParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.VERIFY_OTP);
    return firstValueFrom(
      this.authService
        .authVerifyOtp({ VerifyOtpDto: verifyOtpDto })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.RESET_PASSWORD)
  async authResetPassword(
    @Body(new ZodValidationPipe(resetPasswordBodySchema))
    resetPasswordDto: ResetPasswordParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.RESET_PASSWORD);
    return firstValueFrom(
      this.authService
        .authResetPassword({
          ResetPasswordDto: resetPasswordDto,
        })
        .pipe(map(res => res.data))
    );
  }

  @Post(IDP_CLIENT_AUTH_ACTION.ENTER)
  async authEnter(
    @Body(new ZodValidationPipe(enterBodySchema))
    authEnterRequest: EnterParams
  ) {
    this.logAction(IDP_CLIENT_AUTH_ACTION.ENTER);
    return firstValueFrom(
      this.authService
        .authEnter({ AuthEnterRequest: authEnterRequest })
        .pipe(map(res => res.data))
    );
  }
}
