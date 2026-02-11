import type { IQueryTableResponse } from '@csisp/idl/backoffice';
import { z } from 'zod';

import { requireAdmin } from '@/src/server/modules/auth/auth.service';
import * as service from '@/src/server/modules/db/db.service';

export async function listModels(_: unknown, ctx: Record<string, any>) {
  requireAdmin(ctx);
  return await service.listModels();
}

export const queryTableParams = z.object({
  table: z.string().min(1),
  columns: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  size: z.number().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});
export const queryTableResult = z.object({
  items: z.array(z.record(z.string(), z.any())),
  page: z.number(),
  size: z.number(),
  total: z.number(),
}) as unknown as z.ZodType<IQueryTableResponse>;

export async function queryTable(params: unknown, ctx: Record<string, any>) {
  requireAdmin(ctx);
  const p = queryTableParams.parse(params);
  const data = await service.queryTable(p);
  return queryTableResult.parse(data as any);
}
