import localforage from 'localforage';
import { darkTheme, lightTheme } from 'naive-ui';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { APP_NAME } from '@/constants';
import type { SupportedTheme } from '@/types';

const isDark = computed(() => {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
});

const STORE_NAME = 'theme';

const STORAGE_KEYS = {
  CURRENT_THEME: 'currentTheme',
} as const;

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const useThemeStore = defineStore(STORE_NAME, () => {
  const currentTheme = ref<SupportedTheme>(
    isDark.value ? THEME.DARK : THEME.LIGHT
  );

  const naiveTheme = computed(() => {
    return currentTheme.value === THEME.LIGHT ? lightTheme : darkTheme;
  });

  const setTheme = (theme: SupportedTheme) => {
    currentTheme.value = theme;
    storage.setItem(STORAGE_KEYS.CURRENT_THEME, theme);
  };

  const toggleTheme = () => {
    const newTheme =
      currentTheme.value === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
    setTheme(newTheme);
  };

  const initFromStorage = async () => {
    const value = await storage.getItem<SupportedTheme>(
      STORAGE_KEYS.CURRENT_THEME
    );
    const systemTheme = isDark.value ? THEME.DARK : THEME.LIGHT;

    if (value === null) {
      currentTheme.value = systemTheme;
      storage.setItem(STORAGE_KEYS.CURRENT_THEME, systemTheme);
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
