import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppScreen, AppText, SectionHeader, ThemeToggle } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAuthStore } from '@/core/store/auth-store';
import { unregisterCurrentPushTokenAsync } from '@/core/notifications/push-notifications';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';
import { ProfileMenuRow } from '@/features/profile/components/profile-menu-row';

const LANGUAGES: Locale[] = ['hr', 'en'];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { preference } = useAppTheme();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setLocale = useAppStore((state) => state.setLocale);

  const handleSignOut = async () => {
    await unregisterCurrentPushTokenAsync();
    await clearAuth();
    router.replace('/(auth)');
  };

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('settings')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('language')} />
      <View style={styles.languageRow}>
        {LANGUAGES.map((item) => (
          <AppButton
            key={item}
            title={item.toUpperCase()}
            variant={locale === item ? 'primary' : 'secondary'}
            style={styles.languageButton}
            onPress={() => setLocale(item)}
          />
        ))}
      </View>

      <SectionHeader title={t('theme')} subtitle={preference === 'system' ? t('themeSystem') : undefined} />
      <ThemeToggle value={themePreference} onChange={setThemePreference} />

      <SectionHeader title={t('preferences')} subtitle={t('preferencesSubtitle')} />
      <View style={styles.menuGroup}>
        <ProfileMenuRow
          icon="options-outline"
          title={t('preferences')}
          subtitle={t('preferencesMenuSubtitle')}
          onPress={() => router.push('/profile/preferences')}
        />
      </View>

      <AppCard variant="glass" style={styles.accountCard}>
        <AppText variant="bodyStrong">{t('account')}</AppText>
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
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
  },
  menuGroup: {
    marginBottom: 8,
  },
  accountCard: {
    marginTop: 24,
  },
  authButton: {
    marginTop: 16,
  },
});
