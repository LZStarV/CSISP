import { call, hasError } from '@csisp/rpc/client-fetch';

import { config } from '@/config';

const IDP_PREFIX: string = config.routes.apiPrefix;
const AUTH_SERVICE = 'auth';
const OIDC_SERVICE = 'oidc';

type LoginInternalParams = {
  email: string;
  password: string;
};
type LoginInternalResult = {
  stepUp?: 'PENDING_PASSWORD';
  nextSteps?: string[];
};
type SendOtpResult = {
  ok: boolean;
};
type VerifyOtpParams = {
  token_hash: string;
  type: 'magic_link' | 'email';
};
type VerifyOtpResult = {
  verified: boolean;
};
type CreateExchangeCodeParams = {
  app_id: string;
  redirect_uri: string;
  state?: string;
};
type CreateExchangeCodeResult = {
  code: string;
  redirect_uri: string;
  state?: string;
};

// domain = auth
const authCall = function <T>(action: string, params?: unknown) {
  return call<T>(IDP_PREFIX, AUTH_SERVICE, action, params);
};

// domain = oidc
const oidcCall = function <T>(action: string, params?: unknown) {
  return call<T>(IDP_PREFIX, OIDC_SERVICE, action, params);
};

async function loginInternal(params: LoginInternalParams) {
  return authCall<LoginInternalResult>('login', params);
}
async function sendOtp() {
  return authCall<SendOtpResult>('send-otp', {});
}
async function verifyOtp(params: VerifyOtpParams) {
  return authCall<VerifyOtpResult>('verify-otp', params);
}
async function createExchangeCode(params: CreateExchangeCodeParams) {
  return authCall<CreateExchangeCodeResult>('createExchangeCode', params);
}

export {
  authCall,
  oidcCall,
  hasError,
  loginInternal,
  sendOtp,
  verifyOtp,
  createExchangeCode,
};
