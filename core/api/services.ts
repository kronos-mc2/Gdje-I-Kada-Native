import { getConversations as getMockConversations, getEvents as getMockEvents, getFriends as getMockFriends } from '@/core/api/mock-api';
import { apiClient } from '@/core/api/http-client';
import { AppEvent, Conversation, Friend } from '@/core/types/domain';

const useMockApi = !process.env.EXPO_PUBLIC_API_BASE_URL;

export const fetchEvents = async (): Promise<AppEvent[]> => {
  if (useMockApi) {
    return getMockEvents();
  }

  const response = await apiClient.get<AppEvent[]>('/events');
  return response.data;
};

export const fetchFriends = async (): Promise<Friend[]> => {
  if (useMockApi) {
    return getMockFriends();
  }

  const response = await apiClient.get<Friend[]>('/social/friends');
  return response.data;
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  if (useMockApi) {
    return getMockConversations();
  }

  const response = await apiClient.get<Conversation[]>('/messages/conversations');
  return response.data;
};
