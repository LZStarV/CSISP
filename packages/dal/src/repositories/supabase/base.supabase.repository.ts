import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { createLogger } from '@csisp/utils';
import { Injectable } from '@nestjs/common';

import type { IQueryableRepository, IQueryOptions } from '../base';

const baseLogger = createLogger('dal');

/**
 * Supabase Repository 基类 - 封装通用的 Supabase 操作
 */
@Injectable()
export abstract class BaseSupabaseRepository<
  T,
  TId,
  TInsert = Partial<T>,
  TUpdate = Partial<T>,
> implements IQueryableRepository<T, TId, TInsert, TUpdate> {
  protected readonly logger: any;

  constructor(
    protected readonly sda: SupabaseDataAccess,
    protected readonly tableName: string,
    protected readonly idField: string = 'id'
  ) {
    this.logger = baseLogger.child({ repository: this.constructor.name });
  }

  /**
   * 根据 ID 查询
   */
  async findById(id: TId): Promise<T | null> {
    const startTime = Date.now();
    try {
      const result = await this.sda
        .service()
        .from(this.tableName)
        .select('*')
        .eq(this.idField, id)
        .maybeSingle();

      this.logger.debug(
        {
          table: this.tableName,
          method: 'findById',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return result.data as T | null;
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'findById', error },
        'Query failed'
      );
      throw error;
    }
  }

  /**
   * 查询所有
   */
  async findAll(): Promise<T[]> {
    const startTime = Date.now();
    try {
      const result = await this.sda.service().from(this.tableName).select('*');

      this.logger.debug(
        {
          table: this.tableName,
          method: 'findAll',
          duration: Date.now() - startTime,
        },
        'Query executed'
      );
      return (result.data as T[]) || [];
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'findAll', error },
        'Query failed'
      );
      throw error;
    }
  }

  /**
   * 创建
   */
  async create(data: TInsert): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.sda
        .service()
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (result.error) throw result.error;

      this.logger.debug(
        {
          table: this.tableName,
          method: 'create',
          duration: Date.now() - startTime,
        },
        'Insert executed'
      );
      return result.data as T;
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'create', error },
        'Insert failed'
      );
      throw error;
    }
  }

  /**
   * 更新
   */
  async update(id: TId, data: TUpdate): Promise<T | null> {
    const startTime = Date.now();
    try {
      const result = await this.sda
        .service()
        .from(this.tableName)
        .update(data)
        .eq(this.idField, id)
        .select()
        .single();

      if (result.error) throw result.error;

      this.logger.debug(
        {
          table: this.tableName,
          method: 'update',
          duration: Date.now() - startTime,
        },
        'Update executed'
      );
      return result.data as T | null;
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'update', error },
        'Update failed'
      );
      throw error;
    }
  }

  /**
   * 删除
   */
  async delete(id: TId): Promise<void> {
    const startTime = Date.now();
    try {
      const result = await this.sda
        .service()
        .from(this.tableName)
        .delete()
        .eq(this.idField, id);

      if (result.error) throw result.error;

      this.logger.debug(
        {
          table: this.tableName,
          method: 'delete',
          duration: Date.now() - startTime,
        },
        'Delete executed'
      );
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'delete', error },
        'Delete failed'
      );
      throw error;
    }
  }

  /**
   * 根据条件查询多个
   */
  async findMany(options?: IQueryOptions): Promise<T[]> {
    const startTime = Date.now();
    try {
      const query = this.buildQuery(options);
      const result = await query;

      this.logger.debug(
        {
          table: this.tableName,
          method: 'findMany',
          duration: Date.now() - startTime,
          options,
        },
        'Query executed'
      );
      return (result.data as T[]) || [];
    } catch (error) {
      this.logger.error(
        { table: this.tableName, method: 'findMany', error, options },
        'Query failed'
      );
      throw error;
    }
  }

  /**
   * 构建查询
   */
  protected buildQuery(options?: IQueryOptions): any {
    let query: any = this.sda.service().from(this.tableName);

    // 选择字段
    if (options?.select?.length) {
      query = query.select(options.select.join(','));
    } else {
      query = query.select('*');
    }

    // 过滤条件
    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value);
      }
    }

    // 排序
    if (options?.sort?.length) {
      for (const sort of options.sort) {
        query = query.order(sort.field, { ascending: sort.order === 'asc' });
      }
    }

    // 分页
    if (options?.pagination) {
      const { offset = 0, limit = 50 } = options.pagination;
      query = query.range(offset, offset + limit - 1);
    }

    return query;
  }

  /**
   * 根据条件查询单个
   */
  async findOne(filter: Record<string, any>): Promise<T | null> {
    const results = await this.findMany({
      filter,
      pagination: { offset: 0, limit: 1 },
    });
    return results[0] || null;
  }

  /**
   * 计数
   */
  async count(filter?: Record<string, any>): Promise<number> {
    const results = await this.findMany({ filter });
    return results.length;
  }
}
