import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import { Demo } from '../../types';

import { MongoDemoRepository } from './demo.repository';

@Module({
  imports: [TypegooseModule.forFeature([Demo])],
  providers: [MongoDemoRepository],
  exports: [MongoDemoRepository],
})
export class MongoDalModule {}
