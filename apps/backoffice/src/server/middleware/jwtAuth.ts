import { AUTH_COOKIE_NAME } from '@csisp/auth/common';
import { verifyAuth } from '@csisp/auth/server';

import { sessionManager } from '@/src/server/auth/session';
import { getJwtSecret } from '@/src/server/config/env';

export async function withAuth(ctx: Record<string, any>) {
  const auth = ctx.headers?.get?.('authorization') || '';
  const cookie = ctx.headers?.get?.('cookie') || '';
  const parts = auth.split(' ');
  let token = '';

  if (parts.length === 2 && parts[0] === 'Bearer') {
    token = parts[1];
  } else {
    const m = cookie.match(
      new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`)
    );
    token = m?.[1] || '';
  }

  if (token) {
    const decoded = await verifyAuth(token, {
      jwtSecret: getJwtSecret(),
      sessionManager,
    });

    if (decoded) {
      ctx.state = ctx.state || {};
      ctx.state.user = decoded;
    }
  }

  return { user: ctx.state?.user };
}
