import { RestExceptionFilter } from '@common/filters/rest-exception.filter';
import { applyDecorators, Controller, UseFilters } from '@nestjs/common';

/**
 * IDP REST 控制器装饰器
 * 统一前缀：/api/idp
 */
export function ApiIdpController(path: string) {
  const prefix = '/api/idp';
  const fullPath = path ? `${prefix}/${path.replace(/^\/+/, '')}` : prefix;
  return applyDecorators(
    Controller(fullPath),
    // 移除 JSON-RPC 相关元数据和过滤器，使用标准 REST 异常处理
    UseFilters(RestExceptionFilter)
  );
}

/**
 * IDP Thrift RPC 控制器装饰器
 * 统一前缀：/thrift/idp
 */
export function ThriftIdpController(path: string) {
  const prefix = '/thrift/idp';
  const fullPath = path ? `${prefix}/${path.replace(/^\/+/, '')}` : prefix;
  return applyDecorators(
    Controller(fullPath)
    // 保留 Thrift 相关逻辑（如有）
  );
}
