import { NextResponse } from 'next/server';

import { wrapError } from '@/src/server/middleware/errorWrapper';
import { withAuth } from '@/src/server/middleware/jwtAuth';
import { logRpc } from '@/src/server/middleware/logger';
import { limit } from '@/src/server/middleware/rateLimit';
import { withTraceId } from '@/src/server/middleware/trace';
import { dispatch } from '@/src/server/rpc/dispatcher';
import {
  isMethodValid,
  success,
  invalidRequest,
} from '@/src/shared/config/jsonrpc/helpers';

// JSON-RPC 统一入口（动态路由）
// - 路径模式：/api/backoffice/:domain/:action
// - 约定：请求体中的 method 必须与路由中的 action 一致，仅使用 action，不包含 domain
// - 行为：
//   1) 读取并校验 JSON-RPC 请求（method 与 action 匹配）
//   2) 分发到对应 domain 的 handler
//   3) 返回统一格式的 JSON-RPC 响应（成功/错误）
export async function POST(req: Request, context: any) {
  const { domain, action } = await (context?.params ?? {});

  const body = await req.json();
  const method = String(body?.method ?? '');
  const rpcParams = body?.params ?? {};
  const id = body?.id ?? null;

  if (!isMethodValid(action, method)) {
    return NextResponse.json(invalidRequest(id, 'Invalid method'), {
      status: 200,
    });
  }

  try {
    const ctx: Record<string, any> = {
      headers: req.headers,
      ip: 'local',
      path: `/api/backoffice/${domain}/${action}`,
    };
    withTraceId(ctx);
    withAuth(ctx);
    await limit({ ip: ctx.ip, path: ctx.path });
    const start = Date.now();
    const result = await dispatch(domain, action, rpcParams, ctx);
    const logger = logRpc(ctx, { domain, action, id });
    logger.info({ status: 200, duration: Date.now() - start }, 'RPC success');
    return NextResponse.json(success(id, result), { status: 200 });
  } catch (e: any) {
    const resp = wrapError(id, e);
    const ctx: Record<string, any> = {
      headers: req.headers,
      ip: 'local',
      path: `/api/backoffice/${domain}/${action}`,
    };
    const logger = logRpc(ctx, { domain, action, id });
    logger.info(
      { status: 200, error: e?.message || 'Internal error' },
      'RPC error'
    );
    return NextResponse.json(resp, { status: 200 });
  }
}
