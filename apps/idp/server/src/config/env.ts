import {
  envIntString,
  envNonNegativeIntString,
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
} from '@csisp/config';
import { z } from 'zod';

export const idpServerEnvSchema = z.object({
  NODE_ENV: envOptionalString(),
  CSISP_IDP_PORT: envIntString(),
  CSISP_IDP_RPC_URL: envUrlString(),
  DATABASE_URL: envString(),
  JWT_SECRET: envString(),
  OIDC_KEK_SECRET: envString(),
  IDP_COOKIE_DOMAIN: envOptionalString(),
  IDP_ACCESS_TOKEN_EXPIRES_IN: envOptionalString(),
  IDP_REFRESH_TOKEN_EXPIRES_IN: envOptionalString(),
  SMS_SIGN_NAME: envOptionalString(),
  SMS_TEMPLATE_CODE: envOptionalString(),
  SMS_SCHEME_NAME: envOptionalString(),
  REDIS_HOST: envString(),
  REDIS_PORT: envIntString(),
  REDIS_DB: envNonNegativeIntString(),
  REDIS_NAMESPACE: envString(),
  REDIS_PASSWORD: envOptionalString(),
});

export type IdpServerEnv = z.infer<typeof idpServerEnvSchema>;

// 解析 IDP 服务器环境变量
export function getIdpServerEnv(): IdpServerEnv {
  return parseEnv(idpServerEnvSchema, process.env, { label: 'idp-server' });
}
