import {
  IDP_CLIENT_PATH_PREFIX,
  type IdpClientAuthAction,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

export const idpClientAuthCall = createDomainCall<IdpClientAuthAction>(
  IDP_CLIENT_PATH_PREFIX,
  'auth'
);
