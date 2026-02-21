import { getBaseLogger } from '@infra/logger';
import type { Context } from 'koa';

import { config } from '../config';

import { InvalidRequest, InternalError, MethodNotFound } from './errors';
import { call } from './registry';
import { ok, genId, type RPCResponse, type RPCID } from './types';

function makeMethod(domain: string, action: string) {
  return `${domain}.${action}`;
}

export async function handlePost(ctx: Context): Promise<void> {
  const { subProject, domain, action } = ctx.params as Record<string, string>;
  if (!domain || !action) {
    ctx.body = InvalidRequest(null, { reason: 'Missing domain/action in URL' });
    return;
  }
  if (!subProject) {
    ctx.body = InvalidRequest(null, { reason: 'Missing subProject in URL' });
    return;
  }
  const method = makeMethod(domain, action);
  const id: RPCID =
    (ctx.request.body && (ctx.request.body as any).id) ?? genId();
  const params = ctx.request.body ?? {};
  const enabled = config.features.enabledSubProjects;
  if (!enabled.includes(subProject)) {
    ctx.body = MethodNotFound(id, { subProject });
    return;
  }
  const logger = getBaseLogger().child({
    context: 'rpc',
    method,
    id,
    subProject,
  });
  const start = Date.now();
  try {
    const result = await call(subProject, method, ctx, params);
    ctx.body = ok(id, result) as RPCResponse;
    logger.info({ status: 200, duration: Date.now() - start }, 'RPC success');
  } catch (e: any) {
    const msg = e?.message || 'Internal error';
    if (msg.startsWith('Method not found')) {
      ctx.body = MethodNotFound(id, { subProject, method });
    } else {
      ctx.body = InternalError(id, { message: msg });
    }
    logger.info(
      { status: 200, duration: Date.now() - start, error: msg },
      'RPC error'
    );
  }
}

// 已统一用 POST；GET 入口移除
