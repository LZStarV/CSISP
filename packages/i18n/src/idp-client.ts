import enCommon from './locales/idp-client/en/index.json';
import zhCommon from './locales/idp-client/zh/index.json';

export const idpClientLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type IdpClientLocales = typeof idpClientLocales;
