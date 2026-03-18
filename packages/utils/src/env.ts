// 从环境变量中获取必须存在的变量，不存在则抛出错误
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// 从环境变量中获取必须存在的整数变量，不存在或不是整数则抛出错误
export function requireIntEnv(name: string): number {
  const raw = requireEnv(name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid environment variable: ${name}=${raw}`);
  }
  return value;
}

// 获取给前端使用的环境变量
export function getFrontendEnv(_mode?: string): Record<string, string> {
  const filtered: Record<string, string> = {};
  const allowedPrefix = 'CSISP_';

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(allowedPrefix)) {
      filtered[key] = value as string;
    }
  }

  return filtered;
}
