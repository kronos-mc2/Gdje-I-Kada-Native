import { Platform } from 'react-native';

import { getApiBaseUrl } from '@/core/api/http-client';

export type ChatRealtimeEventType = 'message.created' | 'poll.updated' | 'room.updated';

export type ChatRealtimeEvent = {
  type: ChatRealtimeEventType;
  roomId?: string;
  payload?: {
    messageId?: string;
    pollId?: string;
    roomId?: string;
  };
};

interface ReactNativeWebSocketConstructor {
  new (
    url: string,
    protocols?: string | string[] | null,
    options?: {
      headers?: Record<string, string>;
    },
  ): WebSocket;
}

const CHAT_WEBSOCKET_PATH = '/ws/messages';

const apiBaseUrlToWebSocketUrl = (apiBaseUrl: string) => {
  const parsedUrl = new URL(apiBaseUrl);
  const basePath = parsedUrl.pathname.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  parsedUrl.pathname = `${basePath}${CHAT_WEBSOCKET_PATH}`;
  parsedUrl.search = '';
  parsedUrl.hash = '';
  return parsedUrl.toString();
};

export const getChatRealtimeUrl = () => apiBaseUrlToWebSocketUrl(getApiBaseUrl());

export const createChatRealtimeSocket = (accessToken: string) => {
  const url = getChatRealtimeUrl();
  if (Platform.OS === 'web') {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('access_token', accessToken);
    return new WebSocket(parsedUrl.toString());
  }

  const NativeWebSocket = WebSocket as unknown as ReactNativeWebSocketConstructor;
  return new NativeWebSocket(url, undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const parseChatRealtimeEvent = (rawData: unknown): ChatRealtimeEvent | null => {
  if (typeof rawData !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as Partial<ChatRealtimeEvent>;
    if (
      parsed.type !== 'message.created' &&
      parsed.type !== 'poll.updated' &&
      parsed.type !== 'room.updated'
    ) {
      return null;
    }

    return {
      type: parsed.type,
      roomId: typeof parsed.roomId === 'string' ? parsed.roomId : undefined,
      payload: parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : undefined,
    };
  } catch {
    return null;
  }
};
