import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StyleSheet, View } from 'react-native';

import { EventDetailsContent } from '@/features/events/components/event-details-content';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { useEventJoinActions } from '@/features/events/hooks/use-event-join-actions';
import { AppButton, AppCard, AppHeader, AppScreen, AppText } from '@/components/primitives';
import { useEventQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useState } from 'react';

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = params.id;
  const { t, locale } = useI18n();
  const { data: event, isLoading } = useEventQuery(eventId);
  const { isJoined, isJoinDisabled, joinButtonTitle, onToggleJoin } = useEventJoinActions(event);
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!event && !isLoading) {
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

  const openMap = async () => {
    if (!event) {
      return;
    }

    const coordinates = `${event.coordinates.latitude},${event.coordinates.longitude}`;
    const query = encodeURIComponent(`${event.where[locale]} ${coordinates}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  return (
    <AppScreen scroll>
      <AppHeader title={t('details')} subtitle={event ? event.where[locale] : t('details')} />

      {event ? (
        <>
          <AppCard variant="glass" style={styles.detailsCard}>
            <EventDetailsContent
              event={event}
              locale={locale}
              isJoined={isJoined}
              isJoinDisabled={isJoinDisabled}
              joinButtonTitle={joinButtonTitle}
              onToggleJoin={onToggleJoin}
            />
          </AppCard>

          <View style={styles.actions}>
            <AppButton title={t('openInMaps')} variant="glass" onPress={() => void openMap()} />
            <AppButton title={t('shares')} variant="glass" onPress={() => setIsShareOpen(true)} />
            <AppButton title={t('back')} variant="secondary" onPress={() => router.back()} />
          </View>

          <EventShareModal event={event} visible={isShareOpen} locale={locale} onClose={() => setIsShareOpen(false)} />
        </>
      ) : (
        <AppCard variant="glass">
          <AppText color="textMuted">...</AppText>
        </AppCard>
      )}
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
  detailsCard: {
    marginBottom: 14,
  },
  actions: {
    gap: 10,
  },
});
