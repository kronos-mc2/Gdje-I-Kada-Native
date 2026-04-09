import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppHeader, AppInput, AppScreen, AppText } from '@/components/primitives';
import { loginWithApple, loginWithEmail, loginWithGoogle } from '@/core/api/auth-services';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'gdjeikadanative',
  });

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const onGoogleLogin = useCallback(
    async (idToken: string) => {
      setIsSubmitting(true);
      try {
        const response = await loginWithGoogle(idToken);
        setAuth(response);
        router.replace('/(tabs)');
      } catch {
        Alert.alert(t('authError'), t('googleLoginFailed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setAuth, t],
  );

  const onAppleLogin = useCallback(
    async (idToken: string, name?: string) => {
      setIsSubmitting(true);
      try {
        const response = await loginWithApple(idToken, name);
        setAuth(response);
        router.replace('/(tabs)');
      } catch {
        Alert.alert(t('authError'), t('appleLoginFailed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setAuth, t],
  );

  useEffect(() => {
    if (googleResponse?.type !== 'success') {
      return;
    }

    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      Alert.alert(t('authError'), t('googleIdTokenMissing'));
      return;
    }

    void onGoogleLogin(idToken);
  }, [googleResponse, onGoogleLogin, t]);

  const handleAppleSignIn = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('authError'), t('appleOnlyOnIos'));
      return;
    }

    setIsSubmitting(true);
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

      Alert.alert(t('authError'), t('appleLoginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [onAppleLogin, t]);

  const handleEmailLogin = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert(t('authError'), t('invalidEmail'));
      return;
    }

    if (!password) {
      Alert.alert(t('authError'), t('passwordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginWithEmail({
        email: email.trim().toLowerCase(),
        password,
      });

      setAuth(response);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const apiMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;

      Alert.alert(t('authError'), apiMessage ?? t('loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen scroll>
      <AppHeader title={t('authWelcome')} subtitle={t('authLoginToContinue')} />

      <AppCard variant="glass" style={styles.card}>
        <AppButton
          title={t('signInGoogle')}
          variant="secondary"
          disabled={!googleRequest || isSubmitting}
          onPress={() =>
            void promptGoogleAsync(
              Platform.OS === 'android'
                ? {
                    showInRecents: true,
                  }
                : undefined,
            )
          }
        />
        <AppButton
          title={t('signInApple')}
          variant="secondary"
          disabled={isSubmitting || Platform.OS !== 'ios'}
          onPress={() => void handleAppleSignIn()}
          style={{ marginTop: 8 }}
        />
      </AppCard>

      <View style={styles.separator}>
        <AppText variant="caption" color="textMuted">
          {t('orUseEmail')}
        </AppText>
      </View>

      <AppInput
        label={t('emailLabel')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="name@example.com"
      />
      <AppInput
        label={t('passwordLabel')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <AppButton title={isSubmitting ? t('loading') : t('loginAction')} variant="glass" disabled={isSubmitting} onPress={() => void handleEmailLogin()} />

      <View style={styles.footer}>
        <AppText variant="body" color="textSecondary">
          {t('noAccountYet')}
        </AppText>
        <Link href="./register" asChild>
          <AppButton title={t('registerAction')} variant="ghost" />
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  separator: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
