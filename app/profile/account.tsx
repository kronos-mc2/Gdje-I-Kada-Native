import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppScreen, AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { unregisterCurrentPushTokenAsync } from '@/core/notifications/push-notifications';
import { useAuthStore } from '@/core/store/auth-store';
import { ProfileMenuRow } from '@/features/profile/components/profile-menu-row';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleSignOut = async () => {
    await unregisterCurrentPushTokenAsync();
    await clearAuth();
    router.replace('/(auth)');
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('account')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.card}>
        <ProfileMenuRow
          icon="key-outline"
          title={t('changePassword')}
          subtitle={t('changePasswordSubtitle')}
          onPress={() => router.push('/profile/change-password')}
        />
        <ProfileMenuRow
          icon="trash-outline"
          title={t('deleteProfile')}
          subtitle={t('deleteProfileSubtitle')}
          onPress={() => router.push('/profile/delete-account')}
        />
        <AppButton title={t('signOut')} variant="glass" style={styles.authButton} onPress={() => void handleSignOut()} />
      </AppCard>
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
    gap: 2,
  },
  authButton: {
    marginTop: 16,
  },
});
