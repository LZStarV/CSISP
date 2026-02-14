import { requireEnv } from '@csisp/utils';

// 获取 Backoffice 本地会话的 JWT 密钥
export function getJwtSecret(): string {
  return requireEnv('JWT_SECRET');
}

// Backoffice 本地会话的过期时间
export const jwtExpiresIn = '2h';

// 获取数据库 URL
export function getDatabaseUrl(): string {
  return requireEnv('DATABASE_URL');
}

// IDP Thrift 服务的配置
export const idpConfig = {
  url: requireEnv('CSISP_IDP_THRIFT_URL'),
};

// OIDC 配置
export const oidcConfig = {
  callbackUrl: `${requireEnv('CSISP_BACKOFFICE_URL')}${requireEnv('CSISP_RPC_PREFIX')}/auth/callback`,
};
