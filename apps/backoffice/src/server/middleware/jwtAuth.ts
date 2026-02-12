import { verifyToken } from '@csisp/auth/server';

import { getSession } from '@/src/server/auth/session';
import { getJwtSecret } from '@/src/server/config/env';

export function withAuth(ctx: Record<string, any>) {
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
      // optional: ensure session exists (supports revocation)
      getSession(token).then(sess => {
        if (!sess) {
          ctx.state.user = undefined;
        }
      });
    } catch {
      // ignore invalid tokens; controller/roles will enforce
    }
  }
  return { user: ctx.state?.user };
}
