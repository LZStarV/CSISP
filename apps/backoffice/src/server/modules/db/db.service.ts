import type { IQueryTableResponse } from '@csisp/idl/backoffice';

import { initModels, models } from '@/src/infra/postgres';

export async function listModels(): Promise<string[]> {
  await initModels();
  return Object.keys(models);
}

export async function queryTable(params: {
  table: string;
  columns?: string[];
  page?: number;
  size?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}): Promise<IQueryTableResponse> {
  await initModels();
  const table = String(params?.table || '');
  const model = (models as any)[table] || (models as any)[capitalize(table)];
  if (!model) {
    const err = new Error('Unknown table');
    (err as any).code = -32602;
    throw err;
  }
  const page = Math.max(1, Number(params?.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(params?.size ?? 20)));
  const offset = (page - 1) * size;
  const allCols = Object.keys(model.getAttributes?.() || {});
  const reqCols = Array.isArray(params?.columns)
    ? params.columns.map(String)
    : allCols;
  const cols = reqCols.filter(c => allCols.includes(c));
  if (!cols.length) {
    const err = new Error('No columns');
    (err as any).code = -32602;
    throw err;
  }
  const orderBy = allCols.includes(String(params?.orderBy))
    ? String(params?.orderBy)
    : cols[0];
  const orderDir =
    String(params?.orderDir ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
  const { rows, count } = await model.findAndCountAll({
    attributes: cols,
    limit: size,
    offset,
    order: [[orderBy, orderDir]],
  });
  return {
    items: rows.map((r: any) => r.toJSON()) as any,
    page,
    size,
    total: BigInt(count) as any,
  };
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
