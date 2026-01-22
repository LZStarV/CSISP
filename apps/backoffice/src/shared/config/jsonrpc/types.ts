export type JsonRpcId = string | number | null;

export interface RPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface RPCSuccess<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: T;
}

export interface RPCFailure {
  jsonrpc: '2.0';
  id: JsonRpcId;
  error: RPCError;
}

export type RPCResponse<T = unknown> = RPCSuccess<T> | RPCFailure;
