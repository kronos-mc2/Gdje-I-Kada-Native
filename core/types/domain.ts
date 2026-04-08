export type Locale = 'hr' | 'en';

export type LocalizedText = Record<Locale, string>;

export type EventFilter = 'nearby' | 'joined' | 'created';
export type EventVisibility = 'public' | 'private';

export type EventsView = 'list' | 'map';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationConsent = 'unknown' | 'accepted' | 'rejected';
export type LocationSource = 'default' | 'device' | 'capital' | 'ip';

export type AppEvent = {
  id: string;
  title: LocalizedText;
  where: LocalizedText;
  about: LocalizedText;
  whenISO: string;
  type: EventFilter;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructions?: LocalizedText;
  visibility?: EventVisibility;
  participantCount: number;
};

export type Friend = {
  id: string;
  name: string;
  status: LocalizedText;
};

export type Conversation = {
  id: string;
  contact: string;
  lastMessage: LocalizedText;
  timeLabel: string;
};

export type UserProfile = {
  name: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: UserProfile;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type CreateEventPayload = {
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
