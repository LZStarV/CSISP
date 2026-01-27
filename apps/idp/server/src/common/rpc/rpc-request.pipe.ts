import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { getIdpLogger } from '../../infra/logger';

type RpcBody = {
  jsonrpc?: string;
  id?: string | number | null;
  params?: Record<string, any>;
};

@Injectable()
export class RpcRequestPipe implements PipeTransform {
  transform(value: RpcBody | string | undefined) {
    const logger = getIdpLogger('rpc-request-pipe');
    let v: any = value;
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch {
        logger.warn({ bodyType: typeof value }, 'rpc body JSON parse failed');
        v = undefined;
      }
    }
    const ver = v?.jsonrpc;
    logger.debug(
      { ver, bodySample: v && { id: v.id, hasParams: !!v.params } },
      'rpc body inspected'
    );
    if (ver !== '2.0' && String(ver) !== '2.0') {
      logger.warn({ ver }, 'invalid jsonrpc version');
      throw new BadRequestException('Invalid JSON-RPC version');
    }
    const id = v?.id ?? null;
    const params = v?.params ?? {};
    return { id, params };
  }
}
