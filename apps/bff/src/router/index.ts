import Router from '@koa/router';
import admin from './admin';
import portal from './portal';

const router = new Router({ prefix: '/api' });
router.get('/health', ctx => {
  ctx.body = { code: 0, message: 'OK' };
});
router.use('/admin', admin.routes(), admin.allowedMethods());
router.use('/portal', portal.routes(), portal.allowedMethods());

export default router;
