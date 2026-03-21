import { Module } from '@nestjs/common';

import { AdminDemoController } from './demo.controller';

@Module({
  controllers: [AdminDemoController],
})
export class AdminDemoModule {}
