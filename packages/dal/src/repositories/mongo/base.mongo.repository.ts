import { createLogger } from '@csisp/utils';
import { ReturnModelType } from '@typegoose/typegoose';

import type { IQueryableRepository, IQueryOptions } from '../base';

const baseLogger = createLogger('dal');

/**
 * MongoDB Repository 基类 - 封装通用的 MongoDB 操作
 */
export abstract class BaseMongoRepository<
  T,
  TDocument,
  TInsert = Partial<T>,
  TUpdate = Partial<T>,
> implements IQueryableRepository<TDocument, string | any, TInsert, TUpdate> {
  protected readonly logger: any;

  constructor(protected readonly model: ReturnModelType<any>) {
    this.logger = baseLogger.child({ repository: this.constructor.name });
  }

  async findById(id: string | any): Promise<TDocument | null> {
    const startTime = Date.now();
    try {
      const result = await this.model.findById(id).exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'findById',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return result as TDocument | null;
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'findById', error },
        'Query failed'
      );
      throw error;
    }
  }

  async findAll(): Promise<TDocument[]> {
    const startTime = Date.now();
    try {
      const results = await this.model.find().exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'findAll',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return results as TDocument[];
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'findAll', error },
        'Query failed'
      );
      throw error;
    }
  }

  async create(data: TInsert): Promise<TDocument> {
    const startTime = Date.now();
    try {
      const doc = new this.model(data);
      const result = await doc.save();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'create',
          duration: Date.now() - startTime,
        },
        'Insert executed'
      );
      return result as TDocument;
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'create', error },
        'Insert failed'
      );
      throw error;
    }
  }

  async update(id: string | any, data: TUpdate): Promise<TDocument | null> {
    const startTime = Date.now();
    try {
      const result = await this.model
        .findByIdAndUpdate(id, data, { new: true })
        .exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'update',
          duration: Date.now() - startTime,
        },
        'Update executed'
      );
      return result as TDocument | null;
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'update', error },
        'Update failed'
      );
      throw error;
    }
  }

  async delete(id: string | any): Promise<void> {
    const startTime = Date.now();
    try {
      await this.model.findByIdAndDelete(id).exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'delete',
          duration: Date.now() - startTime,
        },
        'Delete executed'
      );
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'delete', error },
        'Delete failed'
      );
      throw error;
    }
  }

  async findMany(options?: IQueryOptions): Promise<TDocument[]> {
    const startTime = Date.now();
    try {
      let query = this.model.find(options?.filter || {});

      // 排序
      if (options?.sort?.length) {
        const sortObj: Record<string, 1 | -1> = {};
        for (const sort of options.sort) {
          sortObj[sort.field] = sort.order === 'asc' ? 1 : -1;
        }
        query = query.sort(sortObj);
      }

      // 分页
      if (options?.pagination) {
        query = query
          .skip(options.pagination.offset || 0)
          .limit(options.pagination.limit || 50);
      }

      // 选择字段
      if (options?.select?.length) {
        query = query.select(options.select.join(' '));
      }

      const results = await query.exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'findMany',
          duration: Date.now() - startTime,
          options,
        },
        'Query executed'
      );
      return results as TDocument[];
    } catch (error) {
      this.logger.error(
        {
          collection: this.model.collection.name,
          method: 'findMany',
          error,
          options,
        },
        'Query failed'
      );
      throw error;
    }
  }

  async findOne(filter: Record<string, any>): Promise<TDocument | null> {
    const startTime = Date.now();
    try {
      const result = await this.model.findOne(filter).exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'findOne',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return result as TDocument | null;
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'findOne', error },
        'Query failed'
      );
      throw error;
    }
  }

  async count(filter?: Record<string, any>): Promise<number> {
    const startTime = Date.now();
    try {
      const count = await this.model.countDocuments(filter || {}).exec();
      this.logger.debug(
        {
          collection: this.model.collection.name,
          method: 'count',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return count;
    } catch (error) {
      this.logger.error(
        { collection: this.model.collection.name, method: 'count', error },
        'Query failed'
      );
      throw error;
    }
  }
}
