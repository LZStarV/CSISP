import { IdpClient, decodeToken } from '@csisp/auth/server';
import { IUserInfo, TokenRequest, OIDCGrantType } from '@csisp/idl/idp';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createSession } from '@/src/server/auth/session';
import { idpConfig } from '@/src/server/config/env';
import { getLogger } from '@/src/server/middleware/logger';
import { signToken } from '@/src/server/modules/auth/auth.service';

const idpClient = new IdpClient(idpConfig);
const logger = getLogger({ context: 'auth-callback' });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oidc_state')?.value;
  const verifier = cookieStore.get('oidc_verifier')?.value;

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
    // 2. 向 IdP 换取 Token
    const tokenReq = new TokenRequest({
      grant_type: OIDCGrantType.AuthorizationCode,
      code,
      redirect_uri: 'http://localhost:3000/api/auth/callback',
      client_id: 'backoffice',
      code_verifier: verifier,
    });

    logger.info({ tokenReq }, 'Requesting token from IdP');
    const tokens = await idpClient.exchangeToken(tokenReq, {
      headers: req.headers,
    });

    const { id_token } = tokens;
    logger.info({ hasIdToken: !!id_token }, 'Received id_token');
    if (!id_token) {
      return NextResponse.json(
        { error: 'IdP returned no id_token' },
        { status: 500 }
      );
    }

    // 3. 解析 id_token
    const decoded = decodeToken(id_token) as any;
    logger.info({ decoded }, 'Decoded id_token');
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid ID Token' }, { status: 500 });
    }

    // 提取用户信息和角色
    const user: IUserInfo = {
      sub: String(decoded.sub),
      preferred_username: String(decoded.preferred_username || decoded.sub),
      roles: decoded.roles || [],
    };

    // 4. 建立 Backoffice 本地会话
    logger.info({ user }, 'Signing local token');
    const localToken = signToken({
      username: user.preferred_username,
      roles: user.roles,
      sub: user.sub,
    });
    logger.info({ localToken }, 'Creating session');
    await createSession(localToken, user);

    // 5. 写入 Cookie 并重定向
    logger.info('Redirecting to /');
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set('token', localToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 2, // 2小时
    });

    // 清理 OIDC 临时 Cookie
    res.cookies.delete('oidc_state');
    res.cookies.delete('oidc_verifier');

    return res;
  } catch (err: any) {
    logger.error(err, 'Callback error');
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
