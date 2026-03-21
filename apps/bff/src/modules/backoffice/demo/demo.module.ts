import { Module } from '@nestjs/common';

import { BackofficeDemoController } from './demo.controller';

@Module({
  controllers: [BackofficeDemoController],
})
export class BackofficeDemoModule {}
