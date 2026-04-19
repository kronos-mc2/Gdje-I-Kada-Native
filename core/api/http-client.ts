import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuthStore } from '@/core/store/auth-store';

const fallbackBaseUrl = 'http://localhost:8080/api';
const testBaseUrl = 'https://test-api-gik.nerizz.com/api';
const androidLoopbackHost = '10.0.2.2';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

type AppConfigExtra = {
  appVariant?: string;
  apiBaseUrl?: string;
  androidApiBaseUrl?: string;
};

const getAppConfigExtra = (): AppConfigExtra => {
  const extra = Constants.expoConfig?.extra;
  return extra && typeof extra === 'object' ? (extra as AppConfigExtra) : {};
};

const isTestVariant = (extra: AppConfigExtra) =>
  extra.appVariant === 'test' ||
  Constants.expoConfig?.slug === 'Gdje-I-Kada-Native-Test' ||
  Constants.expoConfig?.name === 'GIK Test' ||
  Constants.expoConfig?.android?.package?.endsWith('.test') ||
  Constants.expoConfig?.ios?.bundleIdentifier?.endsWith('.test');

const resolveApiBaseUrl = () => {
  const extra = getAppConfigExtra();
  const androidOverride = (extra.androidApiBaseUrl ?? process.env.EXPO_PUBLIC_ANDROID_API_BASE_URL)?.trim();
  if (Platform.OS === 'android' && androidOverride) {
    return normalizeBaseUrl(androidOverride);
  }

  const variantFallbackUrl = isTestVariant(extra) ? testBaseUrl : fallbackBaseUrl;
  const configuredBaseUrl = (extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? variantFallbackUrl).trim() || variantFallbackUrl;
  if (Platform.OS === 'android' && /:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(configuredBaseUrl)) {
    return normalizeBaseUrl(configuredBaseUrl.replace(/localhost|127\.0\.0\.1/i, androidLoopbackHost));
  }

  return normalizeBaseUrl(configuredBaseUrl);
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 7000,
});

export const getApiBaseUrl = () => apiClient.defaults.baseURL ?? resolveApiBaseUrl();

export const getApiErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    for (const key of ['message', 'error', 'detail']) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
};

export const isApiNetworkError = (error: unknown) => axios.isAxiosError(error) && !error.response;

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
