import { Injectable, PipeTransform } from '@nestjs/common';

import { assertRPCRequest, RPCErrorCode, type RPCRequest } from './jsonrpc';
import { RpcError } from './rpc-error';

@Injectable()
export class RpcRequestPipe implements PipeTransform {
  transform(value: unknown): RPCRequest {
    const req = assertRPCRequest(value);
    if (!req) {
      throw new RpcError(
        null,
        RPCErrorCode.InvalidRequest,
        'Invalid JSON-RPC request'
      );
    }
    return req;
  }
}
