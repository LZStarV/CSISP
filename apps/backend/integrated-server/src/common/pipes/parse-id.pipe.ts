import { Injectable, PipeTransform } from '@nestjs/common';

import { RPCErrorCode } from '../rpc/jsonrpc';
import { RpcError } from '../rpc/rpc-error';

/**
 * 路径参数 ID 解析管道
 *
 * 用于将字符串形式的 id 转换为 number，
 * 并校验其为大于 0 的整数，失败时抛出 ValidationError。
 */
@Injectable()
export class ParseIdPipe implements PipeTransform {
  constructor(private readonly paramName: string = 'id') {}

  transform(value: any): number {
    const id = typeof value === 'string' ? Number(value) : value;

    if (!Number.isInteger(id) || id <= 0) {
      throw new RpcError(null, RPCErrorCode.InvalidParams, 'Invalid params', {
        [this.paramName]: `${this.paramName} 必须是大于0的数字`,
      });
    }

    return id;
  }
}
