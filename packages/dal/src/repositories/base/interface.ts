// eslint-disable-next-line no-restricted-imports
import type { IQueryOptions } from '../../types';

export type { IQueryOptions };

/**
 * 基础 Repository 接口 - 定义所有 Repository 必须实现的方法
 */
export interface IBaseRepository<
  T,
  TId,
  TInsert = Partial<T>,
  TUpdate = Partial<T>,
> {
  /**
   * 根据 ID 查询单个实体
   */
  findById(id: TId): Promise<T | null>;

  /**
   * 查询所有实体
   */
  findAll(): Promise<T[]>;

  /**
   * 创建实体
   */
  create(data: TInsert): Promise<T>;

  /**
   * 更新实体
   */
  update(id: TId, data: TUpdate): Promise<T | null>;

  /**
   * 删除实体
   */
  delete(id: TId): Promise<void>;
}

/**
 * 支持高级查询的 Repository 接口
 */
export interface IQueryableRepository<
  T,
  TId,
  TInsert = Partial<T>,
  TUpdate = Partial<T>,
> extends IBaseRepository<T, TId, TInsert, TUpdate> {
  /**
   * 根据条件查询多个
   */
  findMany(options?: IQueryOptions): Promise<T[]>;

  /**
   * 根据条件查询单个
   */
  findOne(filter: Record<string, any>): Promise<T | null>;

  /**
   * 计数
   */
  count(filter?: Record<string, any>): Promise<number>;
}
