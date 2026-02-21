import { normalizeBaseUrl } from '@csisp/config';

import { getBackendIntegratedEnv } from './env';

const env = getBackendIntegratedEnv();

const redisPassword =
  env.REDIS_PASSWORD === '' ? undefined : env.REDIS_PASSWORD;

const baseOrigins = [
  env.CSISP_BFF_URL,
  env.CSISP_BACKOFFICE_URL,
  env.CSISP_FRONTEND_ADMIN_URL,
  env.CSISP_FRONTEND_PORTAL_URL,
].filter((x): x is string => Boolean(x));
const extraOriginsRaw = env.BACKEND_INTEGRATED_EXTRA_ORIGINS || '';
const extraOrigins = extraOriginsRaw
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = [...baseOrigins, ...extraOrigins].map(x =>
  normalizeBaseUrl(x)
);

export const config = {
  http: {
    port: env.CSISP_BACKEND_INTEGRATED_PORT,
  },
  db: {
    url: env.DATABASE_URL,
  },
  mongo: {
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    idpThriftUrl: env.CSISP_IDP_THRIFT_URL,
  },
  cors: {
    allowedOrigins,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    namespace: env.REDIS_NAMESPACE,
    password: redisPassword,
  },
};
