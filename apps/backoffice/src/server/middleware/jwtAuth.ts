import { verifyToken } from '@csisp/auth/server';

import { getSession } from '@/src/server/auth/session';
import { getJwtSecret } from '@/src/server/config/env';

export async function withAuth(ctx: Record<string, any>) {
  const auth = ctx.headers?.get?.('authorization') || '';
  const cookie = ctx.headers?.get?.('cookie') || '';
  const parts = auth.split(' ');
  let token = '';
  if (parts.length === 2 && parts[0] === 'Bearer') {
    token = parts[1];
  } else {
    const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    token = m?.[1] || '';
  }
  if (token) {
    try {
      const decoded = verifyToken(token, getJwtSecret());
      ctx.state = ctx.state || {};
      ctx.state.user = decoded;
      // 检查会话是否存在（支持吊销）
      const sess = await getSession(token);
      if (!sess) {
        ctx.state.user = undefined;
      }
    } catch {
      // 忽略无效令牌；控制器/角色将强制实施
    }
  }
  return { user: ctx.state?.user };
}
