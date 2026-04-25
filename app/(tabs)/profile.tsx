import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText, SectionHeader, ThemeToggle } from '@/components/primitives';
import { useLikedEventsQuery } from '@/core/api/query-hooks';
import { getEventPosterUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

const LANGUAGES: Locale[] = ['hr', 'en'];

export default function ProfileScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { preference } = useAppTheme();

  const userProfile = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: likedEvents = [] } = useLikedEventsQuery();
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setLocale = useAppStore((state) => state.setLocale);

  const handleSignOut = async () => {
    await clearAuth();
    router.replace('/(auth)');
  };

  return (
    <AppScreen scroll>
      <AppCard variant="glass" style={styles.profileCard}>
        {userProfile ? (
          <>
            <AppText variant="headline">{userProfile.name}</AppText>
            <AppText variant="body" color="textSecondary" style={styles.email}>
              {userProfile.email}
            </AppText>
          </>
        ) : (
          <AppText variant="body" color="textMuted">
            {t('notSignedIn')}
          </AppText>
        )}
      </AppCard>

      <SectionHeader title={t('likedEvents')} subtitle={t('likedEventsSubtitle')} />
      {likedEvents.length === 0 ? (
        <AppCard variant="glass" style={styles.emptyLikesCard}>
          <AppText variant="body" color="textMuted">
            {t('noLikedEvents')}
          </AppText>
        </AppCard>
      ) : (
        likedEvents.map((event) => (
          <Pressable key={event.id} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
            <AppCard variant="glass" style={styles.likedEventCard}>
              <Image source={{ uri: getEventPosterUri(event, 320, 320) }} style={styles.likedEventImage} contentFit="cover" />
              <View style={styles.likedEventCopy}>
                <AppText variant="bodyStrong">{event.title[locale]}</AppText>
                <AppText variant="caption" color="textSecondary" style={styles.likedEventMeta}>
                  {event.where[locale]}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {formatEventDate(event.whenISO, locale)}
                </AppText>
              </View>
            </AppCard>
          </Pressable>
        ))
      )}

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

      <AppButton title={t('signOut')} variant="glass" style={styles.authButton} onPress={() => void handleSignOut()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: 18,
  },
  email: {
    marginTop: 4,
  },
  emptyLikesCard: {
    marginBottom: 8,
  },
  likedEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  likedEventImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  likedEventCopy: {
    flex: 1,
  },
  likedEventMeta: {
    marginTop: 4,
    marginBottom: 2,
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
