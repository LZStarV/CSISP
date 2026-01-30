import type { JsonRpcResponse, JsonRpcId, JsonRpcError } from './core';

/**
 * 以 fetch 发起 JSON‑RPC 调用
 * - method：后端方法路径（如 'auth/login'）
 * - params：请求参数对象
 * - init：可选的 fetch 参数（headers/credentials 等）
 * - 自动注入 x-trace-id 以便链路追踪
 */
export async function call<T>(
  method: string,
  params: unknown,
  init?: RequestInit
): Promise<JsonRpcResponse<T>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (!headers['x-trace-id']) {
    headers['x-trace-id'] =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  const res = await fetch(`/api/idp/${method}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), params }),
    credentials: init?.credentials ?? 'include',
  });
  return res.json();
}

// 判断 JSON‑RPC 响应是否包含错误
export function hasError<T>(
  result: JsonRpcResponse<T> | unknown
): result is { jsonrpc: '2.0'; id: JsonRpcId; error: JsonRpcError } {
  if (!result || typeof result !== 'object') return true;
  const r = result as any;
  if ('error' in r && r.error) return true;
  // 兼容部分后端/代理在 5xx 时返回非标准 JSON-RPC 包含 code/message
  if (typeof r.code === 'number' && r.code >= 500) return true;
  return false;
}
