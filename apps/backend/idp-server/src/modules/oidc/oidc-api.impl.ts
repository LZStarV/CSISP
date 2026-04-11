import {
  type ClientInfo,
  type AuthorizationRequestInfo,
  OidcApi,
  type OidcClientsRequestParams,
  type OidcGetAuthorizationRequestRequestParams,
} from '@csisp-api/idp-server';
import { Injectable } from '@nestjs/common';

import { OidcService } from './oidc.service';

/**
 * OidcApi 契约实现（适配器层）
 *
 * 作用：
 * 1. 实现 @csisp-api/idp-server 生成的 OidcApi 抽象类，对接底层 OidcService 业务逻辑。
 * 2. 隔离 Controller 和 Service，处理自动生成的参数包裹对象到具体业务参数的映射。
 * 3. （如需）支持 Request 类型桥接还原，以便安全地访问 NestJS 实际注入的 ExpressRequest 特有属性。
 */
@Injectable()
export class OidcApiImpl implements OidcApi {
  constructor(private readonly service: OidcService) {}

  async oidcClients(
    _requestParams: OidcClientsRequestParams,
    _request: Request
  ): Promise<Array<ClientInfo>> {
    return this.service.listClients();
  }

  async oidcGetAuthorizationRequest(
    requestParams: OidcGetAuthorizationRequestRequestParams,
    _request: Request
  ): Promise<AuthorizationRequestInfo> {
    const ticket = requestParams.getAuthorizationRequestParams.ticket;
    return this.service.getAuthorizationRequest(ticket);
  }
}
