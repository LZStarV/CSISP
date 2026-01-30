export type JsonRpcId = string | number | null;

export type JsonRpcRequest<T = unknown> = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  params: T;
};

export type JsonRpcError = { code: number; message: string; data?: unknown };

export type JsonRpcResponse<T = unknown> =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: T }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: JsonRpcError };

// 定义 JSON‑RPC 标准错误码（包含扩展码）
export const RpcError = {
  ParseError: -32700, // 解析错误（JSON 解析失败）
  InvalidRequest: -32600, // 请求格式错误（缺少必要字段）
  MethodNotFound: -32601, // 方法不存在（未注册）
  InvalidParams: -32602, // 参数错误（无效参数值）
  InternalError: -32603, // 内部错误（服务器端异常）
  Unauthorized: -32001, // 未授权（未登录或权限不足）
  Forbidden: -32003, // 禁止访问（已登录但无权限）
  RateLimited: -32004, // 速率限制（请求频率过快）
  Conflict: -32009, // 冲突（如资源已存在）
  Unavailable: -32011, // 服务不可用（如数据库维护）
  NotFound: -32044, // 资源不存在（如用户/订单）
} as const;

/**
 * 构造 JSON‑RPC 成功响应
 * - id：请求唯一标识（可为字符串/数字/null）
 * - result：业务结果载荷（泛型）
 */
export function makeRpcResponse<T>(
  id: JsonRpcId,
  result: T
): JsonRpcResponse<T> {
  return { jsonrpc: '2.0', id, result };
}

/**
 * 构造 JSON‑RPC 错误响应
 * - id：请求唯一标识（可为字符串/数字/null）
 * - code：统一错误码（包含标准码与扩展码）
 * - message：错误信息（便于人类可读）
 * - data：可选的附加错误数据（如调试信息）
 */
export function makeRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse<never> {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

/**
 * 判断对象是否为 JSON‑RPC 请求结构
 * - 要求包含 jsonrpc='2.0'、id、params 字段
 */
export function isJsonRpcRequest(
  x: unknown
): x is { jsonrpc: '2.0'; id: JsonRpcId; params: unknown } {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.jsonrpc === '2.0' && 'id' in o && 'params' in o;
}
