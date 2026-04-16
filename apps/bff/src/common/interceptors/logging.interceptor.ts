import { getBffLogger } from '@common/logger';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const now = Date.now();

    const method: string = req?.method ?? '';
    const url: string = req?.url ?? '';
    const traceId: string | undefined =
      req?.headers?.['x-trace-id'] ??
      req?.headers?.['X-Trace-Id'] ??
      req?.headers?.['x-traceid'];
    const logger = getBffLogger(
      undefined,
      typeof traceId === 'string' ? traceId : undefined
    );

    logger.info({ phase: 'start', method, url }, 'Request started');
    return next.handle().pipe(
      tap(() => {
        const res: any = http.getResponse();
        const status: number = res?.statusCode ?? 200;
        const duration = Date.now() - now;
        logger.info(
          { phase: 'end', method, url, status, duration },
          'Request completed'
        );
      })
    );
  }
}
