import {
  GetAuthorizationRequestParams,
  OidcService,
} from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

@Controller('idp/oidc')
export class IdpOidcController {
  constructor(private readonly oidcService: OidcService) {}

  @Post('clients')
  async clients() {
    return firstValueFrom(
      this.oidcService.oidcClients({}).pipe(map(res => res.data))
    );
  }

  @Post('getAuthorizationRequest')
  async getAuthorizationRequest(
    @Body() getAuthorizationRequestParams: GetAuthorizationRequestParams
  ) {
    return firstValueFrom(
      this.oidcService
        .oidcGetAuthorizationRequest({
          GetAuthorizationRequestParams: getAuthorizationRequestParams,
        })
        .pipe(map(res => res.data))
    );
  }
}
