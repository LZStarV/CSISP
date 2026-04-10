import { ApiIdpController } from '@common/decorators/controller.decorator';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { Body, Post, Req } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { OidcApiImpl } from './oidc-api.impl';

/**
 * OidcController 重构：采用声明式路由与拦截器模式
 */
@ApiIdpController('oidc')
export class OidcController {
  constructor(private readonly oidcApi: OidcApiImpl) {}

  private getTraceId(request: ExpressRequest): string | undefined {
    const traceIdHeader = request.headers['x-trace-id'];
    return typeof traceIdHeader === 'string' ? traceIdHeader : undefined;
  }

  private toContractRequest(request: ExpressRequest): Request {
    return request as unknown as Request;
  }

  @Post('clients')
  async clients(@Req() request: ExpressRequest) {
    return this.oidcApi.oidcClients(
      { xTraceId: this.getTraceId(request) },
      this.toContractRequest(request)
    );
  }

  @Post('getAuthorizationRequest')
  async getAuthorizationRequest(
    @Body(RequestBodyPipe) params: any,
    @Req() request: ExpressRequest
  ) {
    return this.oidcApi.oidcGetAuthorizationRequest(
      {
        getAuthorizationRequestParams: { ticket: String(params.ticket ?? '') },
        xTraceId: this.getTraceId(request),
      },
      this.toContractRequest(request)
    );
  }
}
