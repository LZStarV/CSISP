/**
 * 请求日志拦截器
 *
 * 在所有 HTTP 请求入口和出口打点，
 * 输出包含方法、路径、状态码和耗时的日志，
 * 替代旧 backend 中 logger/accessLogger 的核心行为。
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { getBackendLogger } from '../../infra/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    const method: string = req.method;
    const url: string = req.url;
    const userAgent: string | undefined =
      req.get?.('user-agent') ?? req.headers['user-agent'];
    const ip: string | undefined = req.ip ?? req.connection?.remoteAddress;
    const traceId: string | undefined =
      req.headers?.['x-trace-id'] ??
      req.headers?.['X-Trace-Id'] ??
      req.headers?.['x-traceid'];
    const logger = getBackendLogger('http', traceId);
    const contentType: string | undefined = req.headers['content-type'];
    const isJson =
      typeof contentType === 'string' &&
      contentType.includes('application/json');
    let rpcMethod: string | undefined;
    const pathOnly = (url ?? '').split('?')[0];
    const parts = pathOnly.replace(/^\/+/, '').split('/');
    if (parts.length >= 2) {
      rpcMethod = `${parts[0]}.${parts[1]}`;
    } else if (parts.length === 1 && parts[0]) {
      rpcMethod = parts[0];
    }
    const rpc =
      isJson && req.body && req.body.jsonrpc === '2.0'
        ? { rpcMethod, rpcId: req.body.id }
        : undefined;

    logger.info(
      {
        phase: 'start',
        method,
        url,
        ...(rpc ?? {}),
        userAgent: userAgent ?? '',
        ip: ip ?? '',
      },
      'Request started'
    );

    return next.handle().pipe(
      tap(() => {
        const res: any = http.getResponse();
        const status: number = res.statusCode ?? 200;
        const duration = Date.now() - now;
        logger.info(
          {
            phase: 'end',
            method,
            url,
            ...(rpc ?? {}),
            status,
            duration,
            userAgent: userAgent ?? '',
            ip: ip ?? '',
          },
          'Request completed'
        );
      })
    );
  }
}
