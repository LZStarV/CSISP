import { COMMON_PATH_PREFIX, type CommonOidcAction } from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  CommonOidcAction,
  GetAuthorizationRequestParams,
  GetAuthorizationRequestResult,
  OidcClientInfo,
} from '@csisp/contracts';

export const commonOidcCall = createDomainCall<CommonOidcAction>(
  COMMON_PATH_PREFIX,
  'oidc'
);
