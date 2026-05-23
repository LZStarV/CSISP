import { getIdpClientEnv } from './env';

const env = getIdpClientEnv();

export const config = {
  supabase: {
    url: env.CSISP_SUPABASE_URL,
    anonKey: env.CSISP_SUPABASE_ANON_KEY,
  },
  defaultRedirectUrl: env.CSISP_DEFAULT_REDIRECT_URL,
};
