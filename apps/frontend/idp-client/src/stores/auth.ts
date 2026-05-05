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
  otpSent: boolean;
  otpCode: string;
  supabaseSession: { access_token: string; refresh_token: string } | null;
  setTicket: (ticket: string | null) => void;
  setStateParam: (state: string | null) => void;
  setOtpSent: (sent: boolean) => void;
  setOtpCode: (code: string) => void;
  setSupabaseSession: (
    session: { access_token: string; refresh_token: string } | null
  ) => void;
  clearFlowState: () => void;
  initFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      ticket: null,
      state: null,
      otpSent: false,
      otpCode: '',
      supabaseSession: null,

      setTicket: (ticket: string | null) => set({ ticket }),
      setStateParam: (state: string | null) => set({ state }),
      setOtpSent: (sent: boolean) => set({ otpSent: sent }),
      setOtpCode: (code: string) => set({ otpCode: code }),
      setSupabaseSession: (
        session: { access_token: string; refresh_token: string } | null
      ) => set({ supabaseSession: session }),

      clearFlowState: () =>
        set({
          ticket: null,
          state: null,
          otpSent: false,
          otpCode: '',
          supabaseSession: null,
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
        supabaseSession: state.supabaseSession,
      }),
    }
  )
);
