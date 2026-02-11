import {
  IUserInfo,
  ITokenResponse,
  TokenRequest,
  OIDCGrantType,
  oidc,
} from '@csisp/idl/idp';
import { call, hasError } from '@csisp/rpc/client-fetch';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createSession } from '@/src/server/auth/session';
import { signToken } from '@/src/server/modules/auth/auth.service';

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
    console.log('Callback started', { code, state, savedState });
    // 2. 向 IdP 换取 Token
    // 注意：服务端调用需要使用绝对路径
    const IDP_RPC_URL = 'http://localhost:4001/api/idp';

    const tokenReq = new TokenRequest({
      grant_type: OIDCGrantType.AuthorizationCode,
      code,
      redirect_uri: 'http://localhost:3000/api/auth/callback',
      client_id: 'backoffice',
      code_verifier: verifier,
    });

    console.log('Requesting token from IdP', tokenReq);
    const response = await call<ITokenResponse>(
      IDP_RPC_URL,
      oidc.serviceName,
      'token',
      tokenReq
    );

    if (hasError(response)) {
      console.error('IdP token error', response.error);
      return NextResponse.json(
        { error: response.error.message },
        { status: 500 }
      );
    }

    const { id_token } = response.result;
    console.log('Received id_token', id_token ? 'EXISTS' : 'MISSING');
    if (!id_token) {
      return NextResponse.json(
        { error: 'IdP returned no id_token' },
        { status: 500 }
      );
    }

    // 3. 解析 id_token (此处简化，生产环境应验证签名)
    const decoded = jwt.decode(id_token) as any;
    console.log('Decoded id_token', decoded);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid ID Token' }, { status: 500 });
    }

    // 提取用户信息和角色 (对应 IDL 中的 UserInfo 结构)
    const user: IUserInfo = {
      sub: decoded.sub,
      preferred_username: decoded.preferred_username || decoded.sub,
      roles: decoded.roles || [],
    };

    // 4. 建立 Backoffice 本地会话
    console.log('Signing local token', user);
    const localToken = signToken({
      username: user.preferred_username,
      roles: user.roles,
      sub: user.sub,
    });
    console.log('Creating session', localToken);
    await createSession(localToken, user);

    // 5. 写入 Cookie 并重定向
    console.log('Redirecting to /');
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set('token', localToken, {
      path: '/',
      httpOnly: false, // 允许前端读取
      maxAge: 3600 * 2, // 2小时
    });

    // 清理 OIDC 临时 Cookie
    res.cookies.delete('oidc_state');
    res.cookies.delete('oidc_verifier');

    return res;
  } catch (err: any) {
    console.error('Callback error stack:', err.stack);
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
