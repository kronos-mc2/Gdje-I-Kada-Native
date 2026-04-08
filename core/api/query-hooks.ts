import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/query-keys';
import { fetchConversations, fetchEvents, fetchFeed, fetchFriends } from '@/core/api/services';

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
