import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export class ZodValidationPipe<TValidated> implements PipeTransform<
  unknown,
  TValidated
> {
  constructor(private readonly schema: ZodSchema<TValidated>) {}

  transform(value: unknown): TValidated {
    const parseResult = this.schema.safeParse(value);
    if (parseResult.success) {
      return parseResult.data;
    }

    throw new BadRequestException({
      message: 'Validation failed',
      errors: parseResult.error.issues,
    });
  }
}
