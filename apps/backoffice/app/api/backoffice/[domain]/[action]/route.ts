import { NextResponse } from 'next/server';

import { wrapError } from '@/src/server/middleware/errorWrapper';
import { withAuth } from '@/src/server/middleware/jwtAuth';
import { logRpc } from '@/src/server/middleware/logger';
import { limit } from '@/src/server/middleware/rateLimit';
import { withTraceId } from '@/src/server/middleware/trace';
import { dispatch } from '@/src/server/rpc/dispatcher';
import {
  success,
  mapRpcToHttpStatus,
  setRpcHeaders,
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
  const rpcParams = body?.params ?? {};
  const id = body?.id ?? null;

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
    const logger = logRpc(ctx, {
      domain,
      action,
      id,
      userId: ctx.state?.user?.id,
      roles: ctx.state?.user?.roles,
    });
    const body = success(id, result);
    const res = NextResponse.json(body, { status: 200 });
    if (domain === 'auth' && action === 'login' && (result as any)?.token) {
      const token = (result as any).token as string;
      const secure = process.env.NODE_ENV === 'production';
      res.cookies.set('token', token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 2 * 60 * 60, // 2 hours
      });
    }
    setRpcHeaders(res, 0, 'OK', ctx.state?.traceId);
    logger.info({ status: 200, duration: Date.now() - start }, 'RPC success');
    return res;
  } catch (e: any) {
    const resp = wrapError(id, e);
    const ctx: Record<string, any> = {
      headers: req.headers,
      ip: 'local',
      path: `/api/backoffice/${domain}/${action}`,
    };
    const code = (resp as any)?.error?.code ?? 0;
    const message = (resp as any)?.error?.message ?? 'Internal error';
    const status = mapRpcToHttpStatus(
      code,
      message,
      (resp as any)?.error?.data
    );
    const logger = logRpc(ctx, {
      domain,
      action,
      id,
      userId: ctx.state?.user?.id,
      roles: ctx.state?.user?.roles,
    });
    const res = NextResponse.json(resp, { status });
    setRpcHeaders(res, code, message, ctx.state?.traceId);
    logger.error({ status, error: message, rpc_code: code }, 'RPC error');
    return res;
  }
}
