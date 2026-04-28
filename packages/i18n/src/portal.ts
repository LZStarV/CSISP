import enCommon from '../locales/portal/en/common.json';
import zhCommon from '../locales/portal/zh/common.json';

export const portalLocales = {
  zh: {
    common: zhCommon,
  },
  en: {
    common: enCommon,
  },
};

export type PortalLocales = typeof portalLocales;
