import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

// eslint-disable-next-line no-restricted-imports
import {
  Post,
  type PostDocument,
  type PostInsert,
  type PostUpdate,
} from '../../types';

import { BaseMongoRepository } from './base.mongo.repository';

export class MongoPostRepository extends BaseMongoRepository<
  Post,
  PostDocument,
  PostInsert,
  PostUpdate
> {
  constructor(
    @InjectModel(Post)
    model: ReturnModelType<typeof Post>
  ) {
    super(model);
  }

  /**
   * 分页获取帖子列表
   */
  async findPaginated(
    page: number,
    pageSize: number
  ): Promise<{ data: PostDocument[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments().exec(),
    ]);
    return { data, total };
  }
}
