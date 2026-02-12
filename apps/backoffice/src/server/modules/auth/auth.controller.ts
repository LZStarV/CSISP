import { IdpClient, verifyToken } from '@csisp/auth/server';
import type { IUserInfo } from '@csisp/idl/backoffice';
import {
  AuthorizationRequest,
  OIDCResponseType,
  OIDCScope,
  OIDCPKCEMethod,
} from '@csisp/idl/idp';
import { z } from 'zod';

import { getSession } from '@/src/server/auth/session';
import { getJwtSecret, idpConfig } from '@/src/server/config/env';

const idpClient = new IdpClient(idpConfig);

export const meResult = z.object({
  user: z.object({
    username: z.string(),
    roles: z.array(z.string()),
  }),
}) as z.ZodType<{ user: IUserInfo }>;

export async function me(_: unknown, ctx: Record<string, any>) {
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
  if (!token) {
    const err = new Error('Unauthorized');
    (err as any).code = -32602;
    throw err;
  }

  const decoded = verifyToken(token, getJwtSecret()) as any;
  const sessUser = await getSession(token);
  if (!sessUser) {
    const err = new Error('Unauthorized: session expired');
    (err as any).code = -32602;
    throw err;
  }
  return meResult.parse({
    user: { username: decoded.username, roles: decoded.roles || [] },
  });
}

export interface AuthorizeParams {
  state: string;
  code_challenge: string;
  code_challenge_method?: string;
}

export async function authorize(params: AuthorizeParams, ctx: any) {
  // 在服务端组装完整的 OIDC 授权请求，隐藏实现细节
  const authReq = new AuthorizationRequest({
    client_id: 'backoffice',
    redirect_uri: 'http://localhost:3000/api/auth/callback',
    response_type: OIDCResponseType.Code,
    scope: [OIDCScope.Openid, OIDCScope.Profile, OIDCScope.Email],
    state: params.state,
    code_challenge: params.code_challenge,
    code_challenge_method: OIDCPKCEMethod.S256,
  });

  return idpClient.authorize(authReq, ctx);
}
