import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

// eslint-disable-next-line no-restricted-imports
import {
  Demo,
  type DemoDocument,
  type DemoInsert,
  type DemoUpdate,
} from '../../types';

import { BaseMongoRepository } from './base.mongo.repository';

export class MongoDemoRepository extends BaseMongoRepository<
  Demo,
  DemoDocument,
  DemoInsert,
  DemoUpdate
> {
  constructor(
    @InjectModel(Demo)
    model: ReturnModelType<typeof Demo>
  ) {
    super(model);
  }
}
