import { ApiIdpController } from '@common/decorators/controller.decorator';
import { RequestBodyPipe } from '@common/http/request-body.pipe';
import { Body, Post } from '@nestjs/common';

import { GetAuthorizationRequestDto } from './dto/get-authorization-request.dto';
import { OidcService } from './oidc.service';

@ApiIdpController('oidc')
export class OidcController {
  constructor(private readonly oidcService: OidcService) {}

  @Post('clients')
  async clients() {
    return this.oidcService.listClients();
  }

  @Post('getAuthorizationRequest')
  async getAuthorizationRequest(
    @Body(RequestBodyPipe) dto: GetAuthorizationRequestDto
  ) {
    return this.oidcService.getAuthorizationRequest(dto);
  }
}
