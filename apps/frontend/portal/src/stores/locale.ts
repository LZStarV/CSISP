import localforage from 'localforage';
import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { APP_NAME, DEFAULT_LOCALE } from '@/constants';
import i18n from '@/i18n';
import type { SupportedLocale } from '@/types';

const STORE_NAME = 'locale';

const STORAGE_KEYS = {
  CURRENT_LOCALE: 'currentLocale',
} as const;

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

export const useLocaleStore = defineStore(STORE_NAME, () => {
  const currentLocale = ref<SupportedLocale>(DEFAULT_LOCALE);

  // 计算属性，根据当前语言返回对应的 Naive UI 语言包
  const naiveLocale = computed(() => {
    return currentLocale.value === DEFAULT_LOCALE ? zhCN : enUS;
  });

  // 计算属性，根据当前语言返回对应的 Naive UI 日期语言包
  const naiveDateLocale = computed(() => {
    return currentLocale.value === DEFAULT_LOCALE ? dateZhCN : dateEnUS;
  });

  // 设置当前语言
  const setLocale = (locale: SupportedLocale) => {
    currentLocale.value = locale;
    storage.setItem(STORAGE_KEYS.CURRENT_LOCALE, locale);
  };

  // 初始化从本地存储中获取当前语言
  const initFromStorage = async () => {
    const value = await storage.getItem<SupportedLocale>(
      STORAGE_KEYS.CURRENT_LOCALE
    );
    if (value !== null) {
      currentLocale.value = value;
    } else {
      currentLocale.value = DEFAULT_LOCALE;
      console.error('未找到当前语言，使用默认语言');
      setLocale(DEFAULT_LOCALE);
    }
  };

  watch(
    () => currentLocale.value,
    newLocale => {
      i18n.global.locale.value = newLocale;
    }
  );

  return {
    currentLocale,
    naiveLocale,
    naiveDateLocale,
    setLocale,
    initFromStorage,
  };
});
