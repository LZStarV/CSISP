import type { Context } from 'koa';
import { z } from 'zod';

export const AdminDemoTestParams = z.object({}).optional();
export const AdminDemoTestResult = z.object({
  ok: z.boolean(),
  project: z.string(),
});

export async function demoTest(ctx: Context, _params: unknown) {
  return { ok: true, project: 'admin' };
}
