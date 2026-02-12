import { loadRootEnv } from '@csisp/utils';

loadRootEnv();

/**
 * 获取 Backoffice 本地会话的 JWT 密钥
 */
export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'local-dev-do-not-use';
}

/**
 * Backoffice 本地会话的过期时间
 */
export const jwtExpiresIn = '2h';

/**
 * 获取数据库 URL
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || '';
}

/**
 * 检查数据库是否配置
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * IDP 服务的配置
 */
export const idpConfig = {
  url: process.env.IDP_THRIFT_URL || 'http://localhost:4001/thrift/idp',
};
