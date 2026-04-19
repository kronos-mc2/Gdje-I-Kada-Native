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
const AUTH_KEYCHAIN_SERVICE = 'gdje-i-kada-auth';
const AUTH_SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: AUTH_KEYCHAIN_SERVICE,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let hydrationPromise: Promise<void> | null = null;

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

const readSecureSnapshot = async (options?: SecureStore.SecureStoreOptions): Promise<AuthSnapshot | null> => {
  try {
    return normalizeSnapshot(await SecureStore.getItemAsync(AUTH_STORAGE_KEY, options));
  } catch {
    return null;
  }
};

const readAsyncStorageSnapshot = async (): Promise<AuthSnapshot | null> => {
  try {
    return normalizeSnapshot(await AsyncStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
};

const persistMigratedSnapshot = async (snapshot: AuthSnapshot) => {
  try {
    const serializedPayload = JSON.stringify(snapshot);
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload, AUTH_SECURE_STORE_OPTIONS);
    await Promise.allSettled([SecureStore.deleteItemAsync(AUTH_STORAGE_KEY), AsyncStorage.removeItem(AUTH_STORAGE_KEY)]);
  } catch {
    // Migration failures should not block an otherwise valid existing session.
  }
};

const readAuthSnapshot = async (): Promise<AuthSnapshot | null> => {
  const preferredSecureSnapshot = await readSecureSnapshot(AUTH_SECURE_STORE_OPTIONS);
  if (preferredSecureSnapshot) {
    return preferredSecureSnapshot;
  }

  const legacySecureSnapshot = await readSecureSnapshot();
  if (legacySecureSnapshot) {
    await persistMigratedSnapshot(legacySecureSnapshot);
    return legacySecureSnapshot;
  }

  const asyncStorageSnapshot = await readAsyncStorageSnapshot();
  if (asyncStorageSnapshot) {
    await persistMigratedSnapshot(asyncStorageSnapshot);
  }

  return asyncStorageSnapshot;
};

const writeAuthSnapshot = async (payload: AuthSnapshot | null) => {
  if (!payload) {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEY, AUTH_SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEY),
      AsyncStorage.removeItem(AUTH_STORAGE_KEY),
    ]);
    return;
  }

  const serializedPayload = JSON.stringify(payload);
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload, AUTH_SECURE_STORE_OPTIONS);
  await Promise.allSettled([SecureStore.deleteItemAsync(AUTH_STORAGE_KEY), AsyncStorage.removeItem(AUTH_STORAGE_KEY)]);
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
