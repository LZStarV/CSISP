import {
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const idpServerEnvSchema = z.object({
  NODE_ENV: envOptionalString(),
  CSISP_IDP_RPC_URL: envUrlString(),
  JWT_SECRET: envString(),
  OIDC_KEK_SECRET: envString(),
  SUPABASE_URL: envString(),
  SUPABASE_SERVICE_ROLE_KEY: envString(),
  SUPABASE_ANON_KEY: envString(),
  IDP_COOKIE_DOMAIN: envOptionalString(),
  SMS_SIGN_NAME: envOptionalString(),
  SMS_TEMPLATE_CODE: envOptionalString(),
  SMS_SCHEME_NAME: envOptionalString(),
  UPSTASH_REDIS_REST_URL: envOptionalString(),
  UPSTASH_REDIS_REST_TOKEN: envOptionalString(),
  REDIS_NAMESPACE: envString(),
});

export type IdpServerEnv = z.infer<typeof idpServerEnvSchema>;

// 解析 IDP 服务器环境变量
export function getIdpServerEnv(): IdpServerEnv {
  return parseEnv(idpServerEnvSchema, process.env, { label: 'idp-server' });
}
