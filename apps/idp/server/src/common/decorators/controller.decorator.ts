import { RpcProtocol, RPC_PROTOCOL_KEY } from '@csisp/rpc/constants';
import { RpcExceptionFilter } from '@csisp/rpc/server-nest';
import {
  applyDecorators,
  Controller,
  SetMetadata,
  UseFilters,
} from '@nestjs/common';

/**
 * IDP JSON-RPC 控制器装饰器
 * 统一前缀：/api/idp
 * 注入协议元数据：JSON_RPC
 * 绑定组件：JSON-RPC 专用异常过滤器与请求解析 Pipe
 */
export function ApiIdpController(path: string) {
  const prefix = '/api/idp';
  const fullPath = path ? `${prefix}/${path.replace(/^\/+/, '')}` : prefix;
  return applyDecorators(
    Controller(fullPath),
    SetMetadata(RPC_PROTOCOL_KEY, RpcProtocol.JSON_RPC),
    UseFilters(RpcExceptionFilter)
  );
}

/**
 * IDP Thrift RPC 控制器装饰器
 * 统一前缀：/thrift/idp
 * 注入协议元数据：THRIFT
 */
export function ThriftIdpController(path: string) {
  const prefix = '/thrift/idp';
  const fullPath = path ? `${prefix}/${path.replace(/^\/+/, '')}` : prefix;
  return applyDecorators(
    Controller(fullPath),
    SetMetadata(RPC_PROTOCOL_KEY, RpcProtocol.THRIFT)
  );
}
