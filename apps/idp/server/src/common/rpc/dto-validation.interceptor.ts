import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Observable } from 'rxjs';

const RPC_DTO_MAP = 'rpc:dto-map';

// 定义 RPC 方法的 DTO 映射
export function UseRpcDtoValidation(map: Record<string, new () => any>) {
  return function (target: any) {
    Reflect.defineMetadata(RPC_DTO_MAP, map, target);
  };
}

// RPC 方法参数校验拦截器
@Injectable()
export class RpcDtoValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerName = context.getHandler().name;
    const ctor = context.getClass();
    const dtoMap: Record<string, new () => any> =
      Reflect.getMetadata(RPC_DTO_MAP, ctor) || {};
    const DtoCls = dtoMap[handlerName];
    if (!DtoCls) {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<any>();
    const params = (req?.body?.params ?? {}) as Record<string, any>;
    const dto = plainToInstance(DtoCls, params);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) {
      throw new BadRequestException('Invalid params');
    }
    // 将校验后的对象传递下去，避免控制器重复转换
    req.body.params = dto;
    return next.handle();
  }
}
