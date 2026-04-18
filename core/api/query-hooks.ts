import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import {
  createEvent,
  fetchConversations,
  fetchEvents,
  fetchFeed,
  fetchFriends,
  joinEvent,
  leaveEvent,
} from '@/core/api/services';
import { EventQueryParams } from '@/core/types/domain';

export const useEventsQuery = (params?: EventQueryParams) =>
  useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => fetchEvents(params),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });
};

export const useJoinEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });
};

export const useLeaveEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });
};
