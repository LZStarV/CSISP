import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Injectable,
  NestMiddleware,
  PipeTransform,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

import { makeRpcError, type JsonRpcId, RpcError } from './core';

/**
 * Thrift 原始主体解析中间件
 * - 自动识别 application/x-thrift 或 application/octet-stream
 * - 仅对 Thrift 请求进行 raw body 解析，不干扰普通 JSON 请求
 */
@Injectable()
export class ThriftRawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const contentType = req.headers['content-type'];
    if (
      contentType === 'application/x-thrift' ||
      contentType === 'application/octet-stream'
    ) {
      return express.raw({ type: contentType, limit: '10mb' })(req, res, next);
    }
    next();
  }
}

/**
 * 全局异常过滤器（Nest 适配）
 * - 将框架异常统一映射为 JSON‑RPC 错误码并封装响应
 * - 支持多协议识别：如果是 THRIFT 协议，跳过 JSON-RPC 封装
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  /**
   * 处理异常并输出统一 JSON‑RPC 错误响应
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
   * - 仅对 JSON_RPC 接口生效，严格要求 jsonrpc 2.0 格式
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
