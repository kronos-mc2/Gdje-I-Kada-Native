import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import {
  createEvent,
  fetchEventById,
  fetchConversations,
  fetchEvents,
  fetchFeed,
  fetchLikedEvents,
  fetchFriends,
  fetchMyEvents,
  joinEvent,
  likeEvent,
  leaveEvent,
  shareEventToConversation,
  unlikeEvent,
} from '@/core/api/services';
import { AppEvent, EventQueryParams, FeedPage, MyEventsFilter } from '@/core/types/domain';

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

export const useFeedInfiniteQuery = (limit = 5) =>
  useInfiniteQuery({
    queryKey: queryKeys.feed(limit),
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam as string | undefined, limit }),
    initialPageParam: undefined as string | undefined,
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

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.event(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
    },
  });
};

export const useJoinEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinEvent,
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.event(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myEventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
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
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
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
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.likedEventsRoot });
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
    },
  });
};

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
