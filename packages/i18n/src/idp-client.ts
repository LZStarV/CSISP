import enCommon from './locales/idp-client/en/common.json';
import zhCommon from './locales/idp-client/zh/common.json';

export const idpClientLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type IdpClientLocales = typeof idpClientLocales;
