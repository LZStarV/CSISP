import type { Context } from 'koa';
import { aggregatePortalDashboard } from '../../services/portal/dashboard.service';

export async function getPortalStudentDashboard(ctx: Context) {
  const userId = Number((ctx.state as any)?.query?.userId ?? (ctx.state as any)?.userId);
  if (!userId) ctx.throw(400, 'Invalid userId');
  const traceId = (ctx.state as any)?.traceId as string | undefined;
  const data = await aggregatePortalDashboard(userId, traceId);
  ctx.body = { code: 0, message: 'OK', data };
}
