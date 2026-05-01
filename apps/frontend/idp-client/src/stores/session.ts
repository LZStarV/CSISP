import localforage from 'localforage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { APP_NAME } from '@/constants';

const STORE_NAME = 'session';

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

interface UserInfo {
  name?: string;
  student_id?: string;
}

interface SessionState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  lastChecked: number;
  setSession: (loggedIn: boolean, userInfo?: UserInfo) => void;
  clearSession: () => void;
  initFromStorage: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    set => ({
      isLoggedIn: false,
      userInfo: null,
      lastChecked: 0,

      setSession: (loggedIn: boolean, userInfo?: UserInfo) => {
        set({
          isLoggedIn: loggedIn,
          userInfo: userInfo || null,
          lastChecked: Date.now(),
        });
      },

      clearSession: () => {
        set({
          isLoggedIn: false,
          userInfo: null,
          lastChecked: 0,
        });
      },

      initFromStorage: async () => {
        // persist middleware 会自动处理
      },
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => storage),
      partialize: state => ({
        // 持久化部分字段
        isLoggedIn: state.isLoggedIn,
        userInfo: state.userInfo,
      }),
    }
  )
);
