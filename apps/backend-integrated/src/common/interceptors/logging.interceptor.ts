/**
 * 请求日志拦截器
 *
 * 在所有 HTTP 请求入口和出口打点，
 * 输出包含方法、路径、状态码和耗时的日志，
 * 替代旧 backend 中 logger/accessLogger 的核心行为。
 */
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req: any = http.getRequest();

    const method: string = req.method;
    const url: string = req.url;
    const userAgent: string | undefined = req.get?.('user-agent') ?? req.headers['user-agent'];
    const ip: string | undefined = req.ip ?? req.connection?.remoteAddress;

    this.logger.log(`Request started: ${method} ${url} - ua=${userAgent ?? ''} ip=${ip ?? ''}`);

    return next.handle().pipe(
      tap(() => {
        const res: any = http.getResponse();
        const status: number = res.statusCode ?? 200;
        const duration = Date.now() - now;
        this.logger.log(`Request completed: ${method} ${url} ${status} - ${duration}ms`);
      })
    );
  }
}
