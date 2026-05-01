import type { LocaleOption } from '@/types';

export const APP_NAME = 'csisp-idp-client' as const;

export const DEFAULT_LOCALE = 'zh' as const;

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

/**
 * 客户端登录入口配置
 * - 前端仅持有 client_id 列表，点击时请求服务端执行重定向
 */
export const CLIENT_LOGIN_ENDPOINTS: Record<string, string> = {};
