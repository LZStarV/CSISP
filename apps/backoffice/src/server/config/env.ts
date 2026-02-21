import { requireEnv } from '@csisp/utils';

// 获取 Backoffice 本地会话的 JWT 密钥
export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

// Backoffice 本地会话的过期时间（可通过环境变量覆盖）
export const jwtExpiresIn = process.env.BACKOFFICE_JWT_EXPIRES_IN || '2h';

// 获取数据库 URL
export function getDatabaseUrl(): string {
  return requireEnv('DATABASE_URL');
}

// IDP Thrift 服务的配置（按需读取）
export function getIdpConfig(): { url: string } {
  return {
    url: requireEnv('CSISP_IDP_THRIFT_URL'),
  };
}

// OIDC 配置（按需读取）
export function getOidcConfig(): { callbackUrl: string } {
  return {
    callbackUrl: `${requireEnv('CSISP_BACKOFFICE_URL')}${requireEnv(
      'CSISP_RPC_PREFIX'
    )}/auth/callback`,
  };
}
