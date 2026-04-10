import {
  type ClientInfo,
  type AuthorizationRequestInfo,
  OidcApi,
  type OidcClientsRequestParams,
  type OidcGetAuthorizationRequestRequestParams,
} from '@csisp-api/idp-server';
import { Injectable } from '@nestjs/common';

import { OidcService } from './oidc.service';

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
