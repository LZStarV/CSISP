import { sign, verify } from '@/src/server/auth/jwt';

export async function login(params: any) {
  // 读取用户名与密码；此处仅作存在性校验，占位实现
  const username = String(params?.username ?? '');
  const password = String(params?.password ?? '');
  if (!username || !password) throw new Error('Missing credentials');
  // 签发包含角色的短期令牌；后续可替换为真实权限集
  const token = sign({ username, roles: ['tech'] });
  return { token };
}

export async function me(_: any, headers: Headers) {
  // 从请求头提取 Bearer Token 并校验
  const auth = headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    throw new Error('Unauthorized');
  const decoded = verify(parts[1]);
  // 返回当前用户的基础信息（用户名与角色）
  return { user: { username: decoded.username, roles: decoded.roles } };
}
