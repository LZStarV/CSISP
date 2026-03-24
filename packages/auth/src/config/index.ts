import { getAuthEnv } from './env';

const env = getAuthEnv();

export const authConfig = {
  idp: {
    serverUrl: env.IDP_SERVER_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
  },
};

export type AuthConfig = typeof authConfig;
