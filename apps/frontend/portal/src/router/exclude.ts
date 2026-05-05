export type ExcludedRoute = string;

// 排除的路由
export const EXCLUDED_ROUTES: ExcludedRoute[] = [
  '/Error',
  '/Callback',
] as const;
