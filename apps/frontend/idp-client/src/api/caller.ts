import { call } from '@csisp/http';

export function createDomainCall<TAction extends string>(
  pathPrefix: string,
  domain: string
) {
  return function <T>(action: TAction, params?: unknown): Promise<T> {
    return call<T>(pathPrefix, domain, action, params ?? {}) as Promise<T>;
  };
}
