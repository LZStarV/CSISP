import { RestExceptionFilter } from '@common/filters/rest-exception.filter';
import { applyDecorators, Controller, UseFilters } from '@nestjs/common';

/**
 * IDP REST 控制器装饰器
 * 统一前缀：/api/idp
 */
export function ApiIdpController(path: string) {
  const prefix = '/api/idp';
  const fullPath = path ? `${prefix}/${path.replace(/^\/+/, '')}` : prefix;
  return applyDecorators(Controller(fullPath), UseFilters(RestExceptionFilter));
}
