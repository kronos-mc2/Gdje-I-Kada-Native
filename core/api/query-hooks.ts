import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import {
  confirmTicketCheckout,
  addEventMedia,
  approveEventParticipant,
  blockEventParticipant,
  createChatPoll,
  createChatRoom,
  createEvent,
  createFeedPreference,
  createFriendRequest,
  createTicketCheckout,
  deleteFeedPreference,
  deleteEvent,
  deleteEventMedia,
  fetchChatMessages,
  fetchChatPeople,
  fetchChatRoom,
  fetchChatRooms,
  fetchEventById,
  fetchEventParticipants,
  fetchConversations,
  fetchEvents,
  fetchFeed,
  fetchFeedPreferences,
  fetchLikedEvents,
  fetchFriends,
  fetchMyEvents,
  fetchNotificationPreferences,
  fetchProfileActivity,
  fetchTransactions,
  fetchUserUpcomingEvents,
  getOrCreateEventChatRoom,
  joinEvent,
  likeEvent,
  leaveEvent,
  rateOrganizer,
  rateEvent,
  respondToFriendRequest,
  removeEventParticipant,
  registerPushToken,
  sendChatMessage,
  shareEventToConversation,
  unlikeEvent,
  updateNotificationPreferences,
  updateProfile,
  updateEvent,
  updateChatNotificationSettings,
  updateChatRoom,
  votePoll,
} from '@/core/api/services';
import { AppEvent, ChatRoomDetail, EventQueryParams, FeedPage, MyEventsFilter, Poll, UserProfile } from '@/core/types/domain';
import { useAuthStore } from '@/core/store/auth-store';

export const CHAT_PEOPLE_SEARCH_MIN_LENGTH = 2;

export const useEventsQuery = (params?: EventQueryParams) =>
  useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => fetchEvents(params),
  });

export const useEventQuery = (eventId?: string | null, initialData?: AppEvent) =>
  useQuery({
    queryKey: queryKeys.event(eventId ?? ''),
    queryFn: () => fetchEventById(eventId ?? ''),
    enabled: Boolean(eventId),
    placeholderData: initialData,
  });

export const useMyEventsQuery = (filter: MyEventsFilter = 'all') =>
  useQuery({
    queryKey: queryKeys.myEvents(filter),
    queryFn: () => fetchMyEvents(filter),
  });

export const useLikedEventsQuery = () =>
  useQuery({
    queryKey: queryKeys.likedEvents,
    queryFn: fetchLikedEvents,
  });

export const useFeedPreferencesQuery = () =>
  useQuery({
    queryKey: queryKeys.feedPreferences,
    queryFn: fetchFeedPreferences,
  });

export const useUserUpcomingEventsQuery = (userId?: string | null) =>
  useQuery({
    queryKey: queryKeys.userUpcomingEvents(userId ?? ''),
    queryFn: () => fetchUserUpcomingEvents(userId ?? ''),
    enabled: Boolean(userId),
  });

export const useEventParticipantsQuery = (eventId?: string | null) =>
  useQuery({
    queryKey: queryKeys.eventParticipants(eventId ?? ''),
    queryFn: () => fetchEventParticipants(eventId ?? ''),
    enabled: Boolean(eventId),
  });

export const useProfileActivityQuery = () =>
  useQuery({
    queryKey: queryKeys.profileActivity,
    queryFn: fetchProfileActivity,
  });

export const useTransactionsQuery = () =>
  useQuery({
    queryKey: queryKeys.transactions,
    queryFn: fetchTransactions,
  });

export const useNotificationPreferencesQuery = () =>
  useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: fetchNotificationPreferences,
  });

export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, preferences);
    },
  });
};

export const useRegisterPushTokenMutation = () =>
  useMutation({
    mutationFn: registerPushToken,
  });

