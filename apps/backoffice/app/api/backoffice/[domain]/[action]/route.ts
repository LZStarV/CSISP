import { NextResponse } from 'next/server';
import { dispatch } from '@/src/server/rpc/dispatcher';
import { isMethodValid, jsonrpcSuccess, jsonrpcError } from '@/src/shared/config/jsonrpc';

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
    return NextResponse.json(jsonrpcError(id, 400, 'Invalid method'), { status: 400 });
  }

  try {
    const result = await dispatch(domain, action, rpcParams, req.headers as Headers);
    return NextResponse.json(jsonrpcSuccess(id, result), { status: 200 });
  } catch (e: any) {
    const message = e?.message || 'Internal Error';
    return NextResponse.json(jsonrpcError(id, 500, message), { status: 500 });
  }
}
