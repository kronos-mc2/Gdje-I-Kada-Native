import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { UserProfile } from '@/core/types/domain';

type AuthStore = {
  accessToken: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  setAuth: (payload: { accessToken: string; user: UserProfile }) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
};

const AUTH_STORAGE_KEY = 'gdje-i-kada-auth-store';
const AUTH_STORAGE_VERSION = 0;

const persistAuthSnapshot = (payload: { accessToken: string; user: UserProfile } | null) => {
  if (!payload) {
    return AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return AsyncStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      state: payload,
      version: AUTH_STORAGE_VERSION,
    }),
  );
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      setAuth: ({ accessToken, user }) => {
        set({ accessToken, user });
        void persistAuthSnapshot({ accessToken, user });
      },
      clearAuth: () => {
        set({ accessToken: null, user: null });
        void persistAuthSnapshot(null);
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
