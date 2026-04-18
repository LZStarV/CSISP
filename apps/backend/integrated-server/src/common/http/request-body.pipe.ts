import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';

@Injectable()
export class RequestBodyPipe implements PipeTransform {
  private validationPipe: ValidationPipe;

  constructor() {
    this.validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    return this.validationPipe.transform(value, metadata);
  }
}
