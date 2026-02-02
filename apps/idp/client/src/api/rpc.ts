import { auth, oidc } from '@csisp/idl/idp';
import { call, hasError } from '@csisp/rpc/client-fetch';

const IDP_PREFIX: string = '/api/idp';

// domain = auth
const authCall = function <T>(action: string, params?: any) {
  return call<T>(IDP_PREFIX, auth.serviceName, action, params);
};

// domain = oidc
const oidcCall = function <T>(action: string, params?: any) {
  return call<T>(IDP_PREFIX, oidc.serviceName, action, params);
};

export { authCall, oidcCall, hasError };
