// 标准化路由前缀，确保以斜杠开头且无末尾斜杠
export function normalizePrefix(prefix: string): string {
  const raw = String(prefix || '').trim();
  if (!raw) return '/';
  if (raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, '');
}

// 标准化 URL 基础路径，移除末尾斜杠
export function normalizeBaseUrl(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return raw;
  return raw.replace(/\/+$/, '');
}

// 拼接 URL 路径，自动处理斜杠
export function joinUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const p = String(path || '').trim();
  if (!base) return p;
  if (!p) return base;
  if (p === '/') return base;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
}
