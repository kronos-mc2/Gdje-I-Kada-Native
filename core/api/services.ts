import { apiClient } from '@/core/api/http-client';
import {
  AppEvent,
  ChatMessage,
  ChatPerson,
  ChatRoom,
  ChatRoomDetail,
  Conversation,
  CreateChatRoomPayload,
  CreateEventPayload,
  CreatePollPayload,
  EventQueryParams,
  FeedPage,
  FeedQueryParams,
  Friend,
  MyEventsFilter,
  Poll,
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

export const fetchChatRooms = async (query?: string): Promise<ChatRoom[]> => {
  const response = await apiClient.get<ChatRoom[]>('/messages/chat-rooms', { params: { query } });
  return response.data;
};

export const fetchChatRoom = async (roomId: string): Promise<ChatRoomDetail> => {
  const response = await apiClient.get<ChatRoomDetail>(`/messages/chat-rooms/${roomId}`);
  return response.data;
};

export const fetchChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const response = await apiClient.get<ChatMessage[]>(`/messages/chat-rooms/${roomId}/messages`);
  return response.data;
};

export const fetchChatPeople = async (query?: string): Promise<ChatPerson[]> => {
  const response = await apiClient.get<ChatPerson[]>('/messages/people', { params: { query } });
  return response.data;
};

export const createChatRoom = async (payload: CreateChatRoomPayload): Promise<ChatRoom> => {
  const response = await apiClient.post<ChatRoom>('/messages/chat-rooms', payload);
  return response.data;
};

export const getOrCreateEventChatRoom = async (eventId: string): Promise<ChatRoom> => {
  const response = await apiClient.post<ChatRoom>(`/messages/events/${eventId}/chat-room`);
  return response.data;
};

export const updateChatRoom = async ({ roomId, adminOnly }: { roomId: string; adminOnly: boolean }): Promise<ChatRoom> => {
  const response = await apiClient.patch<ChatRoom>(`/messages/chat-rooms/${roomId}`, { adminOnly });
  return response.data;
};

export const sendChatMessage = async ({ roomId, body }: { roomId: string; body: string }): Promise<ChatMessage> => {
  const response = await apiClient.post<ChatMessage>(`/messages/chat-rooms/${roomId}/messages`, { body });
  return response.data;
};

export const createChatPoll = async ({ roomId, payload }: { roomId: string; payload: CreatePollPayload }): Promise<ChatMessage> => {
  const response = await apiClient.post<ChatMessage>(`/messages/chat-rooms/${roomId}/polls`, payload);
  return response.data;
};

export const votePoll = async ({ pollId, optionIds }: { pollId: string; optionIds: string[] }): Promise<Poll> => {
  const response = await apiClient.post<Poll>(`/messages/polls/${pollId}/vote`, { optionIds });
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

export const shareEventToConversation = async (conversationId: string, eventId: string): Promise<ChatMessage> => {
  const response = await apiClient.post<ChatMessage>(`/messages/chat-rooms/${conversationId}/share-event`, { eventId });
  return response.data;
};
