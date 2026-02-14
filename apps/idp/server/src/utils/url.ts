import { requireEnv } from '@csisp/utils';

export function getApiBaseUrl(): string {
  return requireEnv('CSISP_IDP_RPC_URL');
}
