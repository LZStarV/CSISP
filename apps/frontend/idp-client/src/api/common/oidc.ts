import type { CommonOidcAction } from '@csisp/contracts';
import * as contracts from '@csisp/contracts';

import { createDomainCall } from '../caller';

export type {
  CommonOidcAction,
  GetAuthorizationRequestParams,
  GetAuthorizationRequestResult,
  OidcClientInfo,
} from '@csisp/contracts';

export const commonOidcCall = createDomainCall<CommonOidcAction>(
  contracts.COMMON_PATH_PREFIX,
  'oidc'
);
