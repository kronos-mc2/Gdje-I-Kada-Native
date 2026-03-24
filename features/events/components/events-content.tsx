import { RefreshControl, ScrollView, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { EventCard } from '@/components/events/event-card';
import { EventsMap } from '@/components/events/events-map';
import { useI18n } from '@/core/i18n/use-i18n';
import { Coordinates, EventsView, Locale } from '@/core/types/domain';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';

type EventsWithDistance = {
  event: AppEvent;
  distanceKm: number;
};

type EventsContentProps = {
  view: EventsView;
  locale: Locale;
  userLocation: Coordinates;
  events: EventsWithDistance[];
  showDistance: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => Promise<unknown>;
  onEventPress: (eventId: string) => void;
};

export function EventsContent({
  view,
  locale,
  userLocation,
  events,
  showDistance,
  isLoading,
  isRefetching,
  onRefresh,
  onEventPress,
}: EventsContentProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  if (view === 'map') {
    return (
      <View style={{ flex: 1 }}>
        <EventsMap
          events={events.map(({ event }) => event)}
          locale={locale}
          userLocation={userLocation}
          onEventPress={onEventPress}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void onRefresh()} tintColor={theme.colors.textSecondary} />}
      showsVerticalScrollIndicator={false}
    >
      {isLoading ? (
        <AppText color="textMuted" style={{ textAlign: 'center', marginTop: 24, marginBottom: 8 }}>
          {t('loading')}
        </AppText>
      ) : null}

      {!isLoading && events.length === 0 ? (
        <AppText color="textMuted" style={{ textAlign: 'center', marginTop: 24, marginBottom: 8 }}>
          {t('noEvents')}
        </AppText>
      ) : null}

      {events.map(({ event, distanceKm }) => (
        <EventCard
          key={event.id}
          event={event}
          locale={locale}
          distanceKm={showDistance ? distanceKm : undefined}
          onPress={() => onEventPress(event.id)}
        />
      ))}
    </ScrollView>
  );
}
