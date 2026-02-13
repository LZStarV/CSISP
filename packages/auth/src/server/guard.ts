import { verifyToken } from './jwt';
import { SessionManager } from './session';

// 认证校验选项
export interface AuthGuardOptions {
  jwtSecret: string;
  sessionManager?: SessionManager;
}

/**
 * 通用的认证校验逻辑
 * - 验证 JWT 令牌的有效性
 * - (可选) 验证会话在存储中是否存在（支持吊销）
 */
export async function verifyAuth(
  token: string,
  options: AuthGuardOptions
): Promise<any | null> {
  if (!token) return null;

  try {
    // 1. 验证 JWT
    const decoded = verifyToken(token, options.jwtSecret);
    if (!decoded) return null;

    // 2. 检查会话（如果提供了 SessionManager）
    if (options.sessionManager) {
      const session = await options.sessionManager.get(token);
      if (!session) return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
