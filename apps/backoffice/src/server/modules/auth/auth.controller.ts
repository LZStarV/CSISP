import type { IUserInfo } from '@csisp/idl/backoffice';
import {
  AuthorizationInitResult,
  AuthorizationRequest,
  OIDCResponseType,
  OIDCScope,
  oidc,
} from '@csisp/idl/idp';
import { call, hasError } from '@csisp/rpc/client-fetch';
import { z } from 'zod';

import { verify } from '@/src/server/auth/jwt';
import { getSession } from '@/src/server/auth/session';

const IDP_RPC_URL = 'http://localhost:4001/api/idp';

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
  const decoded = verify(token) as any;
  const sessUser = await getSession(token);
  if (!sessUser) {
    const err = new Error('Unauthorized: session expired');
    (err as any).code = -32602;
    throw err;
  }
  return meResult.parse({
    user: { username: decoded.username, roles: decoded.roles },
  });
}

export async function authorize(params: any) {
  // 在服务端组装完整的 OIDC 授权请求，隐藏实现细节
  const authReq = new AuthorizationRequest({
    client_id: 'backoffice',
    redirect_uri: 'http://localhost:3000/api/auth/callback',
    response_type: OIDCResponseType.Code,
    scope: [OIDCScope.Openid, OIDCScope.Profile, OIDCScope.Email],
    state: String(params?.state ?? ''),
    code_challenge: String(params?.code_challenge ?? ''),
    code_challenge_method: params?.code_challenge_method,
  });

  const response = await call<AuthorizationInitResult>(
    IDP_RPC_URL,
    oidc.serviceName,
    'authorize',
    authReq
  );

  if (hasError(response)) {
    const err = new Error(response.error.message);
    (err as any).code = response.error.code;
    throw err;
  }

  return response.result;
}
