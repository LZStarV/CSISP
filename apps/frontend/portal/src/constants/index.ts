import type { LocaleOption, ThemeOption } from '@/types';

export const APP_NAME = 'csisp-portal' as const;

export const DEFAULT_LOCALE = 'zh' as const;

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

export const DEFAULT_THEME = 'light' as const;

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];
