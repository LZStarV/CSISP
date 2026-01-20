import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcError } from './rpc-error';
import { err } from './jsonrpc';

@Catch(RpcError)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res: any = ctx.getResponse();
    res.status(200).json(err(exception.id, exception.code, exception.message, exception.data));
  }
}
