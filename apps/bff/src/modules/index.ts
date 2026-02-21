import Router from '@koa/router';
import type { Context, Next } from 'koa';

import { config } from '../config';
import { handlePost } from '../rpc/dispatcher';
import { handleOpenRPCAdmin, handleOpenRPCPortal } from '../rpc/openrpc';
import { registerBulk } from '../rpc/registry';

import { AdminModules } from './admin';
import { PortalModules } from './portal';

export const DomainModules = [...AdminModules, ...PortalModules];

const router = new Router({ prefix: config.routes.basePrefix });
router.get('/health', (ctx: Context) => {
  ctx.body = { code: 0, message: 'OK' };
});

router.post('/:subProject/:domain/:action', async (ctx: Context) => {
  await handlePost(ctx);
});
// TODO: 仅超级管理员可访问 openrpc 文档端点（后续开启权限）
router.get('/admin/openrpc.json', async (ctx: Context) => {
  await handleOpenRPCAdmin(ctx);
});
// TODO: 仅超级管理员可访问 openrpc 文档端点（后续开启权限）
router.get('/portal/openrpc.json', async (ctx: Context) => {
  await handleOpenRPCPortal(ctx);
});

for (const mod of DomainModules as any[]) {
  registerBulk(mod.subProject, mod.handlers);
}

// 兜底 404 处理
router.use(async (ctx: Context, next: Next) => {
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
