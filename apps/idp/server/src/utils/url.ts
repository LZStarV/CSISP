/**
 * 获取 API 基础 URL
 * 逻辑：优先使用环境变量 IDP_BASE_URL，否则根据 PORT 构造 localhost 地址
 */
export function getApiBaseUrl(): string {
  const port = Number(process.env.PORT ?? 4001);
  const host = process.env.IDP_BASE_URL ?? `http://localhost:${port}`;
  // 统一加上 /api/idp 前缀，保持与现有逻辑一致
  return `${host}/api/idp`;
}
