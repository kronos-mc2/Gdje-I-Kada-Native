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
  OrganizerRatingPayload,
  Poll,
  ProfileActivity,
  TicketCheckout,
  TicketCheckoutResult,
  Transaction,
  UpdateProfilePayload,
  UserProfile,
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

export const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
  const response = await apiClient.patch<UserProfile>('/users/me/profile', payload);
  return response.data;
};

export const fetchProfileActivity = async (): Promise<ProfileActivity> => {
  const response = await apiClient.get<ProfileActivity>('/users/me/activity');
  return response.data;
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<Transaction[]>('/users/me/transactions');
  return response.data;
};

export const rateOrganizer = async ({ eventId, rating, comment }: OrganizerRatingPayload): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/ratings`, { rating, comment });
  return response.data;
};

export const createTicketCheckout = async (eventId: string): Promise<TicketCheckout> => {
  const response = await apiClient.post<TicketCheckout>(`/events/${eventId}/ticket-checkout`);
  return response.data;
};

export const confirmTicketCheckout = async ({
  orderId,
  confirmationToken,
}: {
  orderId: string;
  confirmationToken?: string;
}): Promise<TicketCheckoutResult> => {
  const response = await apiClient.post<TicketCheckoutResult>(`/ticket-orders/${orderId}/confirm`, { confirmationToken });
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
  const response = await apiClient.get<ChatPerson[]>('/messages/people', { params: { query: query?.trim() } });
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
