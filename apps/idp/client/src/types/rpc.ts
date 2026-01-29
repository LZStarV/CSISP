export type JsonRpcRequest<T = unknown> = {
  jsonrpc: '2.0';
  id: string | number;
  params: T;
};

export type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

export type JsonRpcResponse<T = unknown> = {
  jsonrpc: string;
  id: string | number;
  result?: T;
  error?: JsonRpcError;
};
