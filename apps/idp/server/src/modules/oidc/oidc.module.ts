import { Module } from '@nestjs/common';

import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { OidcThriftController } from './oidc.thrift.controller';

@Module({
  controllers: [OidcController, OidcThriftController],
  providers: [OidcService],
})
export class OidcModule {}
