import { Module } from '@nestjs/common';

import { IdpOidcController } from './oidc.controller';

@Module({
  controllers: [IdpOidcController],
})
export class IdpOidcModule {}
