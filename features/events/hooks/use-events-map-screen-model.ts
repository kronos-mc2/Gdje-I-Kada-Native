import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';

export function useEventsMapScreenModel() {
  const { locale } = useI18n();
  const { data: fetchedEvents = [] } = useEventsQuery();

  const { userLocation } = useAppStore(
    useShallow((state) => ({
      userLocation: state.userLocation,
    })),
  );

  const events = useMemo(
    () => [...fetchedEvents].sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime()),
    [fetchedEvents],
  );

  return {
    locale,
    userLocation,
    events,
  };
}
