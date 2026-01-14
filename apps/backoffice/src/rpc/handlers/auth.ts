import { sign, verify } from '@/src/server/auth/jwt';
export async function login(params: any) {
  const username = String(params?.username ?? '');
  const password = String(params?.password ?? '');
  if (!username || !password) throw new Error('Missing credentials');
  const token = sign({ username, roles: ['tech'] });
  return { token };
}
export async function me(_: any, headers: Headers) {
  const auth = headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') throw new Error('Unauthorized');
  const decoded = verify(parts[1]);
  return { user: { username: decoded.username, roles: decoded.roles } };
}
