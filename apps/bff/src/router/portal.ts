import Router from '@koa/router';
import { validateQuery } from '@csisp/validation';
import { StudentDashboardQuery } from '../schemas/dashboard.schema';
import { getPortalStudentDashboard } from '../controllers/portal/dashboard.controller';

const portal = new Router();
portal.get('/dashboard/student', validateQuery(StudentDashboardQuery), getPortalStudentDashboard);

export default portal;
