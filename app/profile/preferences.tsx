import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { ProfileMenuRow } from '@/features/profile/components/profile-menu-row';

export default function PreferencesScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('preferences')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('preferences')} subtitle={t('preferencesSubtitle')} />
      <ProfileMenuRow
        icon="notifications-outline"
        title={t('notifications')}
        subtitle={t('notificationPreferencesSubtitle')}
        onPress={() => router.push('/profile/preferences/notifications')}
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
});
