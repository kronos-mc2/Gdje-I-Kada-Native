import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { loginWithApple, loginWithGoogle } from '@/core/api/auth-services';
import { getApiBaseUrl, getApiErrorMessage, isApiNetworkError } from '@/core/api/http-client';
import { signInWithNativeGoogle } from '@/core/auth/google-sign-in';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';
import type { AuthResponse } from '@/core/types/domain';

type AuthConfigExtra = {
  appleSignInEnabled?: boolean;
};

const getAuthConfigExtra = (): AuthConfigExtra => {
  const extra = Constants.expoConfig?.extra;
  return extra && typeof extra === 'object' ? (extra as AuthConfigExtra) : {};
};

const isGoogleNativeConfigurationError = (code?: string) =>
  code === '10' || code === 'DEVELOPER_ERROR' || code === 'SIGN_IN_ERROR';

const getNativeAuthErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' || typeof code === 'number' ? String(code) : undefined;
  }

  return undefined;
};

export function useSocialAuth() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    if (Platform.OS !== 'ios' || getAuthConfigExtra().appleSignInEnabled !== true) {
      setIsAppleSignInAvailable(false);
      return;
    }

    void AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (active) {
          setIsAppleSignInAvailable(available);
        }
      })
      .catch(() => {
        if (active) {
          setIsAppleSignInAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const persistSession = useCallback(
    async (response: AuthResponse) => {
      try {
        await setAuth(response);
        return true;
      } catch (error: unknown) {
        const details = error instanceof Error && error.message ? `\n${error.message}` : '';
        Alert.alert(t('authError'), `${t('sessionPersistFailed')}${details}`);
        return false;
      }
    },
    [setAuth, t],
  );

  const handleGoogleSignIn = useCallback(async () => {
    setIsSocialSubmitting(true);
    try {
      const googleResult = await signInWithNativeGoogle();
      if (googleResult.type === 'cancelled') {
        return;
      }

      if (googleResult.type === 'missing-web-client-id') {
        Alert.alert(t('authError'), t('googleWebClientMissing'));
        return;
      }

      if (googleResult.type === 'native-module-unavailable') {
        Alert.alert(t('authError'), t('googleNativeModuleUnavailable'));
        return;
      }

      if (googleResult.type !== 'success') {
        const details = googleResult.code
          ? `\n${isGoogleNativeConfigurationError(googleResult.code) ? t('googleNativeConfigurationFailed') : googleResult.code}`
          : '';
        Alert.alert(t('authError'), `${t('googleLoginFailed')}${details}`);
        return;
      }

      const response = await loginWithGoogle(googleResult.idToken);
      const didPersistSession = await persistSession(response);
      if (!didPersistSession) {
        return;
      }
      router.replace('/(tabs)');
    } catch (error: unknown) {
      if (isApiNetworkError(error)) {
        Alert.alert(t('authError'), `${t('apiConnectionFailed')}\n${getApiBaseUrl()}`);
      } else {
        const details = getApiErrorMessage(error);
        Alert.alert(t('authError'), details ? `${t('googleLoginFailed')}\n${details}` : t('googleLoginFailed'));
      }
    } finally {
      setIsSocialSubmitting(false);
    }
  }, [persistSession, router, t]);

  const onAppleLogin = useCallback(
    async (idToken: string, name?: string) => {
      setIsSocialSubmitting(true);
      try {
        const response = await loginWithApple(idToken, name);
        const didPersistSession = await persistSession(response);
        if (!didPersistSession) {
          return;
        }
        router.replace('/(tabs)');
      } catch (error: unknown) {
        if (isApiNetworkError(error)) {
          Alert.alert(t('authError'), `${t('apiConnectionFailed')}\n${getApiBaseUrl()}`);
        } else {
          const details = getApiErrorMessage(error);
          Alert.alert(t('authError'), details ? `${t('appleLoginFailed')}\n${details}` : t('appleLoginFailed'));
        }
      } finally {
        setIsSocialSubmitting(false);
      }
    },
    [persistSession, router, t],
  );

  const handleAppleSignIn = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('authError'), t('appleOnlyOnIos'));
      return;
    }

    if (getAuthConfigExtra().appleSignInEnabled !== true) {
      Alert.alert(t('authError'), t('appleNotConfigured'));
      return;
    }

    setIsSocialSubmitting(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert(t('authError'), t('appleIdTokenMissing'));
        return;
      }

      const firstName = credential.fullName?.givenName ?? '';
      const lastName = credential.fullName?.familyName ?? '';
      const combinedName = `${firstName} ${lastName}`.trim();
      const socialName = combinedName.length > 0 ? combinedName : undefined;

      await onAppleLogin(credential.identityToken, socialName);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }

      const details = getNativeAuthErrorCode(error);
      Alert.alert(t('authError'), details ? `${t('appleLoginFailed')}\n${details}` : t('appleLoginFailed'));
    } finally {
      setIsSocialSubmitting(false);
    }
  }, [onAppleLogin, t]);

  return {
    isSocialSubmitting,
    isAppleSignInAvailable,
    handleGoogleSignIn,
    handleAppleSignIn,
    persistSession,
  };
}
