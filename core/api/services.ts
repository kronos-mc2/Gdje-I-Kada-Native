import * as FileSystem from 'expo-file-system/legacy';

import { apiClient, getApiBaseUrl } from '@/core/api/http-client';
import { localCache } from '@/core/cache/local-cache';
import { useAuthStore } from '@/core/store/auth-store';
import {
  AppEvent,
  ChatMessage,
  ChatMessagesQueryParams,
  ChatPerson,
  ChatRoom,
  ChatRoomDetail,
  ChangePasswordPayload,
  Conversation,
  CreateChatRoomPayload,
  CreateEventPayload,
  CreateFeedPreferencePayload,
  CreateFriendRequestPayload,
  EventMediaPayload,
  EventParticipant,
  EventCacheState,
  CreatePollPayload,
  DeleteAccountPayload,
  EventQueryParams,
  EventRatingPayload,
  FeedPage,
  FeedQueryParams,
  FeedPreference,
  Friend,
  FriendRequest,
  LocalEventImage,
  LocalEventVideo,
  MyEventsFilter,
  NotificationPreferences,
  OrganizerRatingPayload,
  Poll,
  ProfileActivity,
  SavedEventsOverview,
  TicketCheckout,
  TicketCheckoutResult,
  Transaction,
  UpdateEventPayload,
  UpdateProfilePayload,
  UserProfile,
  Locale,
} from '@/core/types/domain';

const MULTIPART_UPLOAD_TIMEOUT_MS = 90_000;
const VIDEO_UPLOAD_TIMEOUT_MS = 90_000;

export const fetchEvents = async (params?: EventQueryParams): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>('/events', { params });
  void localCache.saveEvents(response.data).catch(() => undefined);
  return response.data;
};

export const fetchEventById = async (eventId: string): Promise<AppEvent> => {
  const cachedEvent = await localCache.getEvent(eventId).catch(() => null);
  if (cachedEvent?.cacheVersion) {
    const state = await fetchEventCacheState(eventId).catch(() => null);
    if (state?.cacheVersion === cachedEvent.cacheVersion) {
      return cachedEvent;
    }
  }

  const response = await apiClient.get<AppEvent>(`/events/${eventId}`);
  void localCache.saveEvent(response.data).catch(() => undefined);
  return response.data;
};

export const fetchEventCacheState = async (eventId: string): Promise<EventCacheState> => {
  const response = await apiClient.get<EventCacheState>(`/events/${eventId}/cache-state`);
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

export const fetchSavedEventsOverview = async (): Promise<SavedEventsOverview> => {
  const response = await apiClient.get<SavedEventsOverview>('/users/me/saved-events/overview');
  return response.data;
};

export const fetchFeedPreferences = async (): Promise<FeedPreference[]> => {
  const response = await apiClient.get<FeedPreference[]>('/users/me/feed-preferences');
  return response.data;
};

export const createFeedPreference = async (payload: CreateFeedPreferencePayload): Promise<FeedPreference> => {
  const response = await apiClient.post<FeedPreference>('/users/me/feed-preferences', payload);
  return response.data;
};

export const deleteFeedPreference = async (preferenceId: string): Promise<void> => {
  await apiClient.delete(`/users/me/feed-preferences/${preferenceId}`);
};

export const fetchUserUpcomingEvents = async (userId: string): Promise<AppEvent[]> => {
  const response = await apiClient.get<AppEvent[]>(`/users/${userId}/events/upcoming`);
  return response.data;
};

export const updateEvent = async ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }): Promise<AppEvent> => {
  const response = await apiClient.patch<AppEvent>(`/events/${eventId}`, payload);
  return response.data;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await apiClient.delete(`/events/${eventId}`);
};

export const fetchEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
  const response = await apiClient.get<EventParticipant[]>(`/events/${eventId}/participants`);
  return response.data;
};

