import { apiClient } from '@/core/api/http-client';
import {
  AppEvent,
  Conversation,
  CreateEventPayload,
  EventQueryParams,
  FeedPage,
  FeedQueryParams,
  Friend,
  MyEventsFilter,
} from '@/core/types/domain';

export const fetchEvents = async (params?: EventQueryParams): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/events', { params });
  return response.data;
};

export const fetchEventById = async (eventId: string): Promise<AppEvent> => {
  const response = await apiClient.get<AppEvent>(`/events/${eventId}`);
  return response.data;
};

export const fetchMyEvents = async (filter: MyEventsFilter = 'all'): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/users/me/events', { params: { filter } });
  return response.data;
};

export const fetchLikedEvents = async (): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/users/me/liked-events');
  return response.data;
};

export const fetchFeed = async (params?: FeedQueryParams): Promise<FeedPage> => {
  const response = await apiClient.get<FeedPage>('/feed', { params });
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

export const likeEvent = async (eventId: string): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/like`);
  return response.data;
};

export const unlikeEvent = async (eventId: string): Promise<AppEvent> => {
  const response = await apiClient.delete<AppEvent>(`/events/${eventId}/like`);
  return response.data;
};

export const shareEventToConversation = async (conversationId: string, eventId: string): Promise<Conversation> => {
  const response = await apiClient.post<Conversation>(`/messages/conversations/${conversationId}/share-event`, { eventId });
  return response.data;
};