export const useFeedInfiniteQuery = (limit = 5) =>
  useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage, string | undefined>,
    ReturnType<typeof queryKeys.feed>,
    string | undefined
  >({
    queryKey: queryKeys.feed(limit),
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam, limit }),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
  });

export const useFriendsQuery = () =>
  useQuery({
    queryKey: queryKeys.friends,
    queryFn: fetchFriends,
  });

export const useConversationsQuery = () =>
  useQuery({
    queryKey: queryKeys.conversations,
    queryFn: fetchConversations,
  });

export const useChatRoomsQuery = (query?: string) =>
  useQuery({
    queryKey: queryKeys.chatRooms(query),
    queryFn: () => fetchChatRooms(query),
  });

export const useChatRoomQuery = (roomId?: string | null) =>
  useQuery({
    queryKey: queryKeys.chatRoom(roomId ?? ''),
    queryFn: () => fetchChatRoom(roomId ?? ''),
    enabled: Boolean(roomId),
  });

export const useChatMessagesQuery = (roomId?: string | null) =>
  useQuery({
    queryKey: queryKeys.chatMessages(roomId ?? ''),
    queryFn: () => fetchChatMessages(roomId ?? ''),
    enabled: Boolean(roomId),
  });

export const useChatPeopleQuery = (query?: string) => {
  const normalizedQuery = query?.trim() ?? '';

  return useQuery({
    queryKey: queryKeys.chatPeople(normalizedQuery),
    queryFn: () => fetchChatPeople(normalizedQuery),
    enabled: normalizedQuery.length >= CHAT_PEOPLE_SEARCH_MIN_LENGTH,
  });
};

export const useCreateChatRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      queryClient.setQueryData<ChatRoomDetail | undefined>(queryKeys.chatRoom(room.id), (current) =>
        current ? { ...current, room } : current,
      );
    },
  });
};

export const useCreateFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFriendRequest,
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      if (request.chatRoomId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(request.chatRoomId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(request.chatRoomId) });
      }
    },
  });
};

export const useRespondFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondToFriendRequest,
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends });
      if (request.chatRoomId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(request.chatRoomId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(request.chatRoomId) });
      }
    },
  });
};

export const useGetOrCreateEventChatRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateEventChatRoom,
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      queryClient.setQueryData<ChatRoomDetail | undefined>(queryKeys.chatRoom(room.id), (current) =>
        current ? { ...current, room } : current,
      );
    },
  });
};

export const useUpdateChatRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatRoom,
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(room.id) });
    },
  });
};

export const useUpdateChatNotificationSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatNotificationSettings,
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      queryClient.setQueryData<ChatRoomDetail | undefined>(queryKeys.chatRoom(room.id), (current) =>
        current ? { ...current, room } : current,
      );
    },
  });
};

export const useSendChatMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (message) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(message.roomId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(message.roomId) });
    },
  });
};

export const useCreateChatPollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatPoll,
    onSuccess: (message) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(message.roomId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(message.roomId) });
    },
  });
};

export const useVotePollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: votePoll,
    onSuccess: (poll: Poll) => {
      queryClient.setQueriesData<ChatRoomDetail>({ queryKey: ['chat-room'] }, (current) =>
        current ? patchPollInRoomDetail(current, poll) : current,
      );
      queryClient.setQueriesData({ queryKey: ['chat-messages'] }, (current) => patchPollInMessages(current, poll));
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
    },
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.event(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
  });
};

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
    },
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
    },
  });
};

export const useAddEventMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addEventMedia,
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
    },
  });
};

export const useDeleteEventMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEventMedia,
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
    },
  });
};

export const useApproveEventParticipantMutation = () => useParticipantMutation(approveEventParticipant);

export const useRemoveEventParticipantMutation = () => useParticipantMutation(removeEventParticipant);

export const useBlockEventParticipantMutation = () => useParticipantMutation(blockEventParticipant);

export const useJoinEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinEvent,
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.event(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
  });
};

export const useLeaveEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveEvent,
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.event(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
    },
  });
};

