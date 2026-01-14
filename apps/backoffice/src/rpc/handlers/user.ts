export async function getUser(params: any) {
  const id = Number(params?.id ?? 0);
  const username = String(params?.username ?? '');
  if (!id && !username) throw new Error('Missing identifier');
  return { id: id || 1, username: username || 'user', status: 1 };
}
export async function listUsers(params: any) {
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));
  return { items: [], page, size, total: 0 };
}
