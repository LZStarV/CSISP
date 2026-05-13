import localforage from 'localforage';
import { darkTheme, lightTheme } from 'naive-ui';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { APP_NAME, DEFAULT_THEME } from '@/constants';
import type { SupportedTheme } from '@/types';

const STORE_NAME = 'theme';

const STORAGE_KEYS = {
  CURRENT_THEME: 'currentTheme',
} as const;

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

export const useThemeStore = defineStore(STORE_NAME, () => {
  const currentTheme = ref<SupportedTheme>(DEFAULT_THEME);

  const naiveTheme = computed(() => {
    return currentTheme.value === 'light' ? lightTheme : darkTheme;
  });

  const setTheme = (theme: SupportedTheme) => {
    currentTheme.value = theme;
    storage.setItem(STORAGE_KEYS.CURRENT_THEME, theme);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const initFromStorage = async () => {
    const value = await storage.getItem<SupportedTheme>(
      STORAGE_KEYS.CURRENT_THEME
    );
    if (value !== null) {
      currentTheme.value = value;
    } else {
      currentTheme.value = DEFAULT_THEME;
      console.error('未找到当前主题，使用默认主题');
      setTheme(DEFAULT_THEME);
    }
  };

  return {
    currentTheme,
    naiveTheme,
    setTheme,
    toggleTheme,
    initFromStorage,
  };
});
