import { call } from '@csisp/http';

import { config } from '@/config';

const IDP_PREFIX: string = config.routes.apiPrefix;

type IdpDomain = 'auth' | 'oidc';

export function createDomainCall<TAction extends string>(domain: IdpDomain) {
  return function <T>(action: TAction, params?: unknown): Promise<T> {
    return call<T>(IDP_PREFIX, domain, action, params) as Promise<T>;
  };
}
