import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { EventQueryParams } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export type MapDateFilter =
  | { mode: 'all' }
  | { mode: 'day'; dateISO: string }
  | { mode: 'range'; fromISO: string; toISO: string };

type UseEventsMapScreenModelInput = {
  dateFilter: MapDateFilter;
  searchQuery: string;
};

const NEARBY_RADIUS_KM = 50;

export function createInitialMapDateFilter(): MapDateFilter {
  return { mode: 'all' };
}

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

export function getDateRange(dateFilter: MapDateFilter): Pick<EventQueryParams, 'from' | 'to'> {
  if (dateFilter.mode === 'all') {
    return {};
  }

  if (dateFilter.mode === 'day') {
    const dayStart = dateKeyToLocalDate(dateFilter.dateISO);
    return toIsoRange(dayStart, addDays(dayStart, 1));
  }

  const fromStart = dateKeyToLocalDate(dateFilter.fromISO);
  const toStart = dateKeyToLocalDate(dateFilter.toISO);
  const [from, to] = fromStart.getTime() <= toStart.getTime() ? [fromStart, toStart] : [toStart, fromStart];
  return toIsoRange(from, addDays(to, 1));
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateKeyToLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
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
