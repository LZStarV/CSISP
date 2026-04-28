import {
  COMMON_PATH_PREFIX,
  type CommonOidcAction,
  type GetAuthorizationRequestParams,
  type GetAuthorizationRequestResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const oidcCall = createDomainCall<CommonOidcAction>(COMMON_PATH_PREFIX, 'oidc');

export const commonOidcApi = {
  async clients() {
    return await oidcCall('clients', {});
  },

  async getAuthorizationRequest(
    params: GetAuthorizationRequestParams
  ): Promise<GetAuthorizationRequestResult> {
    return await oidcCall<GetAuthorizationRequestResult>(
      'getAuthorizationRequest',
      params
    );
  },
};
