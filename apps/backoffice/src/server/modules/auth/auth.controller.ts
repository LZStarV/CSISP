import { z } from 'zod';

import { verify } from '@/src/server/auth/jwt';
import { createSession, getSession } from '@/src/server/auth/session';
import { signToken } from '@/src/server/modules/auth/auth.service';

export const loginParams = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export const loginResult = z.object({
  token: z.string().min(1),
});

export async function login(params: unknown, _ctx: Record<string, any>) {
  const p = loginParams.parse(params);
  const token = signToken({ username: p.username, roles: ['admin'] });
  await createSession(token, { username: p.username, roles: ['admin'] });
  return loginResult.parse({ token });
}

export const meResult = z.object({
  user: z.object({
    username: z.string(),
    roles: z.array(z.string()),
  }),
});

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
