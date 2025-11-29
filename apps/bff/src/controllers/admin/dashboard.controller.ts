import type { Context } from 'koa';
import { aggregateAdminDashboard } from '../../services/admin/dashboard.service';

export async function getAdminDashboard(ctx: Context) {
  const userId = Number((ctx.state as any)?.userId || (ctx.request as any)?.query?.userId);
  const data = await aggregateAdminDashboard(userId);
  ctx.body = { code: 0, message: 'OK', data };
}
