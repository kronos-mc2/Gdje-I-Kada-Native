import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { EventQueryParams } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export type MapDateFilter = 'all' | 'today' | 'tomorrow' | 'weekend';

type UseEventsMapScreenModelInput = {
  dateFilter: MapDateFilter;
  searchQuery: string;
};

const NEARBY_RADIUS_KM = 50;

export function useEventsMapScreenModel({ dateFilter, searchQuery }: UseEventsMapScreenModelInput) {
  const { locale } = useI18n();
  const { userLocation } = useAppStore(
    useShallow((state) => ({
      userLocation: state.userLocation,
    })),
  );
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 280);

  const queryParams = useMemo<EventQueryParams>(() => {
    const dateRange = getDateRange(dateFilter);

    return {
      ...dateRange,
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      radiusKm: NEARBY_RADIUS_KM,
      query: debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined,
    };
  }, [dateFilter, debouncedSearchQuery, userLocation.latitude, userLocation.longitude]);

  const { data: fetchedEvents = [] } = useEventsQuery(queryParams);

  return {
    locale,
    userLocation,
    events: fetchedEvents,
  };
}

function getDateRange(dateFilter: MapDateFilter): Pick<EventQueryParams, 'from' | 'to'> {
  if (dateFilter === 'all') {
    return {};
  }

  const todayStart = startOfLocalDay(new Date());

  if (dateFilter === 'today') {
    const tomorrowStart = addDays(todayStart, 1);
    return toIsoRange(todayStart, tomorrowStart);
  }

  if (dateFilter === 'tomorrow') {
    const tomorrowStart = addDays(todayStart, 1);
    const dayAfterTomorrowStart = addDays(todayStart, 2);
    return toIsoRange(tomorrowStart, dayAfterTomorrowStart);
  }

  const currentDay = todayStart.getDay();
  const daysUntilSaturday = currentDay === 0 ? -1 : (6 - currentDay + 7) % 7;
  const saturdayStart = addDays(todayStart, daysUntilSaturday);
  const mondayStart = addDays(saturdayStart, 2);
  return toIsoRange(saturdayStart, mondayStart);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toIsoRange(from: Date, to: Date) {
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
