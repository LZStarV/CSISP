import {
  envIntString,
  envOptionalString,
  envString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const backendIntegratedEnvSchema = z.object({
  CSISP_BACKEND_INTEGRATED_PORT: envIntString(),
  DATABASE_URL: envString(),
  SUPABASE_URL: envString(),
  SUPABASE_SERVICE_ROLE_KEY: envString(),
  SUPABASE_ANON_KEY: envString(),
  MONGODB_URI: envString(),
  REDIS_NAMESPACE: envString(),
  UPSTASH_REDIS_REST_URL: envOptionalString(),
  UPSTASH_REDIS_REST_TOKEN: envOptionalString(),
  CSISP_BFF_URL: envOptionalString(),
  CSISP_BACKOFFICE_URL: envOptionalString(),
  CSISP_FRONTEND_ADMIN_URL: envOptionalString(),
  CSISP_FRONTEND_PORTAL_URL: envOptionalString(),
  BACKEND_INTEGRATED_EXTRA_ORIGINS: envOptionalString(),
});

export type BackendIntegratedEnv = z.infer<typeof backendIntegratedEnvSchema>;

export function getBackendIntegratedEnv(): BackendIntegratedEnv {
  return parseEnv(backendIntegratedEnvSchema, process.env, {
    label: 'backend-integrated',
  });
}
