import { normalizeBaseUrl } from '@csisp/config';

import { env } from './env';

export const config = {
  runtime: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
  },
  upstream: {
    idpBaseUrl: normalizeBaseUrl(env.IDP_SERVER_URL),
    integratedServerUrl: env.INTEGRATED_SERVER_URL,
  },
  cors: {
    enabled: true,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  redis: {
    namespace: env.REDIS_NAMESPACE || 'bff',
    upstash: {
      url: env.UPSTASH_REDIS_REST_URL || '',
      token: env.UPSTASH_REDIS_REST_TOKEN || '',
    },
  },
};

export type AppConfig = typeof config;
