import {
  CommonApiException,
  CommonErrorCode,
} from '@common/errors/common-error-codes';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Observable } from 'rxjs';

const DTO_MAP = 'http:dto-map';

export function UseDtoValidation(map: Record<string, new () => any>) {
  return function (target: any) {
    Reflect.defineMetadata(DTO_MAP, map, target);
  };
}

@Injectable()
export class DtoValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerName = context.getHandler().name;
    const ctor = context.getClass();
    const dtoMap: Record<string, new () => any> =
      Reflect.getMetadata(DTO_MAP, ctor) || {};
    const DtoCls = dtoMap[handlerName];
    if (!DtoCls) {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<any>();
    const body = (req?.body ?? {}) as Record<string, any>;
    const dto = plainToInstance(DtoCls, body);
    const errs = validateSync(dto, { whitelist: true });
    if (errs.length) {
      throw new CommonApiException(
        CommonErrorCode.BadRequest,
        'Invalid params',
        HttpStatus.BAD_REQUEST
      );
    }
    req.body = dto;
    return next.handle();
  }
}
