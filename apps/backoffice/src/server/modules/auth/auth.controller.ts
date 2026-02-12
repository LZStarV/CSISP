import { IdpClient } from '@csisp/auth/server';
import type { IUserInfo } from '@csisp/idl/backoffice';
import {
  AuthorizationRequest,
  OIDCResponseType,
  OIDCScope,
  OIDCPKCEMethod,
} from '@csisp/idl/idp';
import { z } from 'zod';

import { getSession, destroySession } from '@/src/server/auth/session';
import { getJwtSecret, idpConfig, oidcConfig } from '@/src/server/config/env';

const idpClient = new IdpClient(idpConfig);

export const meResult = z.object({
  user: z.object({
    username: z.string(),
    roles: z.array(z.string()),
  }),
}) as z.ZodType<{ user: IUserInfo }>;

export async function me(_: unknown, ctx: Record<string, any>) {
  // 1. 直接从上下文获取用户信息（由 withAuth 中间件注入）
  const user = ctx.state?.user;

  if (!user) {
    const err = new Error('Unauthorized');
    (err as any).code = -32602;
    throw err;
  }

  // 2. 返回符合 Zod Schema 的数据
  return meResult.parse({
    user: {
      username: String(user.username || user.preferred_username || user.sub),
      roles: user.roles || [],
    },
  });
}

export interface AuthorizeParams {
  state: string;
  code_challenge: string;
  code_verifier: string;
  code_challenge_method?: string;
}

export async function authorize(params: AuthorizeParams, ctx: any) {
  // 1. 在服务端组装完整的 OIDC 授权请求
  const authReq = new AuthorizationRequest({
    client_id: 'backoffice',
    redirect_uri: oidcConfig.callbackUrl,
    response_type: OIDCResponseType.Code,
    scope: [OIDCScope.Openid, OIDCScope.Profile, OIDCScope.Email],
    state: params.state,
    code_challenge: params.code_challenge,
    code_challenge_method: OIDCPKCEMethod.S256,
  });

  // 2. 将 state 和 verifier 存入 HttpOnly Cookie，提高安全性
  ctx.resCookies = [
    { name: 'oidc_state', value: params.state },
    { name: 'oidc_verifier', value: params.code_verifier },
  ];

  return idpClient.authorize(authReq, ctx);
}

export async function logout(_: unknown, ctx: Record<string, any>) {
  const cookie = ctx.headers?.get?.('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  const token = m?.[1] || '';

  if (token) {
    await destroySession(token);
  }

  // 清除本地 Cookie
  ctx.resCookies = [
    {
      name: 'token',
      value: '',
      options: { maxAge: 0, path: '/' },
    },
  ];

  return { ok: true };
}
