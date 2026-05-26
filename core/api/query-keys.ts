export const queryKeys = {
  eventsRoot: ['events'] as const,
  events: (params?: unknown) => ['events', params ?? {}] as const,
  event: (eventId: string) => ['event', eventId] as const,
  myEventsRoot: ['my-events'] as const,
  myEvents: (filter: string) => ['my-events', filter] as const,
  feedRoot: ['feed'] as const,
  feed: (limit: number, seed?: string) => ['feed', { limit, seed: seed ?? '' }] as const,
  likedEventsRoot: ['liked-events'] as const,
  likedEvents: ['liked-events'] as const,
  feedPreferences: ['feed-preferences'] as const,
  userUpcomingEvents: (userId: string) => ['user-upcoming-events', userId] as const,
  eventParticipants: (eventId: string) => ['event-participants', eventId] as const,
  profileActivity: ['profile-activity'] as const,
  transactions: ['transactions'] as const,
  notificationPreferences: ['notification-preferences'] as const,
  friends: ['friends'] as const,
  eventShareRecipients: (eventId: string) => ['event-share-recipients', eventId] as const,
  conversations: ['conversations'] as const,
  chatRoomsRoot: ['chat-rooms'] as const,
  chatRooms: (query?: string) => ['chat-rooms', { query: query ?? '' }] as const,
  chatRoomRoot: ['chat-room'] as const,
  chatRoom: (roomId: string) => ['chat-room', roomId] as const,
  chatMessagesRoot: ['chat-messages'] as const,
  chatMessages: (roomId: string) => ['chat-messages', roomId] as const,
  chatPeople: (query?: string) => ['chat-people', { query: query ?? '' }] as const,
  locationSearch: (query: string, locale: string, proximity?: { latitude: number; longitude: number } | null) =>
    [
      'location-search',
      locale,
      query,
      proximity
        ? {
            latitude: Number(proximity.latitude.toFixed(3)),
            longitude: Number(proximity.longitude.toFixed(3)),
          }
        : null,
    ] as const,
};
