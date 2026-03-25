import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { makeRpcResponse, isJsonRpcResponse } from './jsonrpc';

@Injectable()
export class JsonRpcInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const rpcId = body?.id ?? null;

    return next.handle().pipe(
      map(data => {
        // 使用公共包抽离的判断逻辑
        if (isJsonRpcResponse(data)) {
          return data;
        }
        // 否则进行包装
        return makeRpcResponse(rpcId, data);
      })
    );
  }
}
