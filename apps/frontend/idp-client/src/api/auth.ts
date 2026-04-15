import { createDomainCall } from './caller';

export const authCall = createDomainCall('auth');

export type RegisterParams = {
  email: string;
  password: string;
  student_id: string;
  display_name?: string;
  redirect_uri?: string;
};

export type RegisterResult = {
  ok: boolean;
  next: string;
  emailRedirectTo: string;
};

export type RegisterStatusParams = { email: string };
export type RegisterStatusResult = { confirmed: boolean };
export type RegisterFinalizeParams = { email: string };
export type RegisterFinalizeResult = { ok: boolean; written: boolean };
export type VerifySignupOtpParams = { email: string; token: string };
export type VerifySignupOtpResult = { verified: boolean };
export type ResendSignupOtpParams = { email: string };
export type ResendSignupOtpResult = { ok: boolean };

export type LoginInternalParams = {
  email: string;
  password: string;
};

export type LoginInternalResult = {
  stepUp?: 'PENDING_PASSWORD';
  nextSteps?: string[];
};

export type SendOtpResult = {
  ok: boolean;
};

export type VerifyOtpParams = {
  token_hash: string;
  type: 'magic_link' | 'email';
};

export type VerifyOtpResult = {
  verified: boolean;
};

export type CreateExchangeCodeParams = {
  app_id: string;
  redirect_uri: string;
  state?: string;
};

export type CreateExchangeCodeResult = {
  code: string;
  redirect_uri: string;
  state?: string;
};
