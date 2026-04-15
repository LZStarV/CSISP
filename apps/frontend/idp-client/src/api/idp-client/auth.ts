import {
  IDP_CLIENT_PATH_PREFIX,
  type IdpClientAuthAction,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  CreateExchangeCodeParams,
  CreateExchangeCodeResult,
  IdpClientAuthAction,
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

export const idpClientAuthCall = createDomainCall<IdpClientAuthAction>(
  IDP_CLIENT_PATH_PREFIX,
  'auth'
);
