import { call, hasError } from '@csisp/http/client-fetch';

import { config } from '@/config';

const IDP_PREFIX: string = config.routes.apiPrefix;
const AUTH_SERVICE = 'auth';
const OIDC_SERVICE = 'oidc';

type RegisterParams = {
  email: string;
  password: string;
  student_id: string;
  display_name?: string;
  redirect_uri?: string;
};
type RegisterResult = {
  ok: boolean;
  next: string;
  emailRedirectTo: string;
};
type RegisterStatusParams = { email: string };
type RegisterStatusResult = { confirmed: boolean };
type RegisterFinalizeParams = { email: string };
type RegisterFinalizeResult = { ok: boolean; written: boolean };
type VerifySignupOtpParams = { email: string; token: string };
type VerifySignupOtpResult = { verified: boolean };
type ResendSignupOtpParams = { email: string };
type ResendSignupOtpResult = { ok: boolean };
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

export {
  authCall,
  oidcCall,
  hasError,
  LoginInternalParams,
  LoginInternalResult,
  SendOtpResult,
  VerifyOtpParams,
  VerifyOtpResult,
  CreateExchangeCodeParams,
  CreateExchangeCodeResult,
  RegisterParams,
  RegisterResult,
  RegisterStatusParams,
  RegisterStatusResult,
  RegisterFinalizeParams,
  RegisterFinalizeResult,
  VerifySignupOtpParams,
  VerifySignupOtpResult,
  ResendSignupOtpParams,
  ResendSignupOtpResult,
};
