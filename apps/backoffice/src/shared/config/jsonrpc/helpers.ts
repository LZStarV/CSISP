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
