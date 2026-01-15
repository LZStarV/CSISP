export type JsonRpcId = string | number | null;

// JSON-RPC 成功响应
export function jsonrpcSuccess(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

// JSON-RPC 错误响应
export function jsonrpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  const err: Record<string, unknown> = { code, message };
  if (data !== undefined) err.data = data;
  return {
    jsonrpc: '2.0',
    error: err,
    id,
  };
}

// JSON-RPC 方法校验
export function isMethodValid(expectedAction: string, incomingMethod: string) {
  return !!incomingMethod && incomingMethod === expectedAction;
}
