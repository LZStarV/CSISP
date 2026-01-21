import type { Context } from 'koa';
import { z } from 'zod';

export const PortalDemoTestParams = z.object({}).optional();
export const PortalDemoTestResult = z.object({
  ok: z.boolean(),
  project: z.string(),
});

export async function demoTest(ctx: Context, _params: unknown) {
  return { ok: true, project: 'portal' };
}
