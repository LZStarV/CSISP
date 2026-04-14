import { Module } from '@nestjs/common';

import { IdpAuthController } from './auth.controller';

@Module({
  controllers: [IdpAuthController],
})
export class IdpAuthModule {}
