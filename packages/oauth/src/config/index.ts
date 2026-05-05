import { getOAuthEnv } from './env';

const env = getOAuthEnv();

export const config = {
  supabase: {
    url: env.CSISP_SUPABASE_URL,
    anonKey: env.CSISP_SUPABASE_ANON_KEY,
  },
};
