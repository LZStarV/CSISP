import { IThriftProcessor } from '@creditkarma/thrift-server-core';
import { ThriftServerExpress } from '@creditkarma/thrift-server-express';
import type { RequestHandler, Request, Response, NextFunction } from 'express';

/**
 * 创建 Thrift Express 中间件
 * - 统一使用 BufferedTransport + BinaryProtocol
 * - 可直接挂载到 NestJS 的 main.ts 中
 */
export function createThriftMiddleware<THandler>(
  Processor: {
    new (handler: THandler): IThriftProcessor<any>;
    serviceName: string;
  },
  handler: THandler
): RequestHandler {
  const processor = new Processor(handler);
  return ThriftServerExpress({
    serviceName: Processor.serviceName,
    handler: processor,
    transport: 'buffered',
    protocol: 'binary',
  });
}

/**
 * 在 NestJS Controller 中运行 Thrift 中间件的适配器
 * - 自动处理 req.url 补丁 (剥离前缀使中间件识别为根路径)
 */
export function runThrift(
  middleware: RequestHandler,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 补丁：将 URL 重置为 /，使底层中间件认为它挂载在根路径
  req.url = '/';

  // 确保 req.body 是 Buffer 类型
  if (
    req.body &&
    !Buffer.isBuffer(req.body) &&
    req.body instanceof Uint8Array
  ) {
    req.body = Buffer.from(req.body);
  }

  return middleware(req, res, next);
}

/**
 * 提取安全的 RPC 上下文，防止上下文污染
 * - 仅透传链路追踪相关的 Header
 * - 严禁透传 url 等可能导致 Thrift 客户端重写请求路径的属性
 */
export function getSafeContext(ctx?: any) {
  const safeCtx: any = { headers: {} };
  if (ctx?.headers) {
    // 仅透传 trace 相关 header
    const traceId =
      ctx.headers.get?.('x-trace-id') || ctx.headers['x-trace-id'];
    if (traceId) {
      safeCtx.headers['x-trace-id'] = traceId;
    }
  }
  return safeCtx;
}
