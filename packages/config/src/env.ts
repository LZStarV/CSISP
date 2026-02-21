import { z, type ZodTypeAny } from 'zod';

// 环境变量错误类，用于表示环境变量解析失败的异常
export class EnvError extends Error {
  readonly issues: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    issues: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'EnvError';
    this.issues = issues;
  }
}

// 从环境变量中解析配置，若失败则抛出 EnvError 异常
export function parseEnv<TSchema extends ZodTypeAny>(
  schema: TSchema,
  env: Record<string, unknown>,
  opts?: { label?: string }
): z.infer<TSchema> {
  const parsed = schema.safeParse(env);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues.map(i => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  const label = opts?.label ? ` (${opts.label})` : '';
  throw new EnvError(`Invalid environment${label}`, issues);
}

// 环境变量解析器，返回字符串类型
export function envString() {
  return z.string().min(1);
}

// 环境变量解析器，返回可选字符串类型
export function envOptionalString() {
  return z.string().optional();
}

// 环境变量解析器，返回 URL 字符串类型
export function envUrlString() {
  return z.string().url();
}

// 环境变量解析器，返回整数类型
export function envIntString() {
  return z.coerce.number().int().positive();
}

// 环境变量解析器，返回非负整数类型
export function envNonNegativeIntString() {
  return z.coerce.number().int().nonnegative();
}

// 环境变量解析器，返回布尔类型
export function envBoolString() {
  return z.coerce.boolean();
}
