import { ApiIdpController } from '@common/decorators/controller.decorator';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { SupabaseDataAccess } from '@infra/supabase';
import { Body, Post } from '@nestjs/common';

import { OidcService } from './oidc.service';

/**
 * OidcController 重构：采用声明式路由与拦截器模式
 */
@ApiIdpController('oidc')
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
  async getAuthorizationRequest(@Body(RequestBodyPipe) params: any) {
    return this.svc.getAuthorizationRequest(String(params.ticket ?? ''));
  }
}
