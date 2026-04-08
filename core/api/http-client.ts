import axios from 'axios';
import { Platform } from 'react-native';

import { useAuthStore } from '@/core/store/auth-store';

const fallbackBaseUrl = 'http://localhost:8080/api';
const androidLoopbackHost = '10.0.2.2';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const androidOverride = process.env.EXPO_PUBLIC_ANDROID_API_BASE_URL?.trim();
  if (Platform.OS === 'android' && androidOverride) {
    return normalizeBaseUrl(androidOverride);
  }

  const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl).trim() || fallbackBaseUrl;
  if (Platform.OS === 'android' && /:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(configuredBaseUrl)) {
    return normalizeBaseUrl(configuredBaseUrl.replace(/localhost|127\.0\.0\.1/i, androidLoopbackHost));
  }

  return normalizeBaseUrl(configuredBaseUrl);
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 7000,
});

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
    const status = error?.response?.status;
    const isAuthPath = typeof error?.config?.url === 'string' && error.config.url.includes('/auth/');

    const shouldAutoLogout = Platform.OS === 'web';
    if (status === 401 && !isAuthPath && shouldAutoLogout) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  },
);
