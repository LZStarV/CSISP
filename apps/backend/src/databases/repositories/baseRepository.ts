import type { Model, ModelStatic } from 'sequelize';
import type { PaginationParams, PaginationResponse } from '@csisp/types';

/**
 * 通用仓库模板，提供类型安全的基础 CRUD 操作
 * @template M 模型实例类型
 * @template A 模型属性类型
 * @template C 创建属性类型
 */
export class BaseRepository<M extends Model<any, any>, A, C> {
  private model: ModelStatic<M>;

  /**
   * @param model Sequelize ModelStatic
   */
  constructor(model: ModelStatic<M>) {
    this.model = model;
  }

  /**
   * 创建记录
   * @param data 创建数据
   * @returns 创建后的模型实例
   */
  async create(data: C): Promise<M> {
    const record = await this.model.create(data as any);
    return record;
  }

  /**
   * 根据主键查询
   * @param id 主键ID
   * @returns 查询到的模型实例或 null
   */
  async findById(id: number): Promise<M | null> {
    return await this.model.findByPk(id);
  }

  /**
   * 更新记录
   * @param id 主键ID
   * @param data 更新数据（部分字段）
   * @returns 更新后的模型实例或 null（不存在时）
   */
  async update(id: number, data: Partial<A>): Promise<M | null> {
    const [count, rows] = await this.model.update(data as any, {
      where: { id } as any,
      returning: true as any,
    });
    if (count === 0) return null;
    return rows[0] as M;
  }

  /**
   * 删除记录
   * @param id 主键ID
   * @returns 是否删除成功
   */
  async delete(id: number): Promise<boolean> {
    const count = await this.model.destroy({ where: { id } as any });
    return count > 0;
  }

  /**
   * 查询所有记录
   * @param where 查询条件
   * @returns 模型实例列表
   */
  async findAll(where?: any): Promise<M[]> {
    return await this.model.findAll({ where, order: [['created_at', 'DESC'] as any] as any });
  }

  /**
   * 分页查询
   * @param params 分页参数
   * @param where 查询条件
   * @returns 分页响应数据
   */
  async findAllWithPagination(
    params: PaginationParams,
    where?: any
  ): Promise<PaginationResponse<M>> {
    const { page, size } = params;
    const offset = (page - 1) * size;
    const { count, rows } = await (this.model as any).findAndCountAll({
      where,
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });
    const totalPages = Math.ceil(count / size);
    return {
      data: rows as M[],
      total: count,
      page,
      size,
      totalPages,
    };
  }
}
