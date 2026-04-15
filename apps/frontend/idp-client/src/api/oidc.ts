import type {
  IdpOidcAction,
  GetAuthorizationRequestResult,
  OidcClientInfo,
} from '@csisp/contracts';

import { createDomainCall } from './caller';

export const oidcCall = createDomainCall<IdpOidcAction>('oidc');
export const OIDC_ACTION = {
  CLIENTS: 'clients',
  GET_AUTHORIZATION_REQUEST: 'getAuthorizationRequest',
} as const;

export type { GetAuthorizationRequestResult, OidcClientInfo };
