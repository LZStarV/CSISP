import type { IUserRecord } from '@csisp/idl/backoffice';
import { z } from 'zod';

import { requireAdmin } from '@/src/server/modules/auth/auth.service';
import * as service from '@/src/server/modules/user/user.service';

export const getUserParams = z
  .object({
    id: z.number().optional(),
    username: z.string().optional(),
  })
  .refine(p => !!p.id || !!p.username, { message: 'id or username required' });

export const getUserResult = z.object({
  id: z.number(),
  username: z.string(),
  status: z.number(),
}) as z.ZodType<IUserRecord>;

export async function get(params: unknown, ctx: Record<string, any>) {
  requireAdmin(ctx);
  const p = getUserParams.parse(params);
  const data = await service.getByIdOrUsername(p.id, p.username);
  return getUserResult.parse(data as any);
}

export const listUsersParams = z.object({
  page: z.number().min(1).default(1),
  size: z.number().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});
export const listUsersResult = z.object({
  items: z.array(getUserResult),
  page: z.number(),
  size: z.number(),
  total: z.number(),
});

export async function list(params: unknown, ctx: Record<string, any>) {
  requireAdmin(ctx);
  const p = listUsersParams.parse(params);
  const data = await service.list(p);
  return listUsersResult.parse(data as any);
}
