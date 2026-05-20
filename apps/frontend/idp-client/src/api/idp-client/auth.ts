import {
  IDP_CLIENT_PATH_PREFIX,
  type IdpClientAuthAction,
  type LoginParams,
  type LoginResult,
  type RegisterParams,
  type RegisterResult,
  type VerifySignupOtpParams,
  type VerifySignupOtpResult,
  type VerifyOtpParams,
  type VerifyOtpResult,
  type EnterParams,
  type ResetPasswordParams,
  type SendOtpResult,
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

  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    return await authCall<VerifyOtpResult>('verify-otp', params);
  },

  async sendOtp(): Promise<SendOtpResult> {
    return await authCall<SendOtpResult>('send-otp', {});
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
};
