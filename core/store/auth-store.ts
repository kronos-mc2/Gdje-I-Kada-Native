import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { UserProfile } from '@/core/types/domain';

type AuthSnapshot = {
  accessToken: string;
  user: UserProfile;
};

type AuthStore = {
  accessToken: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  hydrateAuth: () => Promise<void>;
  setAuth: (payload: AuthSnapshot) => Promise<void>;
  clearAuth: () => Promise<void>;
};

const AUTH_STORAGE_KEY = 'gdje-i-kada-auth-store';

let hydrationPromise: Promise<void> | null = null;

const readAuthSnapshot = async (): Promise<AuthSnapshot | null> => {
  const normalizeSnapshot = (rawValue: string | null): AuthSnapshot | null => {
    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as Partial<AuthSnapshot> | { state?: Partial<AuthSnapshot> };
      const persistedState: Partial<AuthSnapshot> =
        parsedValue &&
        typeof parsedValue === 'object' &&
        'state' in parsedValue &&
        parsedValue.state &&
        typeof parsedValue.state === 'object'
          ? parsedValue.state
          : (parsedValue as Partial<AuthSnapshot>);

      if (typeof persistedState.accessToken !== 'string') {
        return null;
      }

      const user = persistedState.user;
      if (!user || typeof user !== 'object' || typeof user.name !== 'string' || typeof user.email !== 'string') {
        return null;
      }

      return {
        accessToken: persistedState.accessToken,
        user,
      };
    } catch {
      return null;
    }
  };

  const secureValue = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
  const secureSnapshot = normalizeSnapshot(secureValue);
  if (secureSnapshot) {
    return secureSnapshot;
  }

  const asyncStorageValue = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  const asyncStorageSnapshot = normalizeSnapshot(asyncStorageValue);
  if (asyncStorageSnapshot) {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(asyncStorageSnapshot));
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return asyncStorageSnapshot;
};

const writeAuthSnapshot = async (payload: AuthSnapshot | null) => {
  if (!payload) {
    await Promise.all([SecureStore.deleteItemAsync(AUTH_STORAGE_KEY), AsyncStorage.removeItem(AUTH_STORAGE_KEY)]);
    return;
  }

  const serializedPayload = JSON.stringify(payload);
  await Promise.all([SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload), AsyncStorage.removeItem(AUTH_STORAGE_KEY)]);
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  hydrateAuth: async () => {
    if (get().hydrated) {
      return;
    }

    if (!hydrationPromise) {
      hydrationPromise = (async () => {
        const snapshot = await readAuthSnapshot();

        set({
          accessToken: snapshot?.accessToken ?? null,
          user: snapshot?.user ?? null,
          hydrated: true,
        });
      })().finally(() => {
        hydrationPromise = null;
      });
    }

    await hydrationPromise;
  },
  setAuth: async ({ accessToken, user }) => {
    await writeAuthSnapshot({ accessToken, user });
    set({ accessToken, user, hydrated: true });
  },
  clearAuth: async () => {
    await writeAuthSnapshot(null);
    set({ accessToken: null, user: null, hydrated: true });
  },
}));
