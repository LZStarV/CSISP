export type JsonRpcId = string | number | null;

export function jsonrpcSuccess(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

export function jsonrpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  const err: Record<string, unknown> = { code, message };
  if (data !== undefined) err.data = data;
  return {
    jsonrpc: '2.0',
    error: err,
    id,
  };
}

export function isMethodValid(expectedAction: string, incomingMethod: string) {
  return !!incomingMethod && incomingMethod === expectedAction;
}
