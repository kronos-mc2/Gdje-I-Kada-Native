import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USER_LOCATION } from '@/core/data/mock-data';
import { ThemePreference } from '@/core/theme/types';
import { AppEvent, Coordinates, EventFilter, EventVisibility, EventsView, Locale, UserProfile } from '@/core/types/domain';

export type CreateEventInput = {
  titleHr: string;
  titleEn: string;
  whereHr: string;
  whereEn: string;
  aboutHr: string;
  aboutEn: string;
  whenISO: string;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructionsHr?: string;
  entryInstructionsEn?: string;
  visibility?: EventVisibility;
};

type AppStore = {
  locale: Locale;
  themePreference: ThemePreference;
  eventFilter: EventFilter;
  eventsView: EventsView;
  searchQuery: string;
  joinedEventIds: string[];
  createdEvents: AppEvent[];
  userLocation: Coordinates;
  userProfile: UserProfile | null;
  fypEntranceCoordinates: Coordinates | null;
  setLocale: (locale: Locale) => void;
  setThemePreference: (themePreference: ThemePreference) => void;
  setEventFilter: (filter: EventFilter) => void;
  setEventsView: (view: EventsView) => void;
  setSearchQuery: (value: string) => void;
  toggleJoined: (eventId: string) => void;
  createEvent: (payload: CreateEventInput) => void;
  setFypEntranceCoordinates: (coordinates: Coordinates) => void;
  clearFypEntranceCoordinates: () => void;
  signInDemoUser: () => void;
  signOut: () => void;
};

const createEventEntity = (payload: CreateEventInput): AppEvent => ({
  id: `created-${Date.now()}`,
  title: { hr: payload.titleHr, en: payload.titleEn },
  where: { hr: payload.whereHr, en: payload.whereEn },
  about: { hr: payload.aboutHr, en: payload.aboutEn },
  whenISO: payload.whenISO,
  type: 'created',
  coordinates: payload.coordinates,
  entranceCoordinates: payload.entranceCoordinates,
  entryInstructions:
    payload.entryInstructionsHr && payload.entryInstructionsEn
      ? { hr: payload.entryInstructionsHr, en: payload.entryInstructionsEn }
      : undefined,
  visibility: payload.visibility ?? 'public',
  participantCount: 1,
});

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      locale: 'hr',
      themePreference: 'dark',
      eventFilter: 'nearby',
      eventsView: 'list',
      searchQuery: '',
      joinedEventIds: ['2'],
      createdEvents: [],
      userLocation: USER_LOCATION,
      userProfile: null,
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
      createEvent: (payload) => {
        const event = createEventEntity(payload);

        set((state) => ({
          createdEvents: [event, ...state.createdEvents],
        }));
      },
      setFypEntranceCoordinates: (coordinates) => {
        set({ fypEntranceCoordinates: coordinates });
      },
      clearFypEntranceCoordinates: () => {
        set({ fypEntranceCoordinates: null });
      },
      signInDemoUser: () => {
        set({
          userProfile: {
            name: 'Demo User',
            email: 'demo@gdjeikada.app',
          },
        });
      },
      signOut: () => {
        set({ userProfile: null });
      },
    }),
    {
      name: 'gdje-i-kada-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        themePreference: state.themePreference,
        joinedEventIds: state.joinedEventIds,
        createdEvents: state.createdEvents,
        userProfile: state.userProfile,
      }),
    },
  ),
);
