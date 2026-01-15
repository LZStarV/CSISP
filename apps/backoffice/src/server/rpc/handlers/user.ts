import type { IUser as User, IUserInfo as UserInfo } from '@csisp/idl/backoffice';
// 按 id 或用户名获取用户详情
export async function getUser(params: any): Promise<User> {
  // 读取标识符，至少提供 id 或 username 之一
  const id = Number(params?.id ?? 0);
  const username = String(params?.username ?? '');
  if (!id && !username) throw new Error('Missing identifier');
  // 返回占位数据；后续替换为真实来源
  const u: User = { id: id || 1, username: username || 'user', status: 1 };
  return u;
}

// 分页列出用户列表
export async function listUsers(
  params: any
): Promise<{ items: User[]; page: number; size: number; total: number }> {
  // 分页参数与上限控制
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));
  return { items: [], page, size, total: 0 };
}
