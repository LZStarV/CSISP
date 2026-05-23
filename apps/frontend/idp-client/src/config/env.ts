import { z } from 'zod';

const idpClientEnvSchema = z.object({
  CSISP_SUPABASE_URL: z.string().url(),
  CSISP_SUPABASE_ANON_KEY: z.string(),
  CSISP_DEFAULT_REDIRECT_URL: z.string().url().optional(),
});

export type IdpClientEnv = z.infer<typeof idpClientEnvSchema>;

export function getIdpClientEnv(): IdpClientEnv {
  const env = {
    CSISP_SUPABASE_URL: import.meta.env.CSISP_SUPABASE_URL || '',
    CSISP_SUPABASE_ANON_KEY: import.meta.env.CSISP_SUPABASE_ANON_KEY || '',
    CSISP_DEFAULT_REDIRECT_URL: import.meta.env.CSISP_DEFAULT_REDIRECT_URL,
  };

  return idpClientEnvSchema.parse(env);
}
