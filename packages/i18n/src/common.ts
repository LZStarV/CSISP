import enCommon from '../locales/common/en/common.json';
import zhCommon from '../locales/common/zh/common.json';

export const commonLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type CommonLocales = typeof commonLocales;
