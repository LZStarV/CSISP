import type { LocaleOption } from '@/types';

export const APP_NAME = 'csisp-portal' as const;

export const DEFAULT_LOCALE = 'zh' as const;

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];
