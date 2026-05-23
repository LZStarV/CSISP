import { z } from 'zod';

const oauthEnvSchema = z.object({
  CSISP_SUPABASE_URL: z.string().url(),
  CSISP_SUPABASE_ANON_KEY: z.string(),
});

export type OAuthEnv = z.infer<typeof oauthEnvSchema>;

export function getOAuthEnv(): OAuthEnv {
  const env = {
    CSISP_SUPABASE_URL: import.meta.env.CSISP_SUPABASE_URL || '',
    CSISP_SUPABASE_ANON_KEY: import.meta.env.CSISP_SUPABASE_ANON_KEY || '',
  };

  return oauthEnvSchema.parse(env);
}
