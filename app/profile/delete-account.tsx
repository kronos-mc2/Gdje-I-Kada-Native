import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText } from '@/components/primitives';
import { getApiErrorMessage } from '@/core/api/http-client';
import { useDeleteAccountMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { unregisterCurrentPushTokenAsync } from '@/core/notifications/push-notifications';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const deleteAccountMutation = useDeleteAccountMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const canSubmit = confirmation.trim().toUpperCase() === t('deleteProfileConfirmWord');

  const handleDelete = () => {
    if (!canSubmit) {
      Alert.alert(t('validation'), t('deleteProfileConfirmRequired'));
      return;
    }

    Alert.alert(t('deleteProfile'), t('deleteProfileFinalWarning'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteProfile'),
        style: 'destructive',
        onPress: () => void submitDelete(),
      },
    ]);
  };

  const submitDelete = async () => {
    try {
      await deleteAccountMutation.mutateAsync({ currentPassword: currentPassword || undefined });
      await unregisterCurrentPushTokenAsync();
      await clearAuth();
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert(t('deleteProfileFailed'), getApiErrorMessage(error) ?? t('deleteProfileFailed'));
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('deleteProfile')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.card}>
        <AppText variant="bodyStrong">{t('deleteProfileTitle')}</AppText>
        <AppText variant="body" color="textSecondary" style={styles.copy}>
          {t('deleteProfileBody')}
        </AppText>
        <AppText variant="caption" style={[styles.recovery, { color: theme.colors.mapAccent }]}>
          {t('deleteProfileRecovery')}
        </AppText>
      </AppCard>

      <AppInput label={t('currentPassword')} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
      <AppInput
        label={t('deleteProfileConfirmLabel')}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <AppButton
        title={deleteAccountMutation.isPending ? t('loading') : t('deleteProfile')}
        variant="secondary"
        disabled={deleteAccountMutation.isPending}
        onPress={handleDelete}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    marginBottom: 18,
  },
  copy: {
    marginTop: 8,
  },
  recovery: {
    marginTop: 12,
  },
});
