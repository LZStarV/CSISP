import { ApiIdpController } from '@common/decorators/controller.decorator';
import { JsonRpcInterceptor } from '@common/rpc/json-rpc.interceptor';
import { RpcRequestPipe } from '@common/rpc/rpc-request.pipe';
import { SupabaseDataAccess } from '@infra/supabase';
import { Body, Post, UseInterceptors } from '@nestjs/common';

import { OidcService } from './oidc.service';

/**
 * OidcController 重构：采用声明式路由与拦截器模式
 * - 利用 JsonRpcInterceptor 自动包装响应体
 */
@ApiIdpController('oidc')
@UseInterceptors(JsonRpcInterceptor)
export class OidcController {
  constructor(
    private readonly svc: OidcService,
    private readonly sda: SupabaseDataAccess
  ) {}

  @Post('clients')
  async clients() {
    return this.svc.listClients();
  }

  @Post('getAuthorizationRequest')
  async getAuthorizationRequest(@Body(RpcRequestPipe) { params }: any) {
    return this.svc.getAuthorizationRequest(String(params.ticket ?? ''));
  }
}
