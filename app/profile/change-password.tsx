import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText } from '@/components/primitives';
import { useChangePasswordMutation } from '@/core/api/query-hooks';
import { getApiErrorMessage } from '@/core/api/http-client';
import { useI18n } from '@/core/i18n/use-i18n';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const changePasswordMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword) {
      Alert.alert(t('validation'), t('currentPasswordRequired'));
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      Alert.alert(t('validation'), t('passwordPolicyHint'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('validation'), t('passwordsDoNotMatch'));
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      Alert.alert(t('passwordChanged'), t('passwordChangedSubtitle'), [{ text: t('ok'), onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert(t('changePasswordFailed'), getApiErrorMessage(error) ?? t('changePasswordFailed'));
    }
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('changePassword')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.card}>
        <AppInput label={t('currentPassword')} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
        <AppInput label={t('newPassword')} value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
        <AppInput label={t('confirmNewPassword')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
        <AppText variant="caption" color="textMuted" style={styles.hint}>
          {t('passwordPolicyHint')}
        </AppText>
      </AppCard>

      <AppButton
        title={changePasswordMutation.isPending ? t('loading') : t('savePassword')}
        disabled={changePasswordMutation.isPending}
        onPress={() => void handleSubmit()}
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
  hint: {
    marginTop: -4,
  },
});
