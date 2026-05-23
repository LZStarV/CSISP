import { getPortalEnv } from './env';

const env = getPortalEnv();

export const config = {
  oauth: {
    clientId: env.CSISP_PORTAL_OAUTH_CLIENT_ID,
    redirectUri: env.CSISP_PORTAL_OAUTH_REDIRECT_URI,
  },
};
