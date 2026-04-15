import { Module } from '@nestjs/common';

import { CommonAuthController } from './auth.controller';

@Module({
  controllers: [CommonAuthController],
})
export class CommonAuthModule {}
