import Router from '@koa/router';
import admin from './admin';

const router = new Router({ prefix: '/api' });
router.get('/health', ctx => {
  ctx.body = { code: 0, message: 'OK' };
});
router.use('/admin', admin.routes(), admin.allowedMethods());

export default router;
