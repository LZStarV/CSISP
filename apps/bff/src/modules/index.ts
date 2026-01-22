import Router from '@koa/router';

import { handlePost } from '../rpc/dispatcher';
import { handleOpenRPCAdmin, handleOpenRPCPortal } from '../rpc/openrpc';
import { registerBulk } from '../rpc/registry';

import { AdminModules } from './admin';
import { PortalModules } from './portal';

export const DomainModules = [...AdminModules, ...PortalModules];

const router = new Router({ prefix: '/api/bff' });
router.get('/health', ctx => {
  ctx.body = { code: 0, message: 'OK' };
});

router.post('/:subProject/:domain/:action', handlePost as any);
// TODO: 仅超级管理员可访问 openrpc 文档端点（后续开启权限）
router.get('/admin/openrpc.json', handleOpenRPCAdmin as any);
// TODO: 仅超级管理员可访问 openrpc 文档端点（后续开启权限）
router.get('/portal/openrpc.json', handleOpenRPCPortal as any);

for (const mod of DomainModules as any[]) {
  registerBulk(mod.subProject, mod.handlers);
}

// 兜底 404 处理
router.use(async (ctx, next) => {
  await next();
  if (ctx.body === undefined && (!ctx.status || ctx.status === 404)) {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: 'Not Found',
      path: ctx.path,
      method: ctx.method,
    };
  }
});

export default router;