export const addEventMedia = async ({ eventId, payload }: { eventId: string; payload: EventMediaPayload }): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/media`, payload);
  return response.data;
};

export const uploadEventMedia = async ({
  eventId,
  media,
  mediaType,
}: {
  eventId: string;
  media: LocalEventImage | LocalEventVideo;
  mediaType: 'image' | 'video';
}): Promise<AppEvent> => {
  if (mediaType === 'video') {
    return uploadEventVideoFile({ eventId, video: media as LocalEventVideo });
  }

  const formData = new FormData();
  formData.append(mediaType, toFormDataFile(media));
  return postMultipart<AppEvent>(`/events/${eventId}/media`, formData);
};

export const deleteEventMedia = async ({ eventId, mediaId }: { eventId: string; mediaId: string }): Promise<AppEvent> => {
  const response = await apiClient.delete<AppEvent>(`/events/${eventId}/media/${mediaId}`);
  return response.data;
};

export const approveEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  const response = await apiClient.post<EventParticipant[]>(`/events/${eventId}/participants/${userId}/approve`);
  return response.data;
};

export const removeEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  const response = await apiClient.delete<EventParticipant[]>(`/events/${eventId}/participants/${userId}`);
  return response.data;
};

export const blockEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  const response = await apiClient.post<EventParticipant[]>(`/events/${eventId}/participants/${userId}/block`);
  return response.data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
  if (payload.avatarImage) {
    const { avatarImage, ...profilePayload } = payload;
    const formData = new FormData();
    formData.append('profile', JSON.stringify(profilePayload));
    formData.append('avatar', toFormDataFile(avatarImage));
    return sendMultipart<UserProfile>('PATCH', '/users/me/profile', formData);
  }

  const response = await apiClient.patch<UserProfile>('/users/me/profile', payload);
  return response.data;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await apiClient.post('/users/me/password', payload);
};

export const deleteAccount = async (payload: DeleteAccountPayload): Promise<void> => {
  await apiClient.delete('/users/me/account', { data: payload });
};

export const fetchProfileActivity = async (): Promise<ProfileActivity> => {
  const response = await apiClient.get<ProfileActivity>('/users/me/activity');
  return response.data;
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<Transaction[]>('/users/me/transactions');
  return response.data;
};

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await apiClient.get<NotificationPreferences>('/users/me/notifications/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> => {
  const response = await apiClient.patch<NotificationPreferences>('/users/me/notifications/preferences', payload);
  return response.data;
};

export const registerPushToken = async ({
  token,
  platform,
  deviceId,
  locale,
}: {
  token: string;
  platform: string;
  deviceId?: string;
  locale?: Locale;
}): Promise<void> => {
  await apiClient.post('/users/me/notifications/push-tokens', { token, platform, deviceId, locale });
};

export const deletePushToken = async (token: string): Promise<void> => {
  await apiClient.delete('/users/me/notifications/push-tokens', { params: { token } });
};

export const rateOrganizer = async ({ eventId, rating, comment }: OrganizerRatingPayload): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/ratings`, { rating, comment });
  return response.data;
};

export const rateEvent = async ({
  eventId,
  eventRating,
  organizerRating,
  eventComment,
  organizerComment,
}: EventRatingPayload): Promise<AppEvent> => {
  const response = await apiClient.post<AppEvent>(`/events/${eventId}/ratings/full`, {
    eventRating,
    organizerRating,
    eventComment,
    organizerComment,
  });
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
  void localCache.saveEvents(response.data.items).catch(() => undefined);
  return response.data;
};

export const recordFeedImpression = async (eventId: string): Promise<void> => {
  await apiClient.post('/feed/impressions', { eventId });
};

export const fetchFriends = async (): Promise<Friend[]> => {
  const response = await apiClient.get<Friend[]>('/social/friends');
  return response.data;
};

export const fetchEventShareRecipients = async (eventId: string): Promise<Friend[]> => {
  const response = await apiClient.get<Friend[]>(`/social/events/${eventId}/share-recipients`);
  return response.data;
};

export const createFriendRequest = async (payload: CreateFriendRequestPayload): Promise<FriendRequest> => {
  const response = await apiClient.post<FriendRequest>('/social/friend-requests', payload);
  return response.data;
};

