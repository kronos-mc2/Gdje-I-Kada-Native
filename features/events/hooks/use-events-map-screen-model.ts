import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';

export function useEventsMapScreenModel() {
  const { locale } = useI18n();
  const { data: fetchedEvents = [] } = useEventsQuery();

  const { createdEvents, userLocation } = useAppStore(
    useShallow((state) => ({
      createdEvents: state.createdEvents,
      userLocation: state.userLocation,
    })),
  );

  const events = useMemo(
    () =>
      [...createdEvents, ...fetchedEvents].sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime()),
    [createdEvents, fetchedEvents],
  );

  return {
    locale,
    userLocation,
    events,
  };
}
