export type JSONRPCVersion = '2.0';

// JSON-RPC 请求体
export interface RPCRequest<Params = unknown> {
  jsonrpc: JSONRPCVersion;
  id: string | number | null;
  params?: Params;
}

// JSON-RPC 错误响应体
export interface RPCError {
  code: number;
  message: string;
  data?: unknown;
}

// JSON-RPC 成功响应体
export interface RPCResponse<Result = unknown> {
  jsonrpc: JSONRPCVersion;
  id: string | number | null;
  result?: Result;
  error?: RPCError;
}

// JSON-RPC 错误码
export const RPCErrorCode = {
  // 解析错误
  ParseError: -32700,
  // 请求错误
  InvalidRequest: -32600,
  // 方法不存在
  MethodNotFound: -32601,
  // 参数错误
  InvalidParams: -32602,
  // 内部错误
  InternalError: -32603,
  // 服务器错误
  ServerError: -32000,
} as const;

// 生成 JSON-RPC 成功响应
export function ok<Result>(
  id: RPCResponse['id'],
  result: Result
): RPCResponse<Result> {
  return { jsonrpc: '2.0', id, result };
}
// 生成 JSON-RPC 错误响应
export function err<Result = never>(
  id: RPCResponse['id'],
  code: number,
  message: string,
  data?: unknown
): RPCResponse<Result> {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

// 校验 JSON-RPC 请求体是否符合规范
export function assertRPCRequest(body: any): RPCRequest | null {
  if (!body || typeof body !== 'object') return null;
  if (body.jsonrpc !== '2.0') return null;
  if (!('id' in body)) return null;
  return body as RPCRequest;
}
