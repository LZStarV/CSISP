import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  GetAuthorizationRequestParams,
  IDP_OIDC_ACTION,
  IDP_OIDC_PATH_PREFIX,
  IDP_PATH_PREFIX,
  getAuthorizationRequestBodySchema,
} from '@csisp/contracts';
import { OidcService } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const IDP_OIDC_CONTROLLER_PREFIX = `${IDP_PATH_PREFIX}${IDP_OIDC_PATH_PREFIX}`;

@Controller(IDP_OIDC_CONTROLLER_PREFIX)
export class IdpOidcController {
  constructor(private readonly oidcService: OidcService) {}

  @Post(IDP_OIDC_ACTION.CLIENTS)
  async clients() {
    return firstValueFrom(
      this.oidcService.oidcClients({}).pipe(map(res => res.data))
    );
  }

  @Post(IDP_OIDC_ACTION.GET_AUTHORIZATION_REQUEST)
  async getAuthorizationRequest(
    @Body(new ZodValidationPipe(getAuthorizationRequestBodySchema))
    getAuthorizationRequestParams: GetAuthorizationRequestParams
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
