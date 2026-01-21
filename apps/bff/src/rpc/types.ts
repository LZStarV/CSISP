export type RPCID = string | number | null;
export type RPCRequest = { jsonrpc: '2.0'; id: RPCID; method: string; params?: unknown };
export type RPCSuccess = { jsonrpc: '2.0'; id: RPCID; result: unknown };
export type RPCErrorObject = { code: number; message: string; data?: unknown };
export type RPCFailure = { jsonrpc: '2.0'; id: RPCID; error: RPCErrorObject };
export type RPCResponse = RPCSuccess | RPCFailure;

export enum RPCErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  Unauthorized = -32001,
  Forbidden = -32003,
}

export function ok(id: RPCID, result: unknown): RPCSuccess {
  return { jsonrpc: '2.0', id, result };
}

export function err(id: RPCID, code: number, message: string, data?: unknown): RPCFailure {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

export function genId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `rpc_${Date.now()}_${rand}`;
}
