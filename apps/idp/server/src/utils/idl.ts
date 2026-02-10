// 解析枚举值，支持字符串和数字
export function parseEnum<T extends number>(
  val: unknown,
  enumObj: any,
  fallback: T
): T {
  if (typeof val === 'string' && val in enumObj) {
    return (enumObj as any)[val] as T;
  }
  if (typeof val === 'number') {
    return val as T;
  }
  return fallback;
}
