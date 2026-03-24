import { envString, parseEnv } from '@csisp/config';
import { z } from 'zod';

export const authEnvSchema = z.object({
  IDP_SERVER_URL: envString(),
  JWT_SECRET: envString(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getAuthEnv(): AuthEnv {
  return parseEnv(authEnvSchema as any, process.env, { label: 'auth' }) as any;
}
