import enCommon from './locales/portal/en/index.json';
import zhCommon from './locales/portal/zh/index.json';

export const portalLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type PortalLocales = typeof portalLocales;
