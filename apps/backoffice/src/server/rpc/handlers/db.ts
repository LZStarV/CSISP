import { getPool, isDbConfigured } from '@/src/server/db/client';
import type { IQueryTableResponseArgs } from '@csisp/idl/backoffice';

// 数据库结构与表数据只读查询
// listModels：列出 public schema 下的基础表名
// queryTable：按表名进行分页查询，支持列白名单与排序（仅只读）

// 选择对象中的指定字段，返回一个仅包含这些字段的对象
function pick<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const k of keys) {
    r[k] = obj[k];
  }
  return r;
}

// 列出 public schema 下的所有基础表名（只读）
export async function listModels() {
  // 若未配置数据库连接，返回空列表，避免抛错
  if (!isDbConfigured()) {
    return { models: [] };
  }

  const pool = getPool();
  const q = `
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name asc
  `;
  const res = await pool.query(q);
  const models: string[] = res.rows.map((r: { table_name: string }) => r.table_name);
  return { models };
}

// 按表名进行只读分页查询，支持列白名单与排序
export async function queryTable(params: any): Promise<IQueryTableResponseArgs> {
  // 校验表名
  const table = String(params?.table ?? '');
  if (!table) {
    throw new Error('Missing table');
  }

  // 分页与上限控制
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));

  // 未配置数据库时返回空分页
  if (!isDbConfigured()) {
    return { items: [] as any, page, size, total: 0 };
  }

  const pool = getPool();

  // 获取目标表的所有列名，用于白名单与校验
  const colRes = await pool.query(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = $1
    `,
    [table]
  );
  const allCols: string[] = colRes.rows.map((r: { column_name: string }) => r.column_name);

  // 请求列若未指定，则使用全量列；再与白名单交集过滤
  const reqCols = Array.isArray(params?.columns) ? params.columns.map(String) : allCols;
  const cols = reqCols.filter((c: string) => allCols.includes(c));
  if (!cols.length) {
    throw new Error('No columns');
  }

  // 排序列与方向校验
  const orderBy = String(params?.orderBy ?? cols[0]);
  const orderDir = String(params?.orderDir ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const offset = (page - 1) * size;

  // 组装只读查询 SQL（列名与表名进行引用以避免关键词冲突）
  const selectCols = cols.map((c: string) => `"${c}"`).join(',');
  const sql = `
    select ${selectCols}
    from "${table}"
    order by "${orderBy}" ${orderDir}
    limit $1 offset $2
  `;

  const dataRes = await pool.query(sql, [size, offset]);
  const countRes = await pool.query(`select count(1) as cnt from "${table}"`);

  const items = dataRes.rows.map((r: Record<string, unknown>) => pick(r, cols));
  const total = Number((countRes.rows[0] as { cnt?: number })?.cnt ?? 0);

  const result: IQueryTableResponseArgs = { items: items as any, page, size, total };
  return result;
}
