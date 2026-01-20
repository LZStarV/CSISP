import { Injectable, PipeTransform } from '@nestjs/common';
import { RpcError } from '../rpc/rpc-error';
import { RPCErrorCode } from '../rpc/jsonrpc';

/**
 * 分页参数解析与校验管道
 *
 * 将 query 中的 page/size 转换为 PaginationParams，
 * 并校验取值范围，失败时抛出 ValidationError。
 */
@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any): any {
    const query = value ?? {};
    const errors: Record<string, string> = {};

    // page
    if (query.page !== undefined) {
      const page = Number(query.page);
      if (!Number.isInteger(page) || page < 1) {
        errors.page = 'page 必须是大于0的数字';
      } else {
        query.page = page;
      }
    } else {
      query.page = 1;
    }

    // size
    if (query.size !== undefined) {
      const size = Number(query.size);
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        errors.size = 'size 必须是1-100之间的数字';
      } else {
        query.size = size;
      }
    } else {
      query.size = 10;
    }

    if (Object.keys(errors).length > 0) {
      throw new RpcError(null, RPCErrorCode.InvalidParams, 'Invalid params', errors);
    }

    return { page: query.page, size: query.size };
  }
}
