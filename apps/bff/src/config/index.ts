import { joinUrl, normalizePrefix } from '@csisp/config';

import { getBffEnv } from './env';

const env = getBffEnv();

const rpcPrefix = normalizePrefix(env.CSISP_RPC_PREFIX);
const basePrefix = normalizePrefix(joinUrl(rpcPrefix, 'bff'));

const redisPassword =
  env.REDIS_PASSWORD === '' ? undefined : env.REDIS_PASSWORD;

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
    host: string;
    port: number;
    db: number;
    namespace: string;
    password?: string;
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
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    namespace: env.REDIS_NAMESPACE,
    password: redisPassword,
  },
};
