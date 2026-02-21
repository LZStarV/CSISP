import type { RPCRequest, RPCResponse } from '@common/rpc/jsonrpc';
import { ok } from '@common/rpc/jsonrpc';
import { RpcExceptionFilter } from '@common/rpc/rpc-exception.filter';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import { Body, Controller, Post, UseFilters } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
@UseFilters(RpcExceptionFilter)
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Post('ping')
  ping(
    @Body(new RpcRequestPipe()) req: RPCRequest
  ): RPCResponse<{ ok: boolean; ts: number }> {
    const result = this.service.ping();
    return ok(req.id, result);
  }
}
