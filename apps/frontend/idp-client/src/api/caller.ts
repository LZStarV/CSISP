import { call } from '@csisp/http';

import { config } from '@/config';

const IDP_PREFIX: string = config.routes.apiPrefix;

type IdpDomain = 'auth' | 'oidc';

export function createDomainCall(domain: IdpDomain) {
  return function <T>(action: string, params?: unknown): Promise<T> {
    return call<T>(IDP_PREFIX, domain, action, params) as Promise<T>;
  };
}
