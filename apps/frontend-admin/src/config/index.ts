export const config = {
  api: {
    prefix: '/api',
    timeoutMs: 10_000,
  },
  routing: {
    baseUrl: (import.meta as any)?.env?.BASE_URL || '/',
  },
};
