import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import {
  createEvent,
  fetchEventById,
  fetchConversations,
  fetchEvents,
  fetchFeed,
  fetchFriends,
  fetchMyEvents,
  joinEvent,
  leaveEvent,
} from '@/core/api/services';
import { AppEvent, EventQueryParams, MyEventsFilter } from '@/core/types/domain';

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

export const useFeedQuery = () =>
  useQuery({
    queryKey: queryKeys.feed,
    queryFn: fetchFeed,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });
};
