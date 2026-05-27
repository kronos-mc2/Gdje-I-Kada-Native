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
  notificationPermissionPrompted: boolean;
  nearbyRadiusKm: number;
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
  setNotificationPermissionPrompted: (prompted: boolean) => void;
  setNearbyRadiusKm: (radiusKm: number) => void;
};

type PersistedAppStore = Pick<
  AppStore,
  'locale' | 'themePreference' | 'locationConsent' | 'notificationPermissionPrompted' | 'nearbyRadiusKm'
>;

const clampNearbyRadiusKm = (radiusKm: number) => {
  if (!Number.isFinite(radiusKm)) {
    return 10;
  }

  return Math.min(20, Math.max(1, Math.round(radiusKm)));
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
      notificationPermissionPrompted: false,
      nearbyRadiusKm: 10,
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
      setNotificationPermissionPrompted: (notificationPermissionPrompted) => {
        set({ notificationPermissionPrompted });
      },
      setNearbyRadiusKm: (nearbyRadiusKm) => {
        set({ nearbyRadiusKm: clampNearbyRadiusKm(nearbyRadiusKm) });
      },
    }),
    {
      name: 'gdje-i-kada-app-store',
      version: 4,
      storage: createJSONStorage(() => getAsyncStorage()),
      migrate: (persistedState): PersistedAppStore => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            locale: 'hr',
            themePreference: 'dark',
            locationConsent: 'unknown',
            notificationPermissionPrompted: false,
            nearbyRadiusKm: 10,
          };
        }

        const state = persistedState as Partial<AppStore>;

        return {
          locale: state.locale ?? 'hr',
          themePreference: state.themePreference ?? 'dark',
          locationConsent: state.locationConsent ?? 'unknown',
          notificationPermissionPrompted: state.notificationPermissionPrompted ?? false,
          nearbyRadiusKm: clampNearbyRadiusKm(state.nearbyRadiusKm ?? 10),
        };
      },
      partialize: (state) => ({
        locale: state.locale,
        themePreference: state.themePreference,
        locationConsent: state.locationConsent,
        notificationPermissionPrompted: state.notificationPermissionPrompted,
        nearbyRadiusKm: state.nearbyRadiusKm,
      }),
    },
  ),
);
