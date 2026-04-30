import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { resetSessionQueryState } from '@/core/query/session-query-state';
import { UserProfile } from '@/core/types/domain';
import { asyncStorage } from '@/core/utils/async-storage';

type AuthSnapshot = {
  accessToken: string;
  user: UserProfile;
};

type AuthStore = {
  accessToken: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  authRestoreMessage: string | null;
  hydrateAuth: () => Promise<void>;
  setAuth: (payload: AuthSnapshot) => Promise<void>;
  clearAuth: () => Promise<void>;
  consumeAuthRestoreMessage: () => string | null;
};

const AUTH_STORAGE_KEY = 'gdje-i-kada-auth-store';
const AUTH_SESSION_MARKER_KEY = 'gdje-i-kada-auth-session-marker';
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return 'Unknown storage error';
};

type AuthStorageRead = {
  label: string;
  snapshot: AuthSnapshot | null;
  rawFound: boolean;
  errorMessage: string | null;
};

const formatFailedReads = (reads: AuthStorageRead[]) =>
  reads
    .map((read) => {
      if (read.errorMessage) {
        return `${read.label}: ${read.errorMessage}`;
      }

      return `${read.label}: ${read.rawFound ? 'saved value is invalid' : 'empty'}`;
    })
    .join('\n');

const readSecureSnapshot = async (label: string, options?: SecureStore.SecureStoreOptions): Promise<AuthStorageRead> => {
  try {
    const rawValue = await SecureStore.getItemAsync(AUTH_STORAGE_KEY, options);
    return {
      label,
      snapshot: normalizeSnapshot(rawValue),
      rawFound: Boolean(rawValue),
      errorMessage: null,
    };
  } catch (error: unknown) {
    return {
      label,
      snapshot: null,
      rawFound: false,
      errorMessage: getErrorMessage(error),
    };
  }
};

const readAsyncStorageSnapshot = async (): Promise<AuthStorageRead> => {
  try {
    const rawValue = await asyncStorage.getItem(AUTH_STORAGE_KEY);
    return {
      label: 'AsyncStorage mirror',
      snapshot: normalizeSnapshot(rawValue),
      rawFound: Boolean(rawValue),
      errorMessage: null,
    };
  } catch (error: unknown) {
    return {
      label: 'AsyncStorage mirror',
      snapshot: null,
      rawFound: false,
      errorMessage: getErrorMessage(error),
    };
  }
};

const persistMigratedSnapshot = async (snapshot: AuthSnapshot) => {
  try {
    const serializedPayload = JSON.stringify(snapshot);
    await Promise.allSettled([
      SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload, AUTH_SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload),
      asyncStorage.setItem(AUTH_STORAGE_KEY, serializedPayload),
      asyncStorage.setItem(AUTH_SESSION_MARKER_KEY, '1'),
    ]);
  } catch {
    // Migration failures should not block an otherwise valid existing session.
  }
};

const readAuthSnapshot = async (): Promise<{ snapshot: AuthSnapshot | null; restoreMessage: string | null }> => {
  const preferredSecureRead = await readSecureSnapshot('SecureStore primary', AUTH_SECURE_STORE_OPTIONS);
  if (preferredSecureRead.snapshot) {
    return { snapshot: preferredSecureRead.snapshot, restoreMessage: null };
  }

  const legacySecureRead = await readSecureSnapshot('SecureStore legacy');
  if (legacySecureRead.snapshot) {
    await persistMigratedSnapshot(legacySecureRead.snapshot);
    return { snapshot: legacySecureRead.snapshot, restoreMessage: null };
  }

  const asyncStorageRead = await readAsyncStorageSnapshot();
  if (asyncStorageRead.snapshot) {
    await persistMigratedSnapshot(asyncStorageRead.snapshot);
    return { snapshot: asyncStorageRead.snapshot, restoreMessage: null };
  }

  const failedReads = formatFailedReads([preferredSecureRead, legacySecureRead, asyncStorageRead]);
  const hadPreviousSession = await asyncStorage.getItem(AUTH_SESSION_MARKER_KEY).catch(() => null);
  if (!hadPreviousSession) {
    return { snapshot: null, restoreMessage: null };
  }

  return {
    snapshot: null,
    restoreMessage: `Pronaden je trag ranije prijave, ali spremljena sesija se nije mogla ucitati.\n\n${failedReads}`,
  };
};

const writeAuthSnapshot = async (payload: AuthSnapshot | null) => {
  if (!payload) {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEY, AUTH_SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEY),
      asyncStorage.removeItem(AUTH_STORAGE_KEY),
      asyncStorage.removeItem(AUTH_SESSION_MARKER_KEY),
    ]);
    return;
  }

  const serializedPayload = JSON.stringify(payload);
  const [primarySecureResult, legacySecureResult, asyncStorageResult] = await Promise.allSettled([
    SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload, AUTH_SECURE_STORE_OPTIONS),
    SecureStore.setItemAsync(AUTH_STORAGE_KEY, serializedPayload),
    asyncStorage.setItem(AUTH_STORAGE_KEY, serializedPayload),
    asyncStorage.setItem(AUTH_SESSION_MARKER_KEY, '1'),
  ]);

  if (
    primarySecureResult.status === 'rejected' &&
    legacySecureResult.status === 'rejected' &&
    asyncStorageResult.status === 'rejected'
  ) {
    throw asyncStorageResult.reason;
  }
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  authRestoreMessage: null,
  hydrateAuth: async () => {
    if (get().hydrated) {
      return;
    }

    if (!hydrationPromise) {
      hydrationPromise = (async () => {
        const { snapshot, restoreMessage } = await readAuthSnapshot();

        set({
          accessToken: snapshot?.accessToken ?? null,
          user: snapshot?.user ?? null,
          hydrated: true,
          authRestoreMessage: restoreMessage,
        });
      })().finally(() => {
        hydrationPromise = null;
      });
    }

    await hydrationPromise;
  },
  setAuth: async ({ accessToken, user }) => {
    const previousAccessToken = get().accessToken;
    if (previousAccessToken && previousAccessToken !== accessToken) {
      set({ accessToken: null, user: null, hydrated: true, authRestoreMessage: null });
    }

    await resetSessionQueryState();
    await writeAuthSnapshot({ accessToken, user });
    set({ accessToken, user, hydrated: true, authRestoreMessage: null });
  },
  clearAuth: async () => {
    set({ accessToken: null, user: null, hydrated: true, authRestoreMessage: null });
    await resetSessionQueryState();
    await writeAuthSnapshot(null);
  },
  consumeAuthRestoreMessage: () => {
    const message = get().authRestoreMessage;
    if (message) {
      set({ authRestoreMessage: null });
    }

    return message;
  },
}));
