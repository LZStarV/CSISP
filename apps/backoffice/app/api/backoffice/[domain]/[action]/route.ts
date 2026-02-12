import { makeRpcResponse } from '@csisp/rpc/core';
import {
  parseRpcRequest,
  wrapRpcError,
  mapRpcToHttpStatus,
} from '@csisp/rpc/server-node';
import { NextResponse } from 'next/server';

import { withAuth } from '@/src/server/middleware/jwtAuth';
import { logRpc } from '@/src/server/middleware/logger';
import { limit } from '@/src/server/middleware/rateLimit';
import { withTraceId } from '@/src/server/middleware/trace';
import { dispatch } from '@/src/server/rpc/dispatcher';

// JSON-RPC 统一入口（动态路由）
// - 路径模式：/api/backoffice/:domain/:action
// - 约定：请求体中的 method 必须与路由中的 action 一致，仅使用 action，不包含 domain
export async function POST(req: Request, context: any) {
  const { domain, action } = await (context?.params ?? {});
  const body = await req.json();

  const { id, params: rpcParams, error } = parseRpcRequest(body);

  const ctx: Record<string, any> = {
    headers: req.headers,
    ip: 'local',
    path: `/api/backoffice/${domain}/${action}`,
  };

  if (error && 'error' in error) {
    const status = mapRpcToHttpStatus(error.error.code);
    const res = NextResponse.json(error, { status });
    return res;
  }

  try {
    withTraceId(ctx);
    await withAuth(ctx);
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

    const respBody = makeRpcResponse(id, result);
    const res = NextResponse.json(respBody, { status: 200 });

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

    // 处理控制器设置的额外 Cookie (如 OIDC state/verifier)
    if (ctx.resCookies && Array.isArray(ctx.resCookies)) {
      for (const cookie of ctx.resCookies) {
        res.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600,
          ...cookie.options,
        });
      }
    }

    if (ctx.state?.traceId) {
      res.headers.set('x-trace-id', ctx.state.traceId);
    }
    logger.info({ status: 200, duration: Date.now() - start }, 'RPC success');
    return res;
  } catch (e: any) {
    const errorResp = wrapRpcError(id, e);
    if ('error' in errorResp) {
      const code = errorResp.error.code;
      const message = errorResp.error.message;
      const status = mapRpcToHttpStatus(code);

      const logger = logRpc(ctx, {
        domain,
        action,
        id,
        userId: ctx.state?.user?.id,
        roles: ctx.state?.user?.roles,
      });
      const res = NextResponse.json(errorResp, { status });
      if (ctx.state?.traceId) {
        res.headers.set('x-trace-id', ctx.state.traceId);
      }
      logger.error({ status, error: message, rpc_code: code }, 'RPC error');
      return res;
    }
    return NextResponse.json(errorResp, { status: 500 });
  }
}
