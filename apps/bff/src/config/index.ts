import { joinUrl, normalizePrefix } from '@csisp/config';

import { getBffEnv } from './env';

const env = getBffEnv();

const rpcPrefix = normalizePrefix(env.CSISP_RPC_PREFIX);
const basePrefix = normalizePrefix(joinUrl(rpcPrefix, 'bff'));

const enabledSubProjects = String(env.BFF_ENABLED_SUBPROJECTS ?? 'portal,admin')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export type BffConfig = {
  runtime: { nodeEnv?: string; isDev: boolean };
  http: { port: number };
  routes: { rpcPrefix: string; basePrefix: string };
  upstream: { backendIntegratedBaseUrl: string };
  auth: { jwtSecret: string };
  features: { enabledSubProjects: string[] };
  redis: {
    namespace: string;
    upstash: { url: string; token: string };
  };
};

export const config: BffConfig = {
  runtime: {
    nodeEnv: env.NODE_ENV,
    isDev: env.NODE_ENV === 'development',
  },
  http: {
    port: env.CSISP_BFF_PORT,
  },
  routes: {
    rpcPrefix,
    basePrefix,
  },
  upstream: {
    backendIntegratedBaseUrl: env.CSISP_BACKEND_INTEGRATED_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
  },
  features: {
    enabledSubProjects,
  },
  redis: {
    namespace: env.REDIS_NAMESPACE,
    upstash: {
      url: env.UPSTASH_REDIS_REST_URL || '',
      token: env.UPSTASH_REDIS_REST_TOKEN || '',
    },
  },
};
