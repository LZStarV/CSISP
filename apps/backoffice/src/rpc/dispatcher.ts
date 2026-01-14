import { registry } from './registry';
import { Domain, I18N_ACTION_ALIAS } from './constants';

export async function dispatch(domain: string, action: string, params: unknown, headers: Headers) {
  const d = registry[domain];
  if (!d) throw new Error('Unknown domain');
  let resolvedAction = action;
  if (domain === Domain.I18N) {
    resolvedAction = I18N_ACTION_ALIAS[action] ?? action;
  }
  const fn = d[resolvedAction];
  if (typeof fn !== 'function') throw new Error('Unknown action');
  return await fn(params, headers);
}
