import { getAuthEnv } from './env';

const env = getAuthEnv();

export const authConfig = {
  idp: {
    serverUrl: env.IDP_SERVER_URL,
    thriftPrefix: env.IDP_THRIFT_PREFIX,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
  },
};

export type AuthConfig = typeof authConfig;
