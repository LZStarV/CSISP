import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

// eslint-disable-next-line no-restricted-imports
import {
  Announcement,
  type AnnouncementDocument,
  type AnnouncementInsert,
  type AnnouncementUpdate,
} from '../../types';

import { BaseMongoRepository } from './base.mongo.repository';

export class MongoAnnouncementRepository extends BaseMongoRepository<
  Announcement,
  AnnouncementDocument,
  AnnouncementInsert,
  AnnouncementUpdate
> {
  constructor(
    @InjectModel(Announcement)
    model: ReturnModelType<typeof Announcement>
  ) {
    super(model);
  }

  /**
   * 分页获取已发布的公告列表
   */
  async findPaginated(
    page: number,
    pageSize: number
  ): Promise<{ data: AnnouncementDocument[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.model
        .find({ isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments({ isPublished: true }).exec(),
    ]);
    return { data, total };
  }
}
