import {
  envIntString,
  envNonNegativeIntString,
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const backendIntegratedEnvSchema = z.object({
  CSISP_BACKEND_INTEGRATED_PORT: envIntString(),
  DATABASE_URL: envString(),
  JWT_SECRET: envString(),
  CSISP_IDP_THRIFT_URL: envUrlString(),
  MONGODB_URI: envString(),
  MONGODB_DB: envString(),
  REDIS_HOST: envString(),
  REDIS_PORT: envIntString(),
  REDIS_DB: envNonNegativeIntString(),
  REDIS_NAMESPACE: envString(),
  REDIS_PASSWORD: envOptionalString(),
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
