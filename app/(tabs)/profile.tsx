import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText, SectionHeader, ThemeToggle } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';

const LANGUAGES: Locale[] = ['hr', 'en'];

export default function ProfileScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { preference } = useAppTheme();

  const userProfile = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setLocale = useAppStore((state) => state.setLocale);
  const handleSignOut = () => {
    clearAuth();
    router.replace('/(auth)');
  };

  return (
    <AppScreen scroll>
      <AppCard variant="glass" style={styles.profileCard}>
        {userProfile ? (
          <>
            <AppText variant="headline">{userProfile.name}</AppText>
            <AppText variant="body" color="textSecondary" style={{ marginTop: 4 }}>
              {userProfile.email}
            </AppText>
          </>
        ) : (
          <AppText variant="body" color="textMuted">
            {t('notSignedIn')}
          </AppText>
        )}
      </AppCard>

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

      <AppButton title={t('signOut')} variant="glass" style={styles.authButton} onPress={handleSignOut} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: 18,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
  },
  authButton: {
    marginTop: 20,
  },
});
