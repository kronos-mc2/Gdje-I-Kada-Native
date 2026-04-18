import { apiClient } from '@/core/api/http-client';
import { AppEvent, Conversation, CreateEventPayload, EventQueryParams, Friend } from '@/core/types/domain';

export const fetchEvents = async (params?: EventQueryParams): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/events', { params });
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

export const joinEvent = async (eventId: string): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/join`);
  return response.data;
};

export const leaveEvent = async (eventId: string): Promise<AppEvent> => {
  const response = await apiClient.delete<AppEvent>(`/events/${eventId}/join`);
  return response.data;
};
