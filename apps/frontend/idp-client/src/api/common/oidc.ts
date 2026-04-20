import { COMMON_PATH_PREFIX, type CommonOidcAction } from '@csisp/contracts';

import { createDomainCall } from '../caller';

export const commonOidcCall = createDomainCall<CommonOidcAction>(
  COMMON_PATH_PREFIX,
  'oidc'
);
