import { normalizeBaseUrl } from '@csisp/config';

import { getIdpServerEnv } from './env';

const env = getIdpServerEnv();

const redisPassword =
  env.REDIS_PASSWORD === '' ? undefined : env.REDIS_PASSWORD;

export const config = {
  runtime: {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
  },
  http: {
    port: env.CSISP_IDP_PORT,
  },
  issuer: {
    baseUrl: normalizeBaseUrl(env.CSISP_IDP_RPC_URL),
  },
  db: {
    url: env.DATABASE_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    oidcKekSecret: env.OIDC_KEK_SECRET,
    accessTokenExpiresIn: env.IDP_ACCESS_TOKEN_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: env.IDP_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  session: {
    cookieDomain:
      env.IDP_COOKIE_DOMAIN === '' ? undefined : env.IDP_COOKIE_DOMAIN,
  },
  sms: {
    signName: env.SMS_SIGN_NAME || '速通互联验证码',
    templateCode: env.SMS_TEMPLATE_CODE || '100001',
    schemeName: env.SMS_SCHEME_NAME || 'CSISP',
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    namespace: env.REDIS_NAMESPACE,
    password: redisPassword,
  },
};
