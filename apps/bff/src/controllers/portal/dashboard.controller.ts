import type { Context } from 'koa';
import { aggregatePortalDashboard } from '../../services/portal/dashboard.service';

export async function getPortalStudentDashboard(ctx: Context) {
  const userId = Number((ctx.state as any)?.query?.userId ?? (ctx.state as any)?.userId);
  if (!userId) ctx.throw(400, 'Invalid userId');
  const data = await aggregatePortalDashboard(userId);
  ctx.body = { code: 0, message: 'OK', data };
}
