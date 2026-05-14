import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppIconButton, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useMyEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ProfileEventRow } from '@/features/profile/components/profile-event-row';

export default function CreatedEventsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const { data: events = [], isLoading } = useMyEventsQuery('created');

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('createdEventsTitle')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('manageEvents')} subtitle={t('createdEventsSubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        {isLoading ? (
          <AppText variant="body" color="textMuted">
            {t('loading')}
          </AppText>
        ) : events.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noCreatedEvents')}
          </AppText>
        ) : (
          events.map((event) => (
            <ProfileEventRow
              key={event.id}
              event={event}
              onPress={() => router.push({ pathname: '/profile/event/[id]', params: { id: event.id } })}
              right={
                event.waitlistCount ? (
                  <View style={[styles.badge, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.border }]}>
                    <AppText variant="caption">{event.waitlistCount}</AppText>
                  </View>
                ) : null
              }
            />
          ))
        )}
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
    gap: 12,
  },
  badge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
