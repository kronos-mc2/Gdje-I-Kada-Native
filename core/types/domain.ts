export type Locale = 'hr' | 'en';

export type LocalizedText = Record<Locale, string>;

export type EventFilter = 'nearby' | 'joined' | 'created';
export type EventVisibility = 'public' | 'private';

export type EventsView = 'list' | 'map';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

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
