import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import { createEvent, fetchConversations, fetchEvents, fetchFeed, fetchFriends } from '@/core/api/services';

export const useEventsQuery = () =>
  useQuery({
    queryKey: queryKeys.events,
    queryFn: fetchEvents,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.events });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });
};
