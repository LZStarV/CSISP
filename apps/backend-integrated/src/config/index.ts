import { normalizeBaseUrl } from '@csisp/config';

import { getBackendIntegratedEnv } from './env';

const env = getBackendIntegratedEnv();
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
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  mongo: {
    uri: env.MONGODB_URI,
  },
  cors: {
    allowedOrigins,
  },
  redis: {
    namespace: env.REDIS_NAMESPACE,
    upstash: {
      url: env.UPSTASH_REDIS_REST_URL || '',
      token: env.UPSTASH_REDIS_REST_TOKEN || '',
    },
  },
};
