import * as FileSystem from 'expo-file-system/legacy';

import { apiClient, deleteData, getApiBaseUrl, getData, patchData, postData } from '@/core/api/http-client';
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
  const events = await getData<AppEvent[]>('/events', { params });
  void localCache.saveEvents(events).catch(() => undefined);
  return events;
};

export const fetchEventById = async (eventId: string): Promise<AppEvent> => {
  const cachedEvent = await localCache.getEvent(eventId).catch(() => null);
  if (cachedEvent?.cacheVersion) {
    const state = await fetchEventCacheState(eventId).catch(() => null);
    if (state?.cacheVersion === cachedEvent.cacheVersion) {
      return cachedEvent;
    }
  }

  const event = await getData<AppEvent>(`/events/${eventId}`);
  void localCache.saveEvent(event).catch(() => undefined);
  return event;
};

export const fetchEventCacheState = async (eventId: string): Promise<EventCacheState> => {
  return getData<EventCacheState>(`/events/${eventId}/cache-state`);
};

export const fetchMyEvents = async (filter: MyEventsFilter = 'all'): Promise<AppEvent[]> => {
  return getData<AppEvent[]>('/users/me/events', { params: { filter } });
};

export const fetchLikedEvents = async (): Promise<AppEvent[]> => {
  return getData<AppEvent[]>('/users/me/liked-events');
};

export const fetchSavedEventsOverview = async (): Promise<SavedEventsOverview> => {
  return getData<SavedEventsOverview>('/users/me/saved-events/overview');
};

export const fetchFeedPreferences = async (): Promise<FeedPreference[]> => {
  return getData<FeedPreference[]>('/users/me/feed-preferences');
};

export const createFeedPreference = async (payload: CreateFeedPreferencePayload): Promise<FeedPreference> => {
  return postData<FeedPreference, CreateFeedPreferencePayload>('/users/me/feed-preferences', payload);
};

export const deleteFeedPreference = async (preferenceId: string): Promise<void> => {
  await deleteData(`/users/me/feed-preferences/${preferenceId}`);
};

export const fetchUserUpcomingEvents = async (userId: string): Promise<AppEvent[]> => {
  return getData<AppEvent[]>(`/users/${userId}/events/upcoming`);
};

export const updateEvent = async ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }): Promise<AppEvent> => {
  return patchData<AppEvent, UpdateEventPayload>(`/events/${eventId}`, payload);
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteData(`/events/${eventId}`);
};

export const fetchEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
  return getData<EventParticipant[]>(`/events/${eventId}/participants`);
};

export const addEventMedia = async ({ eventId, payload }: { eventId: string; payload: EventMediaPayload }): Promise<AppEvent> => {
  return postData<AppEvent, EventMediaPayload>(`/events/${eventId}/media`, payload);
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
  return deleteData<AppEvent>(`/events/${eventId}/media/${mediaId}`);
};

export const approveEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  return postData<EventParticipant[]>(`/events/${eventId}/participants/${userId}/approve`);
};

export const removeEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  return deleteData<EventParticipant[]>(`/events/${eventId}/participants/${userId}`);
};

