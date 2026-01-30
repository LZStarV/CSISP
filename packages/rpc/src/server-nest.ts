import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Injectable,
  PipeTransform,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { makeRpcError, type JsonRpcId, RpcError } from './core';

/**
 * 全局异常过滤器（Nest 适配）
 * - 将框架异常统一映射为 JSON‑RPC 错误码并封装响应
 * - 透传请求头中的 x-trace-id 到响应头，便于链路追踪
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  /**
   * 处理异常并输出统一 JSON‑RPC 错误响应
   * - 根据异常类型映射 HTTP 状态与 RPC 错误码
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();
    const id: JsonRpcId = request.body?.id ?? null;
    const traceId: string | undefined = request.headers?.['x-trace-id'];
    let status = 500;
    let code: number = RpcError.InternalError;
    let msg = 'Internal error';
    if (exception instanceof BadRequestException) {
      status = 400;
      const payload: any = exception.getResponse?.();
      const message = payload?.message ?? exception.message;
      // 简化区分，默认按 InvalidParams
      code = RpcError.InvalidParams;
      msg = String(message);
    } else if (exception instanceof UnauthorizedException) {
      status = 401;
      code = RpcError.Unauthorized;
      msg = 'Unauthorized';
    } else if (exception instanceof ForbiddenException) {
      status = 403;
      code = RpcError.Forbidden;
      msg = 'Forbidden';
    } else if (exception instanceof NotFoundException) {
      status = 404;
      code = RpcError.NotFound;
      msg = 'Not Found';
    } else if (
      exception &&
      typeof (exception as any).getStatus === 'function'
    ) {
      status = Number((exception as any).getStatus()) || 500;
      const payload: any = (exception as any).getResponse?.();
      const message = payload?.message ?? (exception as any).message ?? 'Error';
      // 5xx 统一为 InternalError
      code = status >= 500 ? RpcError.InternalError : RpcError.InvalidRequest;
      msg = String(message);
    }
    if (traceId) {
      response.setHeader?.('x-trace-id', traceId);
    }
    response.status(status).json(makeRpcError(id, code, msg));
  }
}

@Injectable()
export class RpcRequestPipe implements PipeTransform {
  /**
   * 解析并校验 JSON‑RPC 请求体
   * - 支持字符串 JSON 的解析
   * - 校验 jsonrpc 版本为 2.0
   * - 仅返回 { id, params } 结构供控制器使用
   */
  transform(
    value:
      | { jsonrpc?: string; id?: JsonRpcId; params?: unknown }
      | string
      | undefined
  ) {
    let body: any = value;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        throw new BadRequestException('Invalid JSON');
      }
    }
    const ver = body?.jsonrpc;
    if (ver !== '2.0' && String(ver) !== '2.0') {
      throw new BadRequestException('Invalid JSON-RPC version');
    }
    const id = body?.id ?? null;
    const params = body?.params ?? {};
    return { id, params };
  }
}
