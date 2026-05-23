import localforage from 'localforage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { APP_NAME } from '@/constants';

const STORE_NAME = 'auth';

const storage = localforage.createInstance({
  name: APP_NAME,
  storeName: STORE_NAME,
});

interface AuthState {
  ticket: string | null;
  state: string | null;
  loginMode: 'password' | 'email';
  otpSent: boolean;
  otpCode: string;
  setTicket: (ticket: string | null) => void;
  setStateParam: (state: string | null) => void;
  setLoginMode: (mode: 'password' | 'email') => void;
  setOtpSent: (sent: boolean) => void;
  setOtpCode: (code: string) => void;
  clearFlowState: () => void;
  initFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      ticket: null,
      state: null,
      loginMode: 'password',
      otpSent: false,
      otpCode: '',

      setTicket: (ticket: string | null) => set({ ticket }),
      setStateParam: (state: string | null) => set({ state }),
      setLoginMode: (mode: 'password' | 'email') => set({ loginMode: mode }),
      setOtpSent: (sent: boolean) => set({ otpSent: sent }),
      setOtpCode: (code: string) => set({ otpCode: code }),

      clearFlowState: () =>
        set({
          ticket: null,
          state: null,
          otpSent: false,
          otpCode: '',
        }),

      initFromStorage: async () => {
        // persist middleware 会自动处理
      },
    }),
    {
      name: STORE_NAME,
      storage: createJSONStorage(() => storage),
      partialize: state => ({
        // 仅持久化需要跨刷新保留的状态
        ticket: state.ticket,
        state: state.state,
      }),
    }
  )
);