export const respondToFriendRequest = async ({
  requestId,
  status,
}: {
  requestId: string;
  status: 'accepted' | 'rejected';
}): Promise<FriendRequest> => {
  const response = await apiClient.patch<FriendRequest>(`/social/friend-requests/${requestId}`, { status });
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

export const fetchChatRoom = async (roomId: string, options?: { forceFullSync?: boolean }): Promise<ChatRoomDetail> => {
  const cachedDetail = await localCache.getChatRoomDetail(roomId).catch(() => null);
  const afterMessageId =
    !options?.forceFullSync && cachedDetail?.messages.length
      ? cachedDetail.messages[cachedDetail.messages.length - 1].id
      : undefined;
  const response = await apiClient.get<ChatRoomDetail>(`/messages/chat-rooms/${roomId}`, {
    params: afterMessageId ? { afterMessageId } : undefined,
  });
  const mergedDetail = cachedDetail
    ? {
        room: response.data.room,
        messages: mergeChatMessages(cachedDetail.messages, response.data.messages),
      }
    : response.data;
  void localCache.saveChatRoomDetail(mergedDetail).catch(() => undefined);
  return mergedDetail;
};

export const fetchChatMessages = async (roomId: string, params?: ChatMessagesQueryParams): Promise<ChatMessage[]> => {
  const afterMessageId = params?.afterMessageId ?? (await localCache.getLatestChatMessageId(roomId).catch(() => null)) ?? undefined;
  const response = await apiClient.get<ChatMessage[]>(`/messages/chat-rooms/${roomId}/messages`, {
    params: {
      ...params,
      afterMessageId,
    },
  });
  await localCache.saveChatMessages(roomId, response.data).catch(() => undefined);
  if (!afterMessageId) {
    return response.data;
  }

  return (await localCache.getChatRoomDetail(roomId).catch(() => null))?.messages ?? response.data;
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

export const updateChatNotificationSettings = async ({
  roomId,
  muted,
}: {
  roomId: string;
  muted: boolean;
}): Promise<ChatRoom> => {
  const response = await apiClient.patch<ChatRoom>(`/messages/chat-rooms/${roomId}/notification-settings`, { muted });
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
  if (payload.images?.length || payload.video) {
    const { images, video, ...eventPayload } = payload;
    const formData = new FormData();
    formData.append('event', JSON.stringify(eventPayload));
    images?.forEach((image) => formData.append('images', toFormDataFile(image)));
    const createdEvent = await postMultipart<AppEvent>('/events', formData);

    if (!video) {
      return createdEvent;
    }

    try {
      return await uploadEventMedia({ eventId: createdEvent.id, media: video, mediaType: 'video' });
    } catch (error) {
      try {
        await deleteEvent(createdEvent.id);
      } catch {
        // Keep the original video upload error; the event can still be managed by the owner if cleanup fails.
      }
      throw error;
    }
  }

  const response = await apiClient.post<AppEvent>('/events', payload);
  return response.data;
};

const toFormDataFile = (file: LocalEventImage | LocalEventVideo) =>
  ({
    uri: file.uri,
    name: file.name,
    type: file.type,
  }) as unknown as Blob;

const uploadEventVideoFile = async ({ eventId, video }: { eventId: string; video: LocalEventVideo }): Promise<AppEvent> => {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': video.type,
    'X-File-Name': encodeURIComponent(video.name),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const uploadTask = FileSystem.createUploadTask(`${getApiBaseUrl()}/events/${eventId}/media/video`, video.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
    headers,
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      void uploadTask.cancelAsync().catch(() => undefined);
      reject(new Error('Upload timed out. Please try again.'));
    }, VIDEO_UPLOAD_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([uploadTask.uploadAsync(), timeout]);
    if (!result) {
      throw new Error('Upload cancelled.');
    }
    return readApiResponseText<AppEvent>(result.status, result.body ?? '');
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const postMultipart = async <T>(path: string, formData: FormData): Promise<T> => sendMultipart('POST', path, formData);

const sendMultipart = async <T>(method: 'POST' | 'PATCH', path: string, formData: FormData): Promise<T> =>
  new Promise((resolve, reject) => {
    const token = useAuthStore.getState().accessToken;
    const xhr = new XMLHttpRequest();
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      callback();
    };

    const timeoutId = setTimeout(() => {
      finish(() => reject(new Error('Upload timed out. Please try again.')));
      xhr.abort();
    }, MULTIPART_UPLOAD_TIMEOUT_MS);

    xhr.open(method, `${getApiBaseUrl()}${path}`);
    xhr.timeout = MULTIPART_UPLOAD_TIMEOUT_MS;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      finish(() => {
        try {
          resolve(readApiResponseText<T>(xhr.status, xhr.responseText ?? ''));
        } catch (error) {
          reject(error);
        }
      });
    };
    xhr.onerror = () => finish(() => reject(new Error('Network request failed.')));
    xhr.onabort = () => finish(() => reject(new Error('Upload cancelled.')));
    xhr.ontimeout = () => finish(() => reject(new Error('Upload timed out. Please try again.')));

    try {
      xhr.send(formData);
    } catch (error) {
      finish(() => reject(error));
    }
  });

const readApiResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  return readApiResponseText<T>(response.status, text);
};

const readApiResponseText = <T>(status: number, text: string): T => {
  const data = text ? parseJson(text) : null;
  if (status < 200 || status >= 300) {
    throw new Error(resolveApiResponseMessage(data, text, status));
  }
  return data as T;
};

const parseJson = (text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const resolveApiResponseMessage = (data: unknown, text: string, status: number) => {
  if (data && typeof data === 'object') {
    for (const key of ['message', 'error', 'detail']) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  if (text.trim()) {
    return text.trim();
  }
  return `HTTP ${status}`;
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

const mergeChatMessages = (currentMessages: ChatMessage[], incomingMessages: ChatMessage[]) => {
  if (incomingMessages.length === 0) {
    return currentMessages;
  }

  const messagesById = new Map<string, ChatMessage>();
  for (const message of currentMessages) {
    messagesById.set(message.id, message);
  }
  for (const message of incomingMessages) {
    messagesById.set(message.id, message);
  }
  return Array.from(messagesById.values()).sort((left, right) => {
    const dateCompare = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    return dateCompare === 0 ? left.id.localeCompare(right.id) : dateCompare;
  });
};
