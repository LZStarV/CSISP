import localforage from 'localforage';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { APP_NAME } from '@/constants';

const STORE_NAME = 'mainLayout';

const STORAGE_KEYS = {
  SIDER_COLLAPSED: 'siderCollapsed',
} as const;

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

export const useMainLayoutStore = defineStore(STORE_NAME, () => {
  const siderCollapsed = ref(false);

  const toggleSiderCollapsed = () => {
    siderCollapsed.value = !siderCollapsed.value;
    storage.setItem(STORAGE_KEYS.SIDER_COLLAPSED, siderCollapsed.value);
  };

  const setSiderCollapsed = (collapsed: boolean) => {
    siderCollapsed.value = collapsed;
    storage.setItem(STORAGE_KEYS.SIDER_COLLAPSED, collapsed);
  };

  const initFromStorage = async () => {
    const value = await storage.getItem<boolean>(STORAGE_KEYS.SIDER_COLLAPSED);
    if (value !== null) {
      siderCollapsed.value = value;
    }
  };

  return {
    siderCollapsed,
    toggleSiderCollapsed,
    setSiderCollapsed,
    initFromStorage,
  };
});
