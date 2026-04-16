import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  GetAuthorizationRequestParams,
  COMMON_OIDC_ACTION,
  COMMON_OIDC_PATH_PREFIX,
  COMMON_PATH_PREFIX,
  getAuthorizationRequestBodySchema,
} from '@csisp/contracts';
import { OidcService } from '@csisp-api/bff-idp-server';
import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';

const IDP_OIDC_CONTROLLER_PREFIX = `${COMMON_PATH_PREFIX}${COMMON_OIDC_PATH_PREFIX}`;

@Controller(IDP_OIDC_CONTROLLER_PREFIX)
export class IdpOidcController {
  private readonly logger = getBffLogger('idp-oidc');

  constructor(private readonly oidcService: OidcService) {}

  @Post(COMMON_OIDC_ACTION.CLIENTS)
  async clients() {
    this.logger.info(
      { action: COMMON_OIDC_ACTION.CLIENTS },
      'IDP OIDC proxy request'
    );
    return firstValueFrom(
      this.oidcService.oidcClients({}).pipe(map(res => res.data))
    );
  }

  @Post(COMMON_OIDC_ACTION.GET_AUTHORIZATION_REQUEST)
  async getAuthorizationRequest(
    @Body(new ZodValidationPipe(getAuthorizationRequestBodySchema))
    getAuthorizationRequestParams: GetAuthorizationRequestParams
  ) {
    this.logger.info(
      { action: COMMON_OIDC_ACTION.GET_AUTHORIZATION_REQUEST },
      'IDP OIDC proxy request'
    );
    return firstValueFrom(
      this.oidcService
        .oidcGetAuthorizationRequest({
          GetAuthorizationRequestParams: getAuthorizationRequestParams,
        })
        .pipe(map(res => res.data))
    );
  }
}
