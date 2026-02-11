import {
  RpcError,
  makeRpcError,
  isJsonRpcRequest,
  type JsonRpcId,
  type JsonRpcResponse,
} from './core';

/**
 * 通用的 RPC 请求解析器
 * - 支持解析字符串或对象
 * - 校验 JSON-RPC 2.0 协议规范
 */
export function parseRpcRequest(body: unknown): {
  id: JsonRpcId;
  params: any;
  error?: JsonRpcResponse<never>;
} {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;

    if (!isJsonRpcRequest(parsed)) {
      const id = (parsed as any)?.id ?? null;
      return {
        id,
        params: {},
        error: makeRpcError(id, RpcError.InvalidRequest, 'Invalid Request'),
      };
    }

    return {
      id: parsed.id,
      params: parsed.params,
    };
  } catch {
    return {
      id: null,
      params: {},
      error: makeRpcError(null, RpcError.ParseError, 'Parse error'),
    };
  }
}

/**
 * 通用的 RPC 错误包装器
 * - 将各种错误对象统一映射为标准的 JSON-RPC 错误响应
 */
export function wrapRpcError(
  id: JsonRpcId,
  error: unknown
): JsonRpcResponse<never> {
  let code: number = RpcError.InternalError;
  let msg = 'Internal error';
  let data: unknown = undefined;

  if (error instanceof Error) {
    msg = error.message;
    // 如果错误对象带有 code 属性（如业务异常）
    if (typeof (error as any).code === 'number') {
      code = (error as any).code;
    }
    if ((error as any).data) {
      data = (error as any).data;
    }

    // 针对特定关键字的启发式映射
    const lowerMsg = msg.toLowerCase();
    if (
      lowerMsg.includes('unauthorized') ||
      lowerMsg.includes('login required')
    ) {
      code = RpcError.Unauthorized;
    } else if (
      lowerMsg.includes('forbidden') ||
      lowerMsg.includes('permission denied')
    ) {
      code = RpcError.Forbidden;
    } else if (lowerMsg.includes('not found')) {
      code = RpcError.NotFound;
    } else if (
      lowerMsg.includes('invalid params') ||
      lowerMsg.includes('bad request')
    ) {
      code = RpcError.InvalidParams;
    }
  } else if (typeof error === 'string') {
    msg = error;
  }

  return makeRpcError(id, code, msg, data);
}

/**
 * 将 RPC 错误码映射到 HTTP 状态码
 * - 逻辑同步自 server-nest.ts 的 RpcExceptionFilter
 */
export function mapRpcToHttpStatus(code: number): number {
  switch (code) {
    case RpcError.InvalidRequest:
      return 400;
    case RpcError.Unauthorized:
      return 401;
    case RpcError.Forbidden:
      return 403;
    case RpcError.NotFound:
      return 404;
    case RpcError.InvalidParams:
      return 422;
    case RpcError.RateLimited:
      return 429;
    case RpcError.Conflict:
      return 409;
    case RpcError.MethodNotFound:
      return 404;
    case RpcError.ParseError:
      return 400;
    case RpcError.InternalError:
    default:
      return 500;
  }
}
