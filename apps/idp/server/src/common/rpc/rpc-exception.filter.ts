import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { getIdpLogger } from '../../infra/logger';

import { makeRpcError } from './jsonrpc';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();
    const id = request.body?.id ?? null;
    const logger = getIdpLogger('rpc-exception');
    if (exception instanceof HttpException) {
      const status = (exception.getStatus?.() as number) ?? 500;
      const message =
        (exception.getResponse?.() as any)?.message ?? exception.message;
      logger.warn({ status, message, id }, 'http exception');
      response.status(status).json(makeRpcError(id, -32000, String(message)));
    } else {
      logger.error(
        { err: (exception as any)?.stack || String(exception), id },
        'internal error'
      );
      response.status(500).json(makeRpcError(id, -32001, 'Internal error'));
    }
  }
}
