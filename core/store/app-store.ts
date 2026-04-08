import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USER_LOCATION } from '@/core/data/mock-data';
import { ThemePreference } from '@/core/theme/types';
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
  joinedEventIds: string[];
  likedEventIds: string[];
  favoriteEventIds: string[];
  userLocation: Coordinates;
  locationConsent: LocationConsent;
  locationSource: LocationSource;
  fypEntranceCoordinates: Coordinates | null;
  setLocale: (locale: Locale) => void;
  setThemePreference: (themePreference: ThemePreference) => void;
  setEventFilter: (filter: EventFilter) => void;
  setEventsView: (view: EventsView) => void;
  setSearchQuery: (value: string) => void;
  toggleJoined: (eventId: string) => void;
  toggleLiked: (eventId: string) => void;
  toggleFavorite: (eventId: string) => void;
  setFypEntranceCoordinates: (coordinates: Coordinates) => void;
  clearFypEntranceCoordinates: () => void;
  setUserLocation: (coordinates: Coordinates) => void;
  setLocationConsent: (consent: LocationConsent) => void;
  setLocationSource: (source: LocationSource) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      locale: 'hr',
      themePreference: 'dark',
      eventFilter: 'nearby',
      eventsView: 'list',
      searchQuery: '',
      joinedEventIds: ['2'],
      likedEventIds: [],
      favoriteEventIds: [],
      userLocation: USER_LOCATION,
      locationConsent: 'unknown',
      locationSource: 'default',
      fypEntranceCoordinates: null,
      setLocale: (locale) => set({ locale }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setEventFilter: (eventFilter) => set({ eventFilter }),
      setEventsView: (eventsView) => set({ eventsView }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      toggleJoined: (eventId) => {
        const isAlreadyJoined = get().joinedEventIds.includes(eventId);

        set((state) => ({
          joinedEventIds: isAlreadyJoined
            ? state.joinedEventIds.filter((id) => id !== eventId)
            : [eventId, ...state.joinedEventIds],
        }));
      },
      toggleLiked: (eventId) => {
        const isLiked = get().likedEventIds.includes(eventId);

        set((state) => ({
          likedEventIds: isLiked ? state.likedEventIds.filter((id) => id !== eventId) : [eventId, ...state.likedEventIds],
        }));
      },
      toggleFavorite: (eventId) => {
        const isFavorite = get().favoriteEventIds.includes(eventId);

        set((state) => ({
          favoriteEventIds: isFavorite ? state.favoriteEventIds.filter((id) => id !== eventId) : [eventId, ...state.favoriteEventIds],
        }));
      },
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        themePreference: state.themePreference,
        joinedEventIds: state.joinedEventIds,
        likedEventIds: state.likedEventIds,
        favoriteEventIds: state.favoriteEventIds,
        locationConsent: state.locationConsent,
        locationSource: state.locationSource,
      }),
    },
  ),
);
