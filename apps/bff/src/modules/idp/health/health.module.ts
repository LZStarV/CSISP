import { Module } from '@nestjs/common';

import { IdpHealthController } from './health.controller';

@Module({
  controllers: [IdpHealthController],
})
export class IdpHealthModule {}
