import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Zod 验证管道
 * @template TValidated - 验证后的数据类型
 * @param schema - Zod 验证模式
 * @returns 验证后的数据
 * @throws BadRequestException - 验证失败时抛出
 */
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
