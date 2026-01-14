import { getPool } from '@/src/server/db/client';
function pick<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const k of keys) r[k] = obj[k];
  return r;
}
export async function listModels() {
  const pool = getPool();
  const q = `
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name asc
  `;
  const res = await pool.query(q);
  const models: string[] = res.rows.map((r: { table_name: string }) => r.table_name);
  return { models };
}
export async function queryTable(params: any) {
  const table = String(params?.table ?? '');
  if (!table) throw new Error('Missing table');
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));
  const pool = getPool();
  const colRes = await pool.query(
    `select column_name from information_schema.columns where table_schema='public' and table_name=$1`,
    [table]
  );
  const allCols: string[] = colRes.rows.map((r: { column_name: string }) => r.column_name);
  const reqCols = Array.isArray(params?.columns) ? params.columns.map(String) : allCols;
  const cols = reqCols.filter((c: string) => allCols.includes(c));
  if (!cols.length) throw new Error('No columns');
  const orderBy = String(params?.orderBy ?? cols[0]);
  const orderDir = String(params?.orderDir ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const offset = (page - 1) * size;
  const sql = `select ${cols.map((c: string) => `"${c}"`).join(',')} from "${table}" order by "${orderBy}" ${orderDir} limit $1 offset $2`;
  const dataRes = await pool.query(sql, [size, offset]);
  const countRes = await pool.query(`select count(1) as cnt from "${table}"`);
  const items = dataRes.rows.map((r: Record<string, unknown>) => pick(r, cols));
  const total = Number((countRes.rows[0] as { cnt?: number })?.cnt ?? 0);
  return { items, page, size, total };
}
