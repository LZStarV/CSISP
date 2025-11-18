import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AppState } from '@/types';

export const useAppStore = defineStore('app', () => {
  const state = ref<AppState>({
    collapsed: false,
    theme: 'light',
    loading: false,
  });

  // Actions
  const toggleSidebar = () => {
    state.value.collapsed = !state.value.collapsed;
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    state.value.collapsed = collapsed;
  };

  const setTheme = (theme: 'light' | 'dark') => {
    state.value.theme = theme;
    // 可以在这里添加主题切换的逻辑，比如修改CSS变量等
  };

  const setLoading = (loading: boolean) => {
    state.value.loading = loading;
  };

  return {
    // State
    state,

    // Getters (computed)
    get collapsed() {
      return state.value.collapsed;
    },
    get theme() {
      return state.value.theme;
    },
    get loading() {
      return state.value.loading;
    },

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    setLoading,
  };
});
