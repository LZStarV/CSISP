import { portalLocales } from '@csisp/i18n/portal';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: {
    en: portalLocales.en.common,
    zh: portalLocales.zh.common,
  },
  flatJson: true,
  fallbackFormat: true,
});

export default i18n;
