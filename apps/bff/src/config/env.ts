import {
  envOptionalString,
  envUrlString,
  envString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const EnvSchema = z.object({
  CSISP_BACKEND_INTEGRATED_URL: envUrlString(),
  IDP_SERVER_URL: envUrlString(),
  SUPABASE_URL: envUrlString(),
  SUPABASE_SERVICE_ROLE_KEY: envString(),
  SUPABASE_ANON_KEY: envString(),
  REDIS_NAMESPACE: envOptionalString(),
  UPSTASH_REDIS_REST_URL: envOptionalString(),
  UPSTASH_REDIS_REST_TOKEN: envOptionalString(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = parseEnv(EnvSchema, process.env, { label: 'BFF' });
