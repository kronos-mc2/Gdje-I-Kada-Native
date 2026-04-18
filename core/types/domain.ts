export type Locale = 'hr' | 'en';

export type LocalizedText = Record<Locale, string>;

export type EventFilter = 'nearby' | 'joined' | 'created';
export type EventVisibility = 'public' | 'friends';
export type EventAttendanceMode = 'open' | 'waitlist' | 'paid';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished';

export type EventsView = 'list' | 'map';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationConsent = 'unknown' | 'accepted' | 'rejected';
export type LocationSource = 'default' | 'device' | 'capital' | 'ip';

export type AppEvent = {
  id: string;
  creatorUserId?: string;
  title: LocalizedText;
  where: LocalizedText;
  address: string;
  about: LocalizedText;
  whenISO: string;
  startAt: string;
  endAt?: string;
  type: EventFilter;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructions?: LocalizedText;
  visibility?: EventVisibility;
  attendanceMode?: EventAttendanceMode;
  priceAmount?: number;
  priceCurrency?: string;
  capacity?: number;
  status?: EventStatus;
  organizerRatingAverage?: number;
  organizerRatingCount?: number;
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
  address: string;
  aboutHr: string;
  aboutEn: string;
  whenISO: string;
  startAt?: string;
  endAt?: string;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructionsHr?: string;
  entryInstructionsEn?: string;
  visibility?: EventVisibility;
  attendanceMode?: EventAttendanceMode;
  priceAmount?: number;
  priceCurrency?: string;
  capacity?: number;
};
