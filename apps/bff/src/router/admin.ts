import Router from '@koa/router';
import { getAdminOverview } from '../controllers/admin/dashboard.controller';
import { jwtAuth, requireAdmin } from '@csisp/middlewares';
import { validateQuery } from '@csisp/validation';
import { AdminOverviewQuery } from '../schemas/dashboard.schema';

const admin = new Router();
admin.get(
  '/dashboard/overview',
  jwtAuth({ required: true }),
  requireAdmin,
  validateQuery(AdminOverviewQuery),
  getAdminOverview
);

export default admin;
