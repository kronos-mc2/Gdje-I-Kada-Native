import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { EventCard } from '@/components/events/event-card';
import { useI18n } from '@/core/i18n/use-i18n';
import { Coordinates, EventAttendanceMode, EventsView, Locale } from '@/core/types/domain';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { EventsMapExperience } from '@/features/events/components/events-map-experience';
import { createInitialMapDateFilter, MapDateFilter, MapQuickFilter, toDateKey } from '@/features/events/hooks/use-events-map-screen-model';

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
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [dateFilter, setDateFilter] = useState<MapDateFilter>(() => createInitialMapDateFilter());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attendanceModes, setAttendanceModes] = useState<EventAttendanceMode[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<MapQuickFilter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (view === 'map') {
    return (
      <View style={{ flex: 1 }}>
        <EventsMapExperience
          events={events.map(({ event }) => event)}
          locale={locale}
          userLocation={userLocation}
          dateFilter={dateFilter}
          selectedTags={selectedTags}
          attendanceModes={attendanceModes}
          activeQuickFilter={activeQuickFilter}
          searchQuery={searchQuery}
          onDateFilterChange={(nextDateFilter) => {
            setDateFilter(nextDateFilter);
            setActiveQuickFilter(null);
          }}
          onSelectedTagsChange={(nextTags) => {
            setSelectedTags(nextTags);
            setActiveQuickFilter(null);
          }}
          onClearFilters={() => {
            setDateFilter(createInitialMapDateFilter());
            setSelectedTags([]);
            setAttendanceModes([]);
            setActiveQuickFilter(null);
          }}
          onQuickFilterPress={(quickFilter) => {
            const nextFilters = getQuickFilterState(quickFilter);
            setDateFilter(nextFilters.dateFilter);
            setSelectedTags([]);
            setAttendanceModes(nextFilters.attendanceModes);
            setActiveQuickFilter(quickFilter);
          }}
          onSearchQueryChange={setSearchQuery}
          onCreateEventPress={() => router.push('/create-event')}
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

function getQuickFilterState(filter: MapQuickFilter): { dateFilter: MapDateFilter; attendanceModes: EventAttendanceMode[] } {
  switch (filter) {
    case 'today':
      return { dateFilter: { mode: 'day', dateISO: toDateKey(new Date()) }, attendanceModes: [] };
    case 'thisWeek':
      return {
        dateFilter: { mode: 'range', fromISO: toDateKey(new Date()), toISO: toDateKey(addDays(new Date(), 6)) },
        attendanceModes: [],
      };
    case 'free':
      return { dateFilter: createInitialMapDateFilter(), attendanceModes: ['open'] };
    case 'paid':
      return { dateFilter: createInitialMapDateFilter(), attendanceModes: ['paid'] };
    case 'waitlist':
      return { dateFilter: createInitialMapDateFilter(), attendanceModes: ['waitlist'] };
    case 'weekend':
      return { dateFilter: getUpcomingWeekendFilter(), attendanceModes: [] };
  }
}

function getUpcomingWeekendFilter(): MapDateFilter {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = addDays(today, daysUntilSaturday);
  return {
    mode: 'range',
    fromISO: toDateKey(saturday),
    toISO: toDateKey(addDays(saturday, 1)),
  };
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
