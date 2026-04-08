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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      clearAuth: () => {
        set({ accessToken: null, user: null });
        void AsyncStorage.removeItem('gdje-i-kada-auth-store');
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'gdje-i-kada-auth-store',
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
