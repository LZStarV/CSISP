import { Module } from '@nestjs/common';

import { OidcController, OidcWellKnownController } from './oidc.controller';
import { OidcService } from './oidc.service';

@Module({
  controllers: [OidcController, OidcWellKnownController],
  providers: [OidcService],
})
export class OidcModule {}
