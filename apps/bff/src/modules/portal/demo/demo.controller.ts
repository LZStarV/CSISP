import { PortalController } from '@common/decorators/subproject.controller';
import { Body, Param, Post } from '@nestjs/common';

import { DemoService } from './demo.service';

interface JsonRpcRequest<T = unknown> {
  jsonrpc?: string;
  id?: string | number | null;
  params?: T;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  result: T;
}

@PortalController('demo')
export class DemoController {
  constructor(private readonly svc: DemoService) {}

  @Post(':action')
  handle<T = any>(
    @Param('action') action: string,
    @Body() body: JsonRpcRequest<T>
  ): JsonRpcResponse<{ action: string; echo: T | undefined }> {
    const id = body?.id ?? null;
    const params = body?.params;
    const echo = this.svc.echo(params);
    return {
      jsonrpc: '2.0',
      id,
      result: { action, echo },
    };
  }
}
