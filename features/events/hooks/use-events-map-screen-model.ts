import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import type { AppEvent, EventQueryParams } from '@/core/types/domain';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export type MapDateFilter =
  | { mode: 'all' }
  | { mode: 'day'; dateISO: string }
  | { mode: 'range'; fromISO: string; toISO: string };

type UseEventsMapScreenModelInput = {
  dateFilter: MapDateFilter;
  searchQuery: string;
  viewport?: MapEventViewport | null;
};

const NEARBY_RADIUS_KM = 50;
const MAP_QUERY_DEBOUNCE_MS = 900;
const MAP_REFETCH_INTERVAL_MS = 60_000;
const MAP_QUERY_STALE_MS = 30_000;
const MIN_FETCH_MOVE_KM = 30;
const MAX_FETCH_MOVE_KM = 180;
const FETCH_RADIUS_CHANGE_RATIO = 1.6;
const MIN_EVENT_RETENTION_RADIUS_KM = 70;
const EVENT_RETENTION_RADIUS_MULTIPLIER = 2.2;

export type MapEventViewport = {
  latitude: number;
  longitude: number;
  radiusKm: number;
};

export function createInitialMapDateFilter(): MapDateFilter {
  return { mode: 'all' };
}

export function useEventsMapScreenModel({ dateFilter, searchQuery, viewport }: UseEventsMapScreenModelInput) {
  const { locale } = useI18n();
  const { userLocation } = useAppStore(
    useShallow((state) => ({
      userLocation: state.userLocation,
    })),
  );
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 280);
  const debouncedViewport = useDebouncedValue(viewport, MAP_QUERY_DEBOUNCE_MS);
  const currentQueryCenter = useMemo(
    () =>
      debouncedViewport ?? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: NEARBY_RADIUS_KM,
      },
    [debouncedViewport, userLocation.latitude, userLocation.longitude],
  );
  const filterKey = useMemo(() => {
    const dateRange = getDateRange(dateFilter);
    const query = debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : '';
    return `${dateRange.from ?? ''}:${dateRange.to ?? ''}:${query}`;
  }, [dateFilter, debouncedSearchQuery]);
  const previousFilterKeyRef = useRef(filterKey);
  const [fetchViewport, setFetchViewport] = useState<MapEventViewport>(currentQueryCenter);
  const [visibleEvents, setVisibleEvents] = useState(() => new Map<string, AppEvent>());

  useEffect(() => {
    const filtersChanged = previousFilterKeyRef.current !== filterKey;
    if (filtersChanged) {
      previousFilterKeyRef.current = filterKey;
      setVisibleEvents(new Map());
      setFetchViewport(currentQueryCenter);
      return;
    }

    setFetchViewport((current) => (shouldFetchForViewportChange(current, currentQueryCenter) ? currentQueryCenter : current));
  }, [currentQueryCenter, filterKey]);

  useEffect(() => {
    setVisibleEvents((current) => pruneEventsForViewport(current, currentQueryCenter));
  }, [currentQueryCenter]);

  const queryParams = useMemo<EventQueryParams>(() => {
    const dateRange = getDateRange(dateFilter);
    return {
      ...dateRange,
      lat: fetchViewport.latitude,
      lng: fetchViewport.longitude,
      radiusKm: fetchViewport.radiusKm,
      query: debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined,
    };
  }, [dateFilter, debouncedSearchQuery, fetchViewport]);

  const { data: fetchedEvents, dataUpdatedAt } = useEventsQuery(queryParams, {
    refetchInterval: MAP_REFETCH_INTERVAL_MS,
    staleTime: MAP_QUERY_STALE_MS,
  });

  useEffect(() => {
    if (!fetchedEvents || dataUpdatedAt === 0) {
      return;
    }

    setVisibleEvents((current) => mergeEventsForViewport(current, fetchedEvents, currentQueryCenter));
  }, [currentQueryCenter, dataUpdatedAt, fetchedEvents]);

  return {
    locale,
    userLocation,
    events: Array.from(visibleEvents.values()),
  };
}

export function getDateRange(dateFilter: MapDateFilter): Pick<EventQueryParams, 'from' | 'to'> {
  if (dateFilter.mode === 'all') {
    return { from: new Date().toISOString() };
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

function shouldFetchForViewportChange(previous: MapEventViewport, next: MapEventViewport) {
  const movedKm = distanceKm(previous.latitude, previous.longitude, next.latitude, next.longitude);
  const moveThresholdKm = Math.min(
    MAX_FETCH_MOVE_KM,
    Math.max(MIN_FETCH_MOVE_KM, Math.max(previous.radiusKm, next.radiusKm) * 0.65),
  );
  const radiusRatio = previous.radiusKm > 0 ? next.radiusKm / previous.radiusKm : 1;

  return movedKm >= moveThresholdKm || radiusRatio >= FETCH_RADIUS_CHANGE_RATIO || radiusRatio <= 1 / FETCH_RADIUS_CHANGE_RATIO;
}

function mergeEventsForViewport(
  current: Map<string, AppEvent>,
  fetchedEvents: AppEvent[],
  viewport: MapEventViewport,
) {
  const next = new Map(current);
  for (const event of fetchedEvents) {
    next.set(event.id, event);
  }

  return pruneEventsForViewport(next, viewport);
}

function pruneEventsForViewport(current: Map<string, AppEvent>, viewport: MapEventViewport) {
  const retentionRadiusKm = Math.max(MIN_EVENT_RETENTION_RADIUS_KM, viewport.radiusKm * EVENT_RETENTION_RADIUS_MULTIPLIER);
  let changed = false;
  const next = new Map(current);

  for (const [eventId, event] of current) {
    const distanceFromViewportKm = distanceKm(
      viewport.latitude,
      viewport.longitude,
      event.coordinates.latitude,
      event.coordinates.longitude,
    );

    if (distanceFromViewportKm > retentionRadiusKm) {
      next.delete(eventId);
      changed = true;
    }
  }

  return changed ? next : current;
}

function distanceKm(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
