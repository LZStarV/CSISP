import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { getIdpLogger } from '../../infra/logger';

function deriveRpc(
  path: string,
  body: any
): { rpcMethod?: string; rpcId?: any } | undefined {
  const isJson = body && body.jsonrpc === '2.0';
  if (!isJson) return undefined;
  const pathOnly = (path ?? '').split('?')[0];
  const parts = pathOnly.replace(/^\/+/, '').split('/');
  if (parts.length >= 2) {
    const a = parts[parts.length - 2];
    const b = parts[parts.length - 1];
    return { rpcMethod: `${a}.${b}`, rpcId: body.id };
  }
  if (parts.length === 1 && parts[0]) {
    return { rpcMethod: parts[0], rpcId: body.id };
  }
  return { rpcId: body.id };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();
    const logger = getIdpLogger('http');
    const rpc = deriveRpc(req.url, req.body);
    logger.info(
      {
        phase: 'start',
        method: req.method,
        url: req.url,
        ...(rpc ?? {}),
      },
      'Request started'
    );
    return next.handle().pipe(
      tap(() => {
        const status: number = res.statusCode ?? 200;
        const duration = Date.now() - now;
        logger.info(
          {
            phase: 'end',
            method: req.method,
            url: req.url,
            ...(rpc ?? {}),
            status,
            duration,
          },
          'Request completed'
        );
      })
    );
  }
}
