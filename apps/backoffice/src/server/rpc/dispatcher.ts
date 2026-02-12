import { RpcError } from '@csisp/rpc/core';

import { registry } from './registry';

import { Domain, I18N_ACTION_ALIAS } from '@/src/server/config/rpc';

export async function dispatch(
  domain: string,
  action: string,
  params: unknown,
  ctx: Record<string, any>
) {
  const d = registry[domain];
  if (!d) {
    const err = new Error('Unknown domain');
    (err as any).code = RpcError.MethodNotFound;
    throw err;
  }
  let resolvedAction = action;
  if (domain === Domain.I18N) {
    resolvedAction = I18N_ACTION_ALIAS[action] ?? action;
  }
  const fn = (d as any)[resolvedAction];
  if (typeof fn !== 'function') {
    const err = new Error('Unknown action');
    (err as any).code = RpcError.MethodNotFound;
    throw err;
  }
  return await fn(params, ctx);
}
