import { RPC_PROTOCOL_KEY, RpcProtocol } from '@csisp/rpc/constants';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { getIdpLogger } from '../../infra/logger';

// 从 HTTP 请求路径和 RPC 请求体中提取方法名、ID 和协议信息
function deriveRpc(
  path: string,
  body: any,
  protocol?: RpcProtocol
): { rpcMethod?: string; rpcId?: any; protocol?: string } | undefined {
  if (protocol === RpcProtocol.THRIFT) {
    return {
      rpcMethod: 'thrift.call',
      protocol: 'thrift',
    };
  }

  const isJson = body && body.jsonrpc === '2.0';
  if (!isJson) return undefined;
  const pathOnly = (path ?? '').split('?')[0];
  const parts = pathOnly.replace(/^\/+/, '').split('/');
  const rpcInfo: any = { protocol: 'json-rpc', rpcId: body.id };

  if (parts.length >= 2) {
    const a = parts[parts.length - 2];
    const b = parts[parts.length - 1];
    rpcInfo.rpcMethod = `${a}.${b}`;
  } else if (parts.length === 1 && parts[0]) {
    rpcInfo.rpcMethod = parts[0];
  }

  return rpcInfo;
}

// 日志拦截器，记录所有 RPC 请求（JSON-RPC / Thrift）的生命周期
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();

    // 获取协议元数据
    const protocol = this.reflector.get<RpcProtocol>(
      RPC_PROTOCOL_KEY,
      context.getClass()
    );

    // 根据协议选择不同的 Logger 上下文
    const logger = getIdpLogger(
      protocol === RpcProtocol.THRIFT ? 'thrift' : 'http'
    );
    const rpc = deriveRpc(req.url, req.body, protocol);

    logger.info(
      {
        phase: 'start',
        method: req.method,
        url: req.url,
        ...(rpc ?? {}),
        // 如果是 JSON-RPC，记录请求参数（脱敏处理视业务而定）
        params:
          protocol === RpcProtocol.JSON_RPC ? req.body?.params : undefined,
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
