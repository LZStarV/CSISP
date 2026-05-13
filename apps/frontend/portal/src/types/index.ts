export type SupportedLocale = 'zh' | 'en';

export interface LocaleOption {
  value: SupportedLocale;
  label: string;
}

export type SupportedTheme = 'light' | 'dark';

export interface ThemeOption {
  value: SupportedTheme;
  label: string;
}
