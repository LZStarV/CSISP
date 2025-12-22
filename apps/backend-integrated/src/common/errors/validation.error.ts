/**
 * 参数验证错误
 *
 * 携带字段级 errors 信息，由 HttpExceptionFilter 统一转换为 400 响应。
 */
export class ValidationError extends Error {
  public readonly errors: Record<string, string>;
  public readonly statusCode: number;

  constructor(errors: Record<string, string>) {
    super('参数验证失败');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}
