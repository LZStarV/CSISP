import { THEME } from '@/stores/theme';

export type SupportedLocale = 'zh' | 'en';

export interface LocaleOption {
  value: SupportedLocale;
  label: string;
}

export type SupportedTheme = (typeof THEME)[keyof typeof THEME];

export interface ThemeOption {
  value: SupportedTheme;
  label: string;
}
