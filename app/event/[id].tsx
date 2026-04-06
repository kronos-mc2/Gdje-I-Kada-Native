import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppHeader, AppScreen, AppText } from '@/components/primitives';
import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { formatEventDate } from '@/core/utils/date';

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = params.id;

  const { t, locale } = useI18n();
  const { data: fetchedEvents = [] } = useEventsQuery();

  const createdEvents = useAppStore((state) => state.createdEvents);
  const joinedEventIds = useAppStore((state) => state.joinedEventIds);
  const toggleJoined = useAppStore((state) => state.toggleJoined);

  const allEvents = useMemo(() => [...createdEvents, ...fetchedEvents], [createdEvents, fetchedEvents]);
  const event = useMemo(() => allEvents.find((item) => item.id === eventId), [allEvents, eventId]);

  if (!event) {
    return (
      <AppScreen>
        <AppHeader title={t('details')} subtitle={t('eventNotFound')} />
        <View style={styles.notFoundWrap}>
          <AppText variant="headline" style={styles.notFoundTitle}>
            {t('eventNotFound')}
          </AppText>
          <AppButton title={t('back')} variant="secondary" onPress={() => router.back()} />
        </View>
      </AppScreen>
    );
  }

  const isJoined = joinedEventIds.includes(event.id);

  const openMap = () => {
    const coordinates = `${event.coordinates.latitude},${event.coordinates.longitude}`;
    const query = encodeURIComponent(`${event.where[locale]} ${coordinates}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(url);
  };

  return (
    <AppScreen>
      <AppHeader title={t('details')} subtitle={event.where[locale]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <AppText variant="headline" style={styles.title}>
          {event.title[locale]}
        </AppText>
        <AppText variant="body" color="textSecondary">
          {event.where[locale]}
        </AppText>
        <AppText variant="body" color="textMuted" style={styles.date}>
          {formatEventDate(event.whenISO, locale)}
        </AppText>

        <AppCard variant="glass" style={styles.aboutCard}>
          <AppText variant="body">{event.about[locale]}</AppText>
          {event.entryInstructions ? (
            <View style={styles.metaBlock}>
              <AppText variant="caption" color="textMuted">
                {t('entryInstructions')}
              </AppText>
              <AppText variant="body" style={styles.metaValue}>
                {event.entryInstructions[locale]}
              </AppText>
            </View>
          ) : null}
          {event.visibility ? (
            <View style={styles.metaBlock}>
              <AppText variant="caption" color="textMuted">
                {t('eventVisibility')}
              </AppText>
              <AppText variant="body" style={styles.metaValue}>
                {event.visibility === 'private' ? t('privateEvent') : t('publicEvent')}
              </AppText>
            </View>
          ) : null}
          {event.entranceCoordinates ? (
            <View style={styles.metaBlock}>
              <AppText variant="caption" color="textMuted">
                {t('entrancePin')}
              </AppText>
              <AppText variant="body" style={styles.metaValue}>
                {event.entranceCoordinates.latitude.toFixed(5)}, {event.entranceCoordinates.longitude.toFixed(5)}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" color="textSecondary" style={styles.participants}>
            {event.participantCount} {t('participants')}
          </AppText>
        </AppCard>

        <View style={styles.actions}>
          <AppButton title={isJoined ? t('leaveEvent') : t('joinEvent')} variant="glass" onPress={() => toggleJoined(event.id)} />
          <AppButton title={t('openInMaps')} variant="glass" onPress={openMap} />
          <AppButton title={t('back')} variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundTitle: {
    textAlign: 'center',
  },
  title: {
    marginBottom: 6,
  },
  date: {
    marginTop: 2,
    marginBottom: 16,
  },
  aboutCard: {
    marginBottom: 14,
  },
  participants: {
    marginTop: 12,
  },
  metaBlock: {
    marginTop: 12,
  },
  metaValue: {
    marginTop: 2,
  },
  actions: {
    gap: 10,
  },
});
