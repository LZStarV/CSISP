import { requireEnv } from '@csisp/utils';

import {
  getJwtSecret,
  jwtExpiresIn,
  getDatabaseUrl,
  getIdpConfig,
  getOidcConfig,
} from './env';

export const config = {
  runtime: {
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
  },
  db: {
    get url() {
      return getDatabaseUrl();
    },
  },
  auth: {
    get jwtSecret() {
      return getJwtSecret();
    },
    jwtExpiresIn,
  },
  idp: {
    get thriftUrl() {
      return getIdpConfig().url;
    },
  },
  oidc: {
    get callbackUrl() {
      return getOidcConfig().callbackUrl;
    },
  },
  mongo: {
    get uri() {
      return requireEnv('MONGODB_URI');
    },
    get dbName() {
      return requireEnv('MONGODB_DB');
    },
  },
  redis: {
    get host() {
      return requireEnv('REDIS_HOST');
    },
    get port() {
      return Number(requireEnv('REDIS_PORT'));
    },
    get db() {
      return Number(requireEnv('REDIS_DB'));
    },
    get namespace() {
      return requireEnv('REDIS_NAMESPACE');
    },
    get password() {
      const raw = process.env.REDIS_PASSWORD;
      return raw === '' ? undefined : raw;
    },
  },
};
