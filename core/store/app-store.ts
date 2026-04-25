import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USER_LOCATION } from '@/core/data/mock-data';
import { ThemePreference } from '@/core/theme/types';
import { getAsyncStorage } from '@/core/utils/async-storage';
import {
  Coordinates,
  EventFilter,
  EventsView,
  Locale,
  LocationConsent,
  LocationSource,
} from '@/core/types/domain';

type AppStore = {
  locale: Locale;
  themePreference: ThemePreference;
  eventFilter: EventFilter;
  eventsView: EventsView;
  searchQuery: string;
  userLocation: Coordinates;
  locationConsent: LocationConsent;
  locationSource: LocationSource;
  fypEntranceCoordinates: Coordinates | null;
  setLocale: (locale: Locale) => void;
  setThemePreference: (themePreference: ThemePreference) => void;
  setEventFilter: (filter: EventFilter) => void;
  setEventsView: (view: EventsView) => void;
  setSearchQuery: (value: string) => void;
  setFypEntranceCoordinates: (coordinates: Coordinates) => void;
  clearFypEntranceCoordinates: () => void;
  setUserLocation: (coordinates: Coordinates) => void;
  setLocationConsent: (consent: LocationConsent) => void;
  setLocationSource: (source: LocationSource) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      locale: 'hr',
      themePreference: 'dark',
      eventFilter: 'nearby',
      eventsView: 'list',
      searchQuery: '',
      userLocation: USER_LOCATION,
      locationConsent: 'unknown',
      locationSource: 'default',
      fypEntranceCoordinates: null,
      setLocale: (locale) => set({ locale }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setEventFilter: (eventFilter) => set({ eventFilter }),
      setEventsView: (eventsView) => set({ eventsView }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFypEntranceCoordinates: (coordinates) => {
        set({ fypEntranceCoordinates: coordinates });
      },
      clearFypEntranceCoordinates: () => {
        set({ fypEntranceCoordinates: null });
      },
      setUserLocation: (coordinates) => {
        set({ userLocation: coordinates });
      },
      setLocationConsent: (locationConsent) => {
        set({ locationConsent });
      },
      setLocationSource: (locationSource) => {
        set({ locationSource });
      },
    }),
    {
      name: 'gdje-i-kada-app-store',
      storage: createJSONStorage(() => getAsyncStorage()),
      partialize: (state) => ({
        locale: state.locale,
        themePreference: state.themePreference,
        locationConsent: state.locationConsent,
        locationSource: state.locationSource,
      }),
    },
  ),
);
