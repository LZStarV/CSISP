export type JsonRpcId = string | number | null;
export type JsonRpcResult = unknown;
export type JsonRpcError = { code: number; message: string; data?: unknown };
export type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: JsonRpcResult }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: JsonRpcError };

export function makeRpcResponse(
  id: JsonRpcId,
  result: JsonRpcResult
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

export function makeRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}
