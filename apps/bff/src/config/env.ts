import {
  envIntString,
  envNonNegativeIntString,
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const bffEnvSchema = z.object({
  NODE_ENV: envOptionalString(),
  BFF_ENABLED_SUBPROJECTS: envOptionalString(),
  CSISP_BFF_PORT: envIntString(),
  CSISP_RPC_PREFIX: envString(),
  CSISP_BACKEND_INTEGRATED_URL: envUrlString(),
  JWT_SECRET: envString(),
  REDIS_HOST: envString(),
  REDIS_PORT: envIntString(),
  REDIS_DB: envNonNegativeIntString(),
  REDIS_NAMESPACE: envString(),
  REDIS_PASSWORD: envOptionalString(),
});

export type BffEnv = z.infer<typeof bffEnvSchema>;

export function getBffEnv(): BffEnv {
  return parseEnv(bffEnvSchema, process.env, { label: 'bff' });
}
