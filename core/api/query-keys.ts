export const queryKeys = {
  eventsRoot: ['events'] as const,
  events: (params?: unknown) => ['events', params ?? {}] as const,
  event: (eventId: string) => ['event', eventId] as const,
  myEventsRoot: ['my-events'] as const,
  myEvents: (filter: string) => ['my-events', filter] as const,
  feed: ['feed'] as const,
  friends: ['friends'] as const,
  conversations: ['conversations'] as const,
  locationSearch: (query: string, locale: string) => ['location-search', locale, query] as const,
};