export const useLikeEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeEvent,
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feedRoot });
      patchEventAcrossCaches(queryClient, eventId, (event) => ({
        ...event,
        likedByMe: true,
        likeCount: event.likedByMe ? event.likeCount : event.likeCount + 1,
      }));
    },
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
  });
};

export const useCreateFeedPreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeedPreference,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedPreferences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
    },
  });
};

export const useDeleteFeedPreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeedPreference,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedPreferences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
    },
  });
};

export const useUnlikeEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlikeEvent,
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feedRoot });
      patchEventAcrossCaches(queryClient, eventId, (event) => ({
        ...event,
        likedByMe: false,
        likeCount: event.likedByMe ? Math.max(0, event.likeCount - 1) : event.likeCount,
      }));
    },
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
  });
};

export const useShareEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, eventId }: { conversationId: string; eventId: string }) =>
      shareEventToConversation(conversationId, eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot });
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const updateAuthUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (user: UserProfile) => {
      await updateAuthUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
    },
  });
};

export const useRateOrganizerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rateOrganizer,
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
    },
  });
};

export const useRateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rateEvent,
    onSuccess: (event) => {
      syncEventAcrossCaches(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
    },
  });
};

export const useCreateTicketCheckoutMutation = () =>
  useMutation({
    mutationFn: createTicketCheckout,
  });

export const useConfirmTicketCheckoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmTicketCheckout,
    onSuccess: (result) => {
      syncEventAcrossCaches(queryClient, result.event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileActivity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
    },
  });
};

function useParticipantMutation(
  mutationFn: (input: { eventId: string; userId: string }) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventParticipants(variables.eventId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.eventId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
    },
  });
}

function patchPollInRoomDetail(current: ChatRoomDetail, poll: Poll): ChatRoomDetail {
  return {
    ...current,
    messages: current.messages.map((message) => (message.poll?.id === poll.id ? { ...message, poll } : message)),
  };
}

function patchPollInMessages(current: unknown, poll: Poll) {
  if (!Array.isArray(current)) {
    return current;
  }
  return current.map((message) => (message?.poll?.id === poll.id ? { ...message, poll } : message));
}

function syncEventAcrossCaches(queryClient: ReturnType<typeof useQueryClient>, event: AppEvent) {
  queryClient.setQueryData(queryKeys.event(event.id), event);
  patchEventAcrossCaches(queryClient, event.id, () => event);
  queryClient.setQueryData<AppEvent[] | undefined>(queryKeys.likedEvents, (current) => {
    if (event.likedByMe) {
      if (!current) {
        return [event];
      }

      const withoutEvent = current.filter((item) => item.id !== event.id);
      return [event, ...withoutEvent];
    }

    return current?.filter((item) => item.id !== event.id);
  });
}

function patchEventAcrossCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
  updater: (event: AppEvent) => AppEvent,
) {
  queryClient.setQueryData<AppEvent | undefined>(queryKeys.event(eventId), (current) => (current ? updater(current) : current));
  queryClient.setQueriesData<AppEvent[]>({ queryKey: queryKeys.eventsRoot }, (current) =>
    patchEventList(current, eventId, updater),
  );
  queryClient.setQueriesData<AppEvent[]>({ queryKey: queryKeys.myEventsRoot }, (current) =>
    patchEventList(current, eventId, updater),
  );
  queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: queryKeys.feedRoot }, (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        items: patchEventList(page.items, eventId, updater) ?? page.items,
      })),
    };
  });
  queryClient.setQueryData<AppEvent[] | undefined>(queryKeys.likedEvents, (current) => patchEventList(current, eventId, updater));
}

function patchEventList(
  current: AppEvent[] | undefined,
  eventId: string,
  updater: (event: AppEvent) => AppEvent,
) {
  if (!current) {
    return current;
  }

  return current.map((event) => (event.id === eventId ? updater(event) : event));
}
