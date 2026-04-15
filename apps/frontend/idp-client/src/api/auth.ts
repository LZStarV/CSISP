import type { IdpAuthAction } from '@csisp/contracts';

import { createDomainCall } from './caller';

export type {
  CreateExchangeCodeParams,
  CreateExchangeCodeResult,
  IdpAuthAction,
  LoginParams,
  LoginResult,
  RegisterParams,
  RegisterResult,
  ResendSignupOtpParams,
  ResendSignupOtpResult,
  SendOtpResult,
  VerifyOtpParams,
  VerifyOtpResult,
  VerifySignupOtpParams,
  VerifySignupOtpResult,
} from '@csisp/contracts';

export const authCall = createDomainCall<IdpAuthAction>('auth');
