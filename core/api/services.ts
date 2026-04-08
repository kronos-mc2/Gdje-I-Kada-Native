import { apiClient } from '@/core/api/http-client';
import { AppEvent, Conversation, CreateEventPayload, Friend } from '@/core/types/domain';

export const fetchEvents = async (): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/events');
  return response.data;
};

export const fetchFeed = async (): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/feed');
  return response.data;
};

export const fetchFriends = async (): Promise<Friend[]> => {
  const response = await apiClient.get<Friend[]>('/social/friends');
  return response.data;
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<Conversation[]>('/messages/conversations');
  return response.data;
};

export const createEvent = async (payload: CreateEventPayload): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>('/events', payload);
  return response.data;
};
