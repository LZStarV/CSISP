import {
  AUTH_COOKIE_NAME,
  OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE,
} from '@csisp/auth/common';
import { IdpClient } from '@csisp/auth/server';
import type { IUserInfo } from '@csisp/idl/backoffice';
import { z } from 'zod';

import { destroySession } from '@/src/server/auth/session';
import { idpConfig, oidcConfig } from '@/src/server/config/env';

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
  // 1. 使用 SDK 构造授权跳转地址
  const result = await idpClient.getAuthorizationUrl(
    {
      client_id: 'backoffice',
      redirect_uri: oidcConfig.callbackUrl,
      state: params.state,
      code_challenge: params.code_challenge,
    },
    ctx
  );

  // 2. 将 state 和 verifier 存入 HttpOnly Cookie
  ctx.resCookies = [
    { name: OIDC_STATE_COOKIE, value: params.state },
    { name: OIDC_VERIFIER_COOKIE, value: params.code_verifier },
  ];

  return result;
}

export async function logout(_: unknown, ctx: Record<string, any>) {
  const cookie = ctx.headers?.get?.('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  const token = m?.[1] || '';

  if (token) {
    await destroySession(token);
  }

  // 清除本地 Cookie
  ctx.resCookies = [
    {
      name: AUTH_COOKIE_NAME,
      value: '',
      options: { maxAge: 0, path: '/' },
    },
  ];

  return { ok: true };
}
