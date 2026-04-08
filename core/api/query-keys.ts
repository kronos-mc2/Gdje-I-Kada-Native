export const queryKeys = {
  events: ['events'] as const,
  feed: ['feed'] as const,
  friends: ['friends'] as const,
  conversations: ['conversations'] as const,
  locationSearch: (query: string, locale: string) => ['location-search', locale, query] as const,
};
