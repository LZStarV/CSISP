import type { ZodSchema } from 'zod';

export function validateResponse<T>(schema: ZodSchema<T>, data: unknown) {
  try {
    schema.parse(data);
  } catch (e: any) {
    const err = new Error('Response validation failed');
    (err as any).code = -32603;
    (err as any).data = { message: e?.message };
    throw err;
  }
}
