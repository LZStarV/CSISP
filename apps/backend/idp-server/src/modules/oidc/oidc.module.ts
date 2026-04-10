import { Module } from '@nestjs/common';

import { OidcApiImpl } from './oidc-api.impl';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';

@Module({
  controllers: [OidcController],
  providers: [OidcService, OidcApiImpl],
})
export class OidcModule {}
