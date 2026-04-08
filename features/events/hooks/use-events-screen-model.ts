import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { selectEvents } from '@/core/events/select-events';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { getDistanceKm } from '@/core/utils/location';

export function useEventsScreenModel() {
  const router = useRouter();
  const { locale } = useI18n();
  const { data: fetchedEvents = [], refetch, isRefetching, isLoading } = useEventsQuery();

  const { eventFilter, eventsView, searchQuery, joinedEventIds, userLocation } = useAppStore(
    useShallow((state) => ({
      eventFilter: state.eventFilter,
      eventsView: state.eventsView,
      searchQuery: state.searchQuery,
      joinedEventIds: state.joinedEventIds,
      userLocation: state.userLocation,
    })),
  );

  const setEventFilter = useAppStore((state) => state.setEventFilter);
  const setEventsView = useAppStore((state) => state.setEventsView);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

  const selectedEvents = useMemo(
    () =>
      selectEvents({
        allEvents: fetchedEvents,
        filter: eventFilter,
        searchQuery,
        locale,
        joinedEventIds,
      }),
    [fetchedEvents, eventFilter, searchQuery, locale, joinedEventIds],
  );

  const eventsForRender = useMemo(() => {
    const withDistance = selectedEvents.map((event) => ({
      event,
      distanceKm: getDistanceKm(userLocation, event.coordinates),
    }));

    if (eventFilter === 'nearby') {
      return withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return withDistance.sort((a, b) => new Date(a.event.whenISO).getTime() - new Date(b.event.whenISO).getTime());
  }, [selectedEvents, userLocation, eventFilter]);

  const openEventDetails = (id: string) => {
    router.push({ pathname: '/event/[id]', params: { id } });
  };

  return {
    eventFilter,
    eventsView,
    searchQuery,
    eventsForRender,
    userLocation,
    isLoading,
    isRefetching,
    refetch,
    setEventFilter,
    setEventsView,
    setSearchQuery,
    openEventDetails,
    locale,
  };
}
