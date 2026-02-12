import {
  AUTH_COOKIE_NAME,
  OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE,
} from '@csisp/auth/common';
import { IdpClient } from '@csisp/auth/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createSession } from '@/src/server/auth/session';
import { idpConfig, oidcConfig } from '@/src/server/config/env';
import { getLogger } from '@/src/server/middleware/logger';
import { signToken } from '@/src/server/modules/auth/auth.service';

const idpClient = new IdpClient(idpConfig);
const logger = getLogger({ context: 'auth-callback' });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OIDC_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(OIDC_VERIFIER_COOKIE)?.value;

  // 1. 校验 state 防止 CSRF
  if (!state || state !== savedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  if (!code || !verifier) {
    return NextResponse.json(
      { error: 'Missing code or verifier' },
      { status: 400 }
    );
  }

  try {
    logger.info({ code, state, savedState }, 'Callback started');

    // 2. 向 IdP 换取 Token 并解析用户信息
    const { user } = await idpClient.exchangeAndDecodeUser(
      {
        code,
        verifier,
        client_id: 'backoffice',
        redirect_uri: oidcConfig.callbackUrl,
      },
      { headers: req.headers }
    );

    // 3. 建立 Backoffice 本地会话
    logger.info({ user }, 'Signing local token');
    const localToken = signToken({
      username: user.preferred_username,
      roles: user.roles,
      sub: user.sub,
    });

    logger.info({ localToken }, 'Creating session');
    await createSession(localToken, user);

    // 4. 写入 Cookie 并重定向
    logger.info('Redirecting to /');
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set(AUTH_COOKIE_NAME, localToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 2, // 2小时
    });

    // 清理 OIDC 临时 Cookie
    res.cookies.delete(OIDC_STATE_COOKIE);
    res.cookies.delete(OIDC_VERIFIER_COOKIE);

    return res;
  } catch (err: any) {
    logger.error(err, 'Callback error');
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
