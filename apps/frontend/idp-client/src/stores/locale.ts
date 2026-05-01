import i18next from 'i18next';
import localforage from 'localforage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { APP_NAME, DEFAULT_LOCALE } from '@/constants';
import type { SupportedLocale } from '@/types';

const STORE_NAME = 'locale';

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

interface LocaleState {
  currentLocale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  initFromStorage: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    set => ({
      currentLocale: DEFAULT_LOCALE,

      setLocale: (locale: SupportedLocale) => {
        set({ currentLocale: locale });
        i18next.changeLanguage(locale);
      },

      initFromStorage: async () => {
        // persist middleware 会自动处理
      },
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => storage),
    }
  )
);
