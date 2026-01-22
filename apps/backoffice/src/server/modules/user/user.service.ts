import { models, initModels } from '@/src/infra/postgres';
import type UserType from '@/src/infra/postgres/generated/public/User';

export async function getByIdOrUsername(
  id?: number,
  username?: string
): Promise<Pick<UserType, 'id' | 'username' | 'status'>> {
  await initModels();
  const where: Record<string, any> = {};
  if (id) where.id = id;
  if (username) where.username = username;
  const row = await models.User.findOne({
    where,
    attributes: ['id', 'username', 'status'],
  });
  if (!row) {
    const err = new Error('User not found');
    (err as any).code = -32601;
    throw err;
  }
  return row.toJSON() as any;
}

export async function list(params: {
  page: number;
  size: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}) {
  await initModels();
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));
  const offset = (page - 1) * size;
  const validOrderBy = ['id', 'username', 'status', 'created_at'];
  const orderBy = validOrderBy.includes(String(params?.orderBy))
    ? String(params?.orderBy)
    : 'id';
  const orderDir =
    String(params?.orderDir ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const { rows, count } = await models.User.findAndCountAll({
    attributes: ['id', 'username', 'status'],
    limit: size,
    offset,
    order: [[orderBy, orderDir]],
  });
  return { items: rows.map((r: any) => r.toJSON()), page, size, total: count };
}
