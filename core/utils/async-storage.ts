type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStorage = new Map<string, string>();

const fallbackStorage: AsyncStorageLike = {
  getItem: async (key) => memoryStorage.get(key) ?? null,
  setItem: async (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: async (key) => {
    memoryStorage.delete(key);
  },
};

let cachedStorage: AsyncStorageLike | null = null;
let didWarnMissingNativeStorage = false;

const warnMissingNativeStorage = (error: unknown) => {
  if (didWarnMissingNativeStorage) {
    return;
  }

  didWarnMissingNativeStorage = true;

  const errorMessage = error instanceof Error && error.message ? error.message : 'Unknown storage error';
  console.warn(`AsyncStorage native module is unavailable, using in-memory fallback. ${errorMessage}`);
};

export const getAsyncStorage = (): AsyncStorageLike => {
  if (cachedStorage) {
    return cachedStorage;
  }

  try {
    const asyncStorageModule = require('@react-native-async-storage/async-storage');
    const asyncStorage = asyncStorageModule?.default ?? asyncStorageModule;

    if (
      asyncStorage &&
      typeof asyncStorage.getItem === 'function' &&
      typeof asyncStorage.setItem === 'function' &&
      typeof asyncStorage.removeItem === 'function'
    ) {
      cachedStorage = asyncStorage as AsyncStorageLike;
      return cachedStorage;
    }

    warnMissingNativeStorage(new Error('AsyncStorage module does not expose the expected API.'));
  } catch (error) {
    warnMissingNativeStorage(error);
  }

  cachedStorage = fallbackStorage;
  return cachedStorage;
};

export const asyncStorage = getAsyncStorage();
