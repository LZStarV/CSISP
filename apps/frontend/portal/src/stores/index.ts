import localforage from 'localforage';
import { defineStore } from 'pinia';
import { ref } from 'vue';

const storage = localforage.createInstance({
  name: 'csisp-portal',
  storeName: 'app_v1',
});

export const useAppStore = defineStore('app', () => {
  const collapsed = ref(false);

  const initFromStorage = async () => {
    const value = await storage.getItem<boolean>('collapsed');
    if (value !== null) {
      collapsed.value = value;
    }
  };

  return {
    collapsed,
    initFromStorage,
  };
});
