import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { createChatRealtimeSocket, parseChatRealtimeEvent } from '@/core/api/chat-realtime-client';
import { queryKeys } from '@/core/api/query-keys';
import { queryClient } from '@/core/query/query-client';
import { useAuthStore } from '@/core/store/auth-store';

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

const refreshChatQueries = (roomId?: string) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot, refetchType: 'active' });

  if (!roomId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomRoot, refetchType: 'active' });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessagesRoot, refetchType: 'active' });
    return;
  }

  void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(roomId), refetchType: 'active' });
};

export function ChatRealtimeListener() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = () => {
      intentionalCloseRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
    };

    const scheduleReconnect = () => {
      if (disposed || appStateRef.current !== 'active' || reconnectTimerRef.current) {
        return;
      }

      const delay = Math.min(
        INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttemptRef.current,
        MAX_RECONNECT_DELAY_MS,
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed || appStateRef.current !== 'active') {
        return;
      }

      const currentSocket = socketRef.current;
      if (currentSocket?.readyState === WebSocket.OPEN || currentSocket?.readyState === WebSocket.CONNECTING) {
        return;
      }

      intentionalCloseRef.current = false;
      const socket = createChatRealtimeSocket(accessToken);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        refreshChatQueries();
      };

      socket.onmessage = (event) => {
        const realtimeEvent = parseChatRealtimeEvent(event.data);
        if (!realtimeEvent) {
          return;
        }

        const roomId = realtimeEvent.roomId ?? realtimeEvent.payload?.roomId;
        refreshChatQueries(roomId);
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!intentionalCloseRef.current) {
          scheduleReconnect();
        }
      };
    };

    connect();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && previousState !== 'active') {
        connect();
        refreshChatQueries();
        return;
      }

      if (nextState !== 'active') {
        clearReconnectTimer();
        closeSocket();
      }
    });

    return () => {
      disposed = true;
      clearReconnectTimer();
      closeSocket();
      subscription.remove();
    };
  }, [accessToken]);

  return null;
}
