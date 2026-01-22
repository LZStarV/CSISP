import { JSONRPC_ERROR_CODES } from './codes';
import type { JsonRpcId, RPCResponse } from './types';

export function success<T>(id: JsonRpcId, result: T): RPCResponse<T> {
  return { jsonrpc: '2.0', id, result };
}

export function error(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): RPCResponse {
  const err: Record<string, unknown> = { code, message };
  if (data !== undefined) err.data = data;
  return { jsonrpc: '2.0', id, error: err as any };
}

export function invalidRequest(
  id: JsonRpcId,
  message = 'Invalid Request',
  data?: unknown
) {
  return error(id, JSONRPC_ERROR_CODES.InvalidRequest, message, data);
}

export function methodNotFound(
  id: JsonRpcId,
  message = 'Method not found',
  data?: unknown
) {
  return error(id, JSONRPC_ERROR_CODES.MethodNotFound, message, data);
}

export function invalidParams(
  id: JsonRpcId,
  message = 'Invalid params',
  data?: unknown
) {
  return error(id, JSONRPC_ERROR_CODES.InvalidParams, message, data);
}

export function internalError(
  id: JsonRpcId,
  message = 'Internal error',
  data?: unknown
) {
  return error(id, JSONRPC_ERROR_CODES.InternalError, message, data);
}

export function isMethodValid(expectedAction: string, incomingMethod: string) {
  return !!incomingMethod && incomingMethod === expectedAction;
}

export function makeId(): number {
  return Date.now();
}

// 获取 JSON-RPC 错误码对应的枚举键名
export function getEnumKeyByCode(code: number): string {
  const entries = Object.entries(JSONRPC_ERROR_CODES) as Array<
    [string, number]
  >;
  for (const [k, v] of entries) {
    if (v === code) return k;
  }
  return 'OK';
}

// 将 JSON-RPC 错误码映射到 HTTP 状态码
export function mapRpcToHttpStatus(
  code: number,
  message?: string,
  data?: any
): number {
  if (code === JSONRPC_ERROR_CODES.MethodNotFound) return 404;
  if (code === JSONRPC_ERROR_CODES.InvalidParams) {
    if (
      String(message || '')
        .toLowerCase()
        .startsWith('forbidden')
    )
      return 403;
    if (
      String(message || '')
        .toLowerCase()
        .startsWith('unauthorized')
    )
      return 401;
    if (
      data &&
      typeof data === 'object' &&
      ('resetMs' in data || 'remaining' in data)
    )
      return 429;
    return 422;
  }
  if (code === JSONRPC_ERROR_CODES.InvalidRequest) return 400;
  if (code === JSONRPC_ERROR_CODES.InternalError) return 500;
  return 500;
}

// 设置 JSON-RPC 响应头
export function setRpcHeaders(
  resp: globalThis.Response,
  code: number,
  message: string,
  traceId?: string
) {
  resp.headers.set('X-RPC-Code', String(code || 0));
  resp.headers.set('X-RPC-Message', message || (code ? 'Error' : 'OK'));
  resp.headers.set('X-RPC-Enum', getEnumKeyByCode(code));
  if (traceId) resp.headers.set('X-Trace-Id', traceId);
}
