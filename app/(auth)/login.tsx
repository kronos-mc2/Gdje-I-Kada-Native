import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppInput, AppScreen, AppText } from '@/components/primitives';
import { loginWithEmail } from '@/core/api/auth-services';
import { getApiBaseUrl, getApiErrorMessage, isApiNetworkError } from '@/core/api/http-client';
import { useI18n } from '@/core/i18n/use-i18n';
import { SocialAuthButton } from '@/features/auth/components/social-auth-button';
import { useAuthRestoreMessageAlert } from '@/features/auth/hooks/use-auth-restore-message-alert';
import { useSocialAuth } from '@/features/auth/hooks/use-social-auth';

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    isSocialSubmitting,
    isAppleSignInAvailable,
    handleGoogleSignIn,
    handleAppleSignIn,
    persistSession,
  } = useSocialAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthSubmitting = isSubmitting || isSocialSubmitting;

  useAuthRestoreMessageAlert();

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

      const didPersistSession = await persistSession(response);
      if (!didPersistSession) {
        return;
      }
      router.replace('/(tabs)');
    } catch (error: unknown) {
      if (isApiNetworkError(error)) {
        Alert.alert(t('authError'), `${t('apiConnectionFailed')}\n${getApiBaseUrl()}`);
      } else {
        Alert.alert(t('authError'), getApiErrorMessage(error) ?? t('loginFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <AppText variant="title">{t('signInTitle')}</AppText>
        <AppText variant="caption" color="textMuted" style={styles.headerSubtitle}>
          {t('signInSubtitle')}
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

      <AppButton title={isSubmitting ? t('loading') : t('signInTitle')} variant="glass" disabled={isAuthSubmitting} onPress={() => void handleEmailLogin()} />

      <View style={styles.separator}>
        <AppText variant="caption" color="textMuted">
          {t('orConnectUsing')}
        </AppText>
      </View>

      <View style={styles.socialGroup}>
        <SocialAuthButton
          provider="google"
          title={t('signInGoogle')}
          disabled={isAuthSubmitting}
          onPress={() => void handleGoogleSignIn()}
        />
        {isAppleSignInAvailable ? (
          <SocialAuthButton
            provider="apple"
            title={t('signInApple')}
            disabled={isAuthSubmitting}
            onPress={() => void handleAppleSignIn()}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <AppText variant="body" color="textSecondary">
          {t('noAccountYet')}
        </AppText>
        <Link href="/(auth)/register" asChild>
          <AppButton title={t('signUpTitle')} variant="ghost" />
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
    paddingTop: 52,
  },
  header: {
    marginBottom: 22,
  },
  headerSubtitle: {
    marginTop: 8,
  },
  socialGroup: {
    gap: 8,
  },
  separator: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 18,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
