import { z } from 'zod';

const portalEnvSchema = z.object({
  // OAuth 配置
  CSISP_PORTAL_OAUTH_CLIENT_ID: z.string(),
  CSISP_PORTAL_OAUTH_REDIRECT_URI: z.string().url(),
});

export type PortalEnv = z.infer<typeof portalEnvSchema>;

// 解析 Portal 环境变量
export function getPortalEnv(): PortalEnv {
  const env = {
    CSISP_PORTAL_OAUTH_CLIENT_ID:
      import.meta.env.CSISP_PORTAL_OAUTH_CLIENT_ID || '',
    CSISP_PORTAL_OAUTH_REDIRECT_URI:
      import.meta.env.CSISP_PORTAL_OAUTH_REDIRECT_URI || '',
  };

  return portalEnvSchema.parse(env);
}
