import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USER_LOCATION } from '@/core/data/mock-data';
import { ThemePreference } from '@/core/theme/types';
import { getAsyncStorage } from '@/core/utils/async-storage';
import {
  Coordinates,
  EventFilter,
  FypFeedFilter,
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
  fypFeedFilter: FypFeedFilter;
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
  setFypFeedFilter: (filter: FypFeedFilter) => void;
};

type PersistedAppStore = Pick<
  AppStore,
  'locale' | 'themePreference' | 'locationConsent' | 'notificationPermissionPrompted' | 'nearbyRadiusKm' | 'fypFeedFilter'
>;

const clampNearbyRadiusKm = (radiusKm: number) => {
  if (!Number.isFinite(radiusKm)) {
    return 10;
  }

  return Math.min(20, Math.max(1, Math.round(radiusKm)));
};

const DEFAULT_FYP_FEED_FILTER: FypFeedFilter = {
  preset: 'forYou',
  locationMode: 'current',
  city: '',
  cityPlaceId: undefined,
  country: '',
  countryPlaceId: undefined,
  attendanceModes: [],
};

const normalizeFypFeedFilter = (filter?: Partial<FypFeedFilter> | null): FypFeedFilter => {
  const locationMode = filter?.locationMode ?? DEFAULT_FYP_FEED_FILTER.locationMode;
  const city = filter?.city ?? DEFAULT_FYP_FEED_FILTER.city;
  const cityPlaceId = filter?.cityPlaceId;
  const country = filter?.country ?? DEFAULT_FYP_FEED_FILTER.country;
  const countryPlaceId = filter?.countryPlaceId;
  const hasSelectedCity = Boolean(city.trim() && cityPlaceId);
  const hasSelectedCountry = Boolean(country.trim() && countryPlaceId);

  if ((locationMode === 'city' && !hasSelectedCity) || (locationMode === 'country' && !hasSelectedCountry)) {
    return {
      ...DEFAULT_FYP_FEED_FILTER,
      preset: filter?.preset ?? DEFAULT_FYP_FEED_FILTER.preset,
      attendanceModes: Array.isArray(filter?.attendanceModes)
        ? filter.attendanceModes
        : DEFAULT_FYP_FEED_FILTER.attendanceModes,
    };
  }

  return {
    preset: filter?.preset ?? DEFAULT_FYP_FEED_FILTER.preset,
    locationMode,
    city,
    cityPlaceId,
    country,
    countryPlaceId,
    attendanceModes: Array.isArray(filter?.attendanceModes)
      ? filter.attendanceModes
      : DEFAULT_FYP_FEED_FILTER.attendanceModes,
  };
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
      fypFeedFilter: DEFAULT_FYP_FEED_FILTER,
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
      setFypFeedFilter: (fypFeedFilter) => {
        set({ fypFeedFilter: normalizeFypFeedFilter(fypFeedFilter) });
      },
    }),
    {
      name: 'gdje-i-kada-app-store',
      version: 6,
      storage: createJSONStorage(() => getAsyncStorage()),
      migrate: (persistedState): PersistedAppStore => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            locale: 'hr',
            themePreference: 'dark',
            locationConsent: 'unknown',
            notificationPermissionPrompted: false,
            nearbyRadiusKm: 10,
            fypFeedFilter: DEFAULT_FYP_FEED_FILTER,
          };
        }

        const state = persistedState as Partial<AppStore>;

        return {
          locale: state.locale ?? 'hr',
          themePreference: state.themePreference ?? 'dark',
          locationConsent: state.locationConsent ?? 'unknown',
          notificationPermissionPrompted: state.notificationPermissionPrompted ?? false,
          nearbyRadiusKm: clampNearbyRadiusKm(state.nearbyRadiusKm ?? 10),
          fypFeedFilter: normalizeFypFeedFilter(state.fypFeedFilter),
        };
      },
      partialize: (state) => ({
        locale: state.locale,
        themePreference: state.themePreference,
        locationConsent: state.locationConsent,
        notificationPermissionPrompted: state.notificationPermissionPrompted,
        nearbyRadiusKm: state.nearbyRadiusKm,
        fypFeedFilter: state.fypFeedFilter,
      }),
    },
  ),
);
