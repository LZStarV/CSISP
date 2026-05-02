import {
  IDP_CLIENT_PATH_PREFIX,
  type IdpClientAuthAction,
  type LoginParams,
  type LoginResult,
  type RegisterParams,
  type RegisterResult,
  type VerifySignupOtpParams,
  type VerifySignupOtpResult,
  type ResendSignupOtpParams,
  type ResendSignupOtpResult,
  type SendOtpResult,
  type VerifyOtpParams,
  type VerifyOtpResult,
  type CreateExchangeCodeParams,
  type CreateExchangeCodeResult,
  type MultifactorParams,
  type EnterParams,
  type ResetPasswordParams,
  type MfaMethodsResult,
  type ForgotInitParams,
  type ForgotInitResult,
  type ForgotChallengeParams,
  type ForgotVerifyParams,
  type ForgotVerifyResult,
  type ResendLoginOtpResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const authCall = createDomainCall<IdpClientAuthAction>(
  IDP_CLIENT_PATH_PREFIX,
  'auth'
);

export const idpClientAuthApi = {
  async login(params: LoginParams): Promise<LoginResult> {
    return await authCall<LoginResult>('login', params);
  },

  async register(params: RegisterParams): Promise<RegisterResult> {
    return await authCall<RegisterResult>('register', params);
  },

  async verifySignupOtp(
    params: VerifySignupOtpParams
  ): Promise<VerifySignupOtpResult> {
    return await authCall<VerifySignupOtpResult>('verifySignupOtp', params);
  },

  async resendSignupOtp(
    params: ResendSignupOtpParams
  ): Promise<ResendSignupOtpResult> {
    return await authCall<ResendSignupOtpResult>('resendSignupOtp', params);
  },

  async sendOtp(): Promise<SendOtpResult> {
    return await authCall<SendOtpResult>('send-otp', {});
  },

  async resendLoginOtp(): Promise<ResendLoginOtpResult> {
    return await authCall<ResendLoginOtpResult>('resendLoginOtp', {});
  },

  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    return await authCall<VerifyOtpResult>('verify-otp', params);
  },

  async createExchangeCode(
    params: CreateExchangeCodeParams
  ): Promise<CreateExchangeCodeResult> {
    return await authCall<CreateExchangeCodeResult>(
      'createExchangeCode',
      params
    );
  },

  async multifactor(params: MultifactorParams) {
    return await authCall('multifactor', params);
  },

  async resetPassword(params: ResetPasswordParams) {
    return await authCall('reset_password', params);
  },

  async enter(params: EnterParams) {
    return (await authCall('enter', params)) as {
      redirectTo?: string;
      nextSteps?: string[];
    };
  },

  async mfaMethods(): Promise<MfaMethodsResult> {
    return await authCall<MfaMethodsResult>('mfa_methods', {});
  },

  async forgotInit(params: ForgotInitParams): Promise<ForgotInitResult> {
    return await authCall<ForgotInitResult>('forgot_init', params);
  },

  async forgotChallenge(params: ForgotChallengeParams) {
    return await authCall('forgot_challenge', params);
  },

  async forgotVerify(params: ForgotVerifyParams): Promise<ForgotVerifyResult> {
    return await authCall<ForgotVerifyResult>('forgot_verify', params);
  },
};
