import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type RpcBody = {
  jsonrpc?: string;
  id?: string | number | null;
  params?: Record<string, any>;
};

@Injectable()
export class RpcRequestPipe implements PipeTransform {
  transform(value: RpcBody) {
    if (!value || value.jsonrpc !== '2.0') {
      throw new BadRequestException('Invalid JSON-RPC version');
    }
    const id = value.id ?? null;
    const params = value.params ?? {};
    return { id, params };
  }
}
