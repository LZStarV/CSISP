import { Global, Module } from '@nestjs/common';

import { TrustedOriginsService } from './trusted-origins.service';

@Global()
@Module({
  providers: [TrustedOriginsService],
  exports: [TrustedOriginsService],
})
export class CorsModule {}
