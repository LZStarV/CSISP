import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DtoValidationInterceptor implements NestInterceptor {
  private validationPipe: ValidationPipe;

  constructor() {
    this.validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    if (request.body) {
      request.body = await this.validationPipe.transform(
        request.body,
        context.getArgByIndex(0)
      );
    }
    return next.handle();
  }
}
