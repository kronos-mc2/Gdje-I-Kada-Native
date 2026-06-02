import { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { AppState, AppStateStatus, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { createChatRealtimeSocket, parseChatRealtimeEvent } from '@/core/api/chat-realtime-client';
import { queryKeys } from '@/core/api/query-keys';
import { fetchChatRoom } from '@/core/api/services';
import { queryClient } from '@/core/query/query-client';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';
import { ChatRoom, ChatRoomDetail, NotificationPreferences } from '@/core/types/domain';

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const IN_APP_MESSAGE_VISIBLE_MS = 5000;

type InAppMessagePreview = {
  roomId: string;
  title: string;
  body: string;
};

const refreshChatQueries = (roomId?: string) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot, refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.friends, refetchType: 'active' });

  if (!roomId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomRoot, refetchType: 'active' });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessagesRoot, refetchType: 'active' });
    return;
  }

  void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(roomId), refetchType: 'active' });
};

const refreshPollQueries = (roomId?: string) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomsRoot, refetchType: 'active' });

  if (!roomId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoomRoot, refetchType: 'active' });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessagesRoot, refetchType: 'active' });
    return;
  }

  void fetchChatRoom(roomId, { forceFullSync: true })
    .then((detail) => {
      queryClient.setQueryData(queryKeys.chatRoom(roomId), detail);
      queryClient.setQueryData(queryKeys.chatMessages(roomId), detail.messages);
    })
    .catch(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomId), refetchType: 'active' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(roomId), refetchType: 'active' });
    });
};

export function ChatRealtimeListener() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inAppDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const [inAppMessage, setInAppMessage] = useState<InAppMessagePreview | null>(null);

  const clearInAppDismissTimer = useCallback(() => {
    if (inAppDismissTimerRef.current) {
      clearTimeout(inAppDismissTimerRef.current);
      inAppDismissTimerRef.current = null;
    }
  }, []);

  const dismissInAppMessage = useCallback(() => {
    clearInAppDismissTimer();
    setInAppMessage(null);
  }, [clearInAppDismissTimer]);

  const showInAppMessage = useCallback(
    (preview: InAppMessagePreview) => {
      clearInAppDismissTimer();
      setInAppMessage(preview);
      inAppDismissTimerRef.current = setTimeout(() => {
        setInAppMessage((current) => (current?.roomId === preview.roomId ? null : current));
        inAppDismissTimerRef.current = null;
      }, IN_APP_MESSAGE_VISIBLE_MS);
    },
    [clearInAppDismissTimer],
  );

  const showInAppMessageForRoom = useCallback(
    (roomId: string, messageId?: string) => {
      void fetchChatRoom(roomId)
        .then((detail) => {
          queryClient.setQueryData(queryKeys.chatRoom(roomId), detail);
          const message = findMessageForPreview(detail, messageId);
          if (message?.mine) {
            return;
          }
          showInAppMessage(buildInAppMessagePreview(roomId, detail, messageId));
        })
        .catch(() => undefined);
    },
    [showInAppMessage],
  );
  const inAppMessagePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -28) {
          dismissInAppMessage();
        }
      },
    }),
  ).current;

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
        if (realtimeEvent.type === 'poll.updated') {
          refreshPollQueries(roomId);
          return;
        }

        refreshChatQueries(roomId);
        if (
          realtimeEvent.type === 'message.created' &&
          roomId &&
          appStateRef.current === 'active' &&
          pathname !== `/chat/${roomId}` &&
          shouldShowInAppMessage(roomId)
        ) {
          showInAppMessageForRoom(roomId, realtimeEvent.payload?.messageId);
        }
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
  }, [accessToken, pathname, showInAppMessageForRoom]);

  useEffect(() => () => clearInAppDismissTimer(), [clearInAppDismissTimer]);

  return (
    <Modal visible={Boolean(inAppMessage)} transparent animationType="fade" onRequestClose={dismissInAppMessage}>
      <Pressable style={styles.modalOverlay} onPress={dismissInAppMessage}>
        <Pressable
          {...inAppMessagePanResponder.panHandlers}
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.background,
            },
          ]}
          onPress={() => {
            const roomId = inAppMessage?.roomId;
            dismissInAppMessage();
            if (roomId) {
              router.push(`/chat/${roomId}`);
            }
          }}
        >
          <View style={[styles.modalIcon, { backgroundColor: theme.colors.mapAccentSoft }]}>
            <Ionicons name="chatbubble" size={22} color={theme.colors.mapAccent} />
          </View>
          <View style={styles.modalCopy}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {inAppMessage?.title}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={2}>
              {inAppMessage?.body}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function shouldShowInAppMessage(roomId: string) {
  const room = findCachedRoom(roomId);
  const preferences = queryClient.getQueryData<NotificationPreferences>(queryKeys.notificationPreferences);
  if (room?.mutedByMe) {
    return false;
  }

  if (!preferences || !room) {
    return true;
  }

  if (room.type === 'direct') {
    return preferences.directMessagesEnabled;
  }

  return preferences.groupMessagesEnabled;
}

function findCachedRoom(roomId: string) {
  const roomLists = queryClient.getQueriesData<ChatRoom[]>({ queryKey: queryKeys.chatRoomsRoot });
  for (const [, rooms] of roomLists) {
    const room = rooms?.find((candidate) => candidate.id === roomId);
    if (room) {
      return room;
    }
  }

  return undefined;
}

function findMessageForPreview(source: ChatRoomDetail, messageId?: string) {
  if (messageId) {
    return source.messages.find((message) => message.id === messageId);
  }

  return source.messages[source.messages.length - 1];
}

function buildInAppMessagePreview(roomId: string, source: ChatRoom | ChatRoomDetail, messageId?: string): InAppMessagePreview {
  const room = 'room' in source ? source.room : source;
  const previewMessage = 'messages' in source ? findMessageForPreview(source, messageId) : undefined;
  const title = previewMessage?.senderName?.trim() || room.title || 'Nova poruka';
  const body = previewMessage?.body?.trim() || room.lastMessage?.trim() || room.subtitle?.trim() || '';

  return {
    roomId,
    title,
    body,
  };
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 62,
    paddingHorizontal: 16,
  },
  modalCard: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCopy: {
    flex: 1,
  },
});
