export const queryKeys = {
  eventsRoot: ['events'] as const,
  events: (params?: unknown) => ['events', params ?? {}] as const,
  event: (eventId: string) => ['event', eventId] as const,
  myEventsRoot: ['my-events'] as const,
  myEvents: (filter: string) => ['my-events', filter] as const,
  feedRoot: ['feed'] as const,
  feed: (limit: number) => ['feed', { limit }] as const,
  likedEventsRoot: ['liked-events'] as const,
  likedEvents: ['liked-events'] as const,
  friends: ['friends'] as const,
  conversations: ['conversations'] as const,
  locationSearch: (query: string, locale: string) => ['location-search', locale, query] as const,
};
