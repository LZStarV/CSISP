import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import type { ObjectId } from 'mongoose';

// eslint-disable-next-line no-restricted-imports
import {
  Demo,
  type DemoDocument,
  type DemoInsert,
  type DemoUpdate,
} from '../../types';

export class MongoDemoRepository {
  constructor(
    @InjectModel(Demo)
    private readonly demoModel: ReturnModelType<typeof Demo>
  ) {}

  async findById(id: string | ObjectId): Promise<DemoDocument | null> {
    return this.demoModel.findById(id).exec();
  }

  async findAll(): Promise<DemoDocument[]> {
    return this.demoModel.find().exec();
  }

  async create(data: DemoInsert): Promise<DemoDocument> {
    const demo = new this.demoModel(data);
    return demo.save();
  }

  async update(
    id: string | ObjectId,
    data: DemoUpdate
  ): Promise<DemoDocument | null> {
    return this.demoModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string | ObjectId): Promise<void> {
    await this.demoModel.findByIdAndDelete(id).exec();
  }
}
