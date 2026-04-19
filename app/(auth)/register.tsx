import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppHeader, AppInput, AppScreen, AppText } from '@/components/primitives';
import { registerWithEmail } from '@/core/api/auth-services';
import { getApiBaseUrl, getApiErrorMessage, isApiNetworkError } from '@/core/api/http-client';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      Alert.alert(t('authError'), t('invalidName'));
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      Alert.alert(t('authError'), t('invalidEmail'));
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      Alert.alert(t('authError'), t('passwordPolicyHint'));
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert(t('authError'), t('passwordsDoNotMatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerWithEmail({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      try {
        await setAuth(response);
      } catch {
        Alert.alert(t('authError'), t('sessionPersistFailed'));
        return;
      }

      router.replace('/(tabs)');
    } catch (error: unknown) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
          ? (error as { response?: { status?: number } }).response?.status
          : null;

      if (status === 409) {
        Alert.alert(t('authError'), t('emailAlreadyExists'));
      } else if (isApiNetworkError(error)) {
        Alert.alert(t('authError'), `${t('apiConnectionFailed')}\n${getApiBaseUrl()}`);
      } else {
        Alert.alert(t('authError'), getApiErrorMessage(error) ?? t('registerFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen scroll>
      <AppHeader title={t('registerAction')} subtitle={t('createAccountSubtitle')} />

      <AppInput label={t('nameLabel')} value={name} onChangeText={setName} />
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
      <AppInput
        label={t('confirmPasswordLabel')}
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        autoCapitalize="none"
      />

      <AppText variant="caption" color="textMuted" style={styles.hint}>
        {t('passwordPolicyHint')}
      </AppText>

      <AppButton
        title={isSubmitting ? t('loading') : t('registerAction')}
        variant="glass"
        disabled={isSubmitting}
        onPress={() => void onRegister()}
      />

      <View style={styles.footer}>
        <AppText variant="body" color="textSecondary">
          {t('alreadyHaveAccount')}
        </AppText>
        <Link href="./" asChild>
          <AppButton title={t('loginAction')} variant="ghost" />
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
