import Router from '@koa/router';
import { getAdminDashboard } from '../controllers/admin/dashboard.controller';

const admin = new Router();
admin.get('/dashboard', getAdminDashboard);

export default admin;
