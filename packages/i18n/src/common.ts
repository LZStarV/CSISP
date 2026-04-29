import enCommon from './locales/common/en/index.json';
import zhCommon from './locales/common/zh/index.json';

export const commonLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type CommonLocales = typeof commonLocales;