export const blockEventParticipant = async ({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventParticipant[]> => {
  return postData<EventParticipant[]>(`/events/${eventId}/participants/${userId}/block`);
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
  if (payload.avatarImage) {
    const { avatarImage, ...profilePayload } = payload;
    const formData = new FormData();
    formData.append('profile', JSON.stringify(profilePayload));
    formData.append('avatar', toFormDataFile(avatarImage));
    return sendMultipart<UserProfile>('PATCH', '/users/me/profile', formData);
  }

  return patchData<UserProfile, UpdateProfilePayload>('/users/me/profile', payload);
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await postData('/users/me/password', payload);
};

export const deleteAccount = async (payload: DeleteAccountPayload): Promise<void> => {
  await deleteData('/users/me/account', { data: payload });
};

export const fetchProfileActivity = async (): Promise<ProfileActivity> => {
  return getData<ProfileActivity>('/users/me/activity');
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  return getData<Transaction[]>('/users/me/transactions');
};

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  return getData<NotificationPreferences>('/users/me/notifications/preferences');
};

export const updateNotificationPreferences = async (
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> => {
  return patchData<NotificationPreferences, Partial<NotificationPreferences>>('/users/me/notifications/preferences', payload);
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
  await postData('/users/me/notifications/push-tokens', { token, platform, deviceId, locale });
};

export const deletePushToken = async (token: string): Promise<void> => {
  await deleteData('/users/me/notifications/push-tokens', { params: { token } });
};

export const rateOrganizer = async ({ eventId, rating, comment }: OrganizerRatingPayload): Promise<AppEvent> => {
  return postData<AppEvent>(`/events/${eventId}/ratings`, { rating, comment });
};

export const rateEvent = async ({
  eventId,
  eventRating,
  organizerRating,
  eventComment,
  organizerComment,
}: EventRatingPayload): Promise<AppEvent> => {
  return postData<AppEvent>(`/events/${eventId}/ratings/full`, {
    eventRating,
    organizerRating,
    eventComment,
    organizerComment,
  });
};

export const createTicketCheckout = async (eventId: string): Promise<TicketCheckout> => {
  return postData<TicketCheckout>(`/events/${eventId}/ticket-checkout`);
};

export const confirmTicketCheckout = async ({
  orderId,
  confirmationToken,
}: {
  orderId: string;
  confirmationToken?: string;
}): Promise<TicketCheckoutResult> => {
  return postData<TicketCheckoutResult>(`/ticket-orders/${orderId}/confirm`, { confirmationToken });
};

export const fetchFeed = async (params?: FeedQueryParams): Promise<FeedPage> => {
  const feed = await getData<FeedPage>('/feed', { params });
  void localCache.saveEvents(feed.items).catch(() => undefined);
  return feed;
};

export const recordFeedImpression = async (eventId: string): Promise<void> => {
  await postData('/feed/impressions', { eventId });
};

export const fetchFriends = async (): Promise<Friend[]> => {
  return getData<Friend[]>('/social/friends');
};

export const fetchEventShareRecipients = async (eventId: string): Promise<Friend[]> => {
  return getData<Friend[]>(`/social/events/${eventId}/share-recipients`);
};

export const createFriendRequest = async (payload: CreateFriendRequestPayload): Promise<FriendRequest> => {
  return postData<FriendRequest, CreateFriendRequestPayload>('/social/friend-requests', payload);
};

export const respondToFriendRequest = async ({
  requestId,
  status,
}: {
  requestId: string;
  status: 'accepted' | 'rejected';
}): Promise<FriendRequest> => {
  return patchData<FriendRequest>(`/social/friend-requests/${requestId}`, { status });
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  return getData<Conversation[]>('/messages/conversations');
};

export const fetchChatRooms = async (query?: string): Promise<ChatRoom[]> => {
  return getData<ChatRoom[]>('/messages/chat-rooms', { params: { query } });
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
  return getData<ChatPerson[]>('/messages/people', { params: { query: query?.trim() } });
};

export const createChatRoom = async (payload: CreateChatRoomPayload): Promise<ChatRoom> => {
  return postData<ChatRoom, CreateChatRoomPayload>('/messages/chat-rooms', payload);
};

export const getOrCreateEventChatRoom = async (eventId: string): Promise<ChatRoom> => {
  return postData<ChatRoom>(`/messages/events/${eventId}/chat-room`);
};

export const updateChatRoom = async ({ roomId, adminOnly }: { roomId: string; adminOnly: boolean }): Promise<ChatRoom> => {
  return patchData<ChatRoom>(`/messages/chat-rooms/${roomId}`, { adminOnly });
};

export const updateChatNotificationSettings = async ({
  roomId,
  muted,
}: {
  roomId: string;
  muted: boolean;
}): Promise<ChatRoom> => {
  return patchData<ChatRoom>(`/messages/chat-rooms/${roomId}/notification-settings`, { muted });
};

export const sendChatMessage = async ({ roomId, body }: { roomId: string; body: string }): Promise<ChatMessage> => {
  return postData<ChatMessage>(`/messages/chat-rooms/${roomId}/messages`, { body });
};

export const createChatPoll = async ({ roomId, payload }: { roomId: string; payload: CreatePollPayload }): Promise<ChatMessage> => {
  return postData<ChatMessage, CreatePollPayload>(`/messages/chat-rooms/${roomId}/polls`, payload);
};

export const votePoll = async ({ pollId, optionIds }: { pollId: string; optionIds: string[] }): Promise<Poll> => {
  return postData<Poll>(`/messages/polls/${pollId}/vote`, { optionIds });
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

  return postData<AppEvent, CreateEventPayload>('/events', payload);
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
  return postData<AppEvent>(`/events/${eventId}/join`);
};

export const leaveEvent = async (eventId: string): Promise<AppEvent> => {
  return deleteData<AppEvent>(`/events/${eventId}/join`);
};

export const likeEvent = async (eventId: string): Promise<AppEvent> => {
  return postData<AppEvent>(`/events/${eventId}/like`);
};

export const unlikeEvent = async (eventId: string): Promise<AppEvent> => {
  return deleteData<AppEvent>(`/events/${eventId}/like`);
};

export const shareEventToConversation = async (conversationId: string, eventId: string): Promise<ChatMessage> => {
  return postData<ChatMessage>(`/messages/chat-rooms/${conversationId}/share-event`, { eventId });
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
