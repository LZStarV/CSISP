/** 通用分页参数 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** 统一查询选项 */
export interface IQueryOptions {
  /** 过滤条件 */
  filter?: Record<string, any>;
  /** 排序规则 */
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  /** 分页 */
  pagination?: PaginationParams;
  /** 选择字段 */
  select?: string[];
}
