import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppScreen, AppText } from '@/components/primitives';
import { useChatRoomQuery, useCreateChatPollMutation, useSendChatMessageMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatMessage, CreatePollPayload } from '@/core/types/domain';
import { ChatDetailsPanel } from '@/features/messages/components/chat-details-panel';
import { MessageBubble } from '@/features/messages/components/message-bubble';
import { useKeyboardState } from '@/features/messages/hooks/use-keyboard-bottom-inset';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type ChatListItem = { key: string; type: 'date'; label: string } | { key: string; type: 'message'; message: ChatMessage };

const CHAT_HEADER_HEIGHT = 68;
const COMPOSER_BOTTOM_PADDING = 12;
const ANDROID_KEYBOARD_EXTRA_OFFSET = 36;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 8;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 8,
};

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const keyboardState = useKeyboardState({
    bottomInset: insets.bottom,
    extraOffset: Platform.OS === 'android' ? ANDROID_KEYBOARD_EXTRA_OFFSET : 0,
  });
  const messageListRef = useRef<FlatList<ChatListItem>>(null);
  const initialScrollRoomRef = useRef<string | null>(null);
  const pendingInitialScrollRef = useRef(false);
  const pendingOwnMessageScrollRef = useRef(false);
  const { data, isLoading } = useChatRoomQuery(roomId);
  const sendMessageMutation = useSendChatMessageMutation();
  const [body, setBody] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [visibleDateLabel, setVisibleDateLabel] = useState<string | null>(null);
  const room = data?.room;
  const messages = data?.messages ?? [];
  const chatItems = useMemo(() => buildChatListItems(messages, locale, t), [messages, locale, t]);
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isInitialLoading = isLoading && !data;
  const canWrite = room ? room.type === 'direct' || !room.adminOnly || room.myRole === 'owner' || room.myRole === 'admin' : false;
  const androidComposerBottomInset = Platform.OS === 'android' ? keyboardState.bottomInset : 0;
  const composerBottomPadding = COMPOSER_BOTTOM_PADDING + (keyboardState.isKeyboardVisible ? 0 : insets.bottom);

  useEffect(() => {
    initialScrollRoomRef.current = null;
    pendingInitialScrollRef.current = false;
    pendingOwnMessageScrollRef.current = false;
    setVisibleDateLabel(null);
  }, [roomId]);

  useEffect(() => {
    if (!pendingOwnMessageScrollRef.current || !latestMessage?.mine) {
      return;
    }

    pendingOwnMessageScrollRef.current = false;
    const scrollToSentMessage = () => messageListRef.current?.scrollToEnd({ animated: true });
    const immediateScroll = setTimeout(scrollToSentMessage, 0);
    const layoutScroll = setTimeout(scrollToSentMessage, 80);
    const settledScroll = setTimeout(scrollToSentMessage, 220);

    return () => {
      clearTimeout(immediateScroll);
      clearTimeout(layoutScroll);
      clearTimeout(settledScroll);
    };
  }, [latestMessage?.id, latestMessage?.mine]);

  const performInitialScroll = useCallback((attempt = 0) => {
    if (!roomId || initialScrollRoomRef.current === roomId || !pendingInitialScrollRef.current || messages.length === 0) {
      return;
    }

    const retryScroll = () => {
      if (attempt < 5) {
        setTimeout(() => performInitialScroll(attempt + 1), 80);
      }
    };

    const firstUnreadMessageIndex = getFirstUnreadMessageIndex(messages, room?.unreadCount ?? 0);
    if (firstUnreadMessageIndex >= 0) {
      const targetMessageId = messages[firstUnreadMessageIndex].id;
      const targetListIndex = chatItems.findIndex((item) => item.type === 'message' && item.message.id === targetMessageId);

      if (targetListIndex >= 0) {
        try {
          messageListRef.current?.scrollToIndex({
            index: targetListIndex,
            animated: false,
            viewPosition: 0.16,
          });
        } catch {
          retryScroll();
          return;
        }
      }
    } else {
      try {
        messageListRef.current?.scrollToEnd({ animated: false });
        setTimeout(() => messageListRef.current?.scrollToEnd({ animated: false }), 80);
        setTimeout(() => messageListRef.current?.scrollToEnd({ animated: false }), 220);
      } catch {
        retryScroll();
        return;
      }
    }

    pendingInitialScrollRef.current = false;
    initialScrollRoomRef.current = roomId;
  }, [chatItems, messages, room?.unreadCount, roomId]);

  useEffect(() => {
    if (!roomId || initialScrollRoomRef.current === roomId || messages.length === 0) {
      return;
    }

    pendingInitialScrollRef.current = true;
    const timeout = setTimeout(() => performInitialScroll(), 120);

    return () => clearTimeout(timeout);
  }, [messages.length, performInitialScroll, roomId]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item?: ChatListItem }> }) => {
    const firstVisibleItem = viewableItems.find((viewableItem) => viewableItem.item)?.item;
    if (firstVisibleItem?.type === 'date') {
      setVisibleDateLabel(null);
      return;
    }

    const firstVisibleMessage = viewableItems.find((viewableItem) => viewableItem.item?.type === 'message')?.item;
    if (firstVisibleMessage?.type === 'message') {
      setVisibleDateLabel(formatChatDateLabel(firstVisibleMessage.message.createdAt, locale, t));
      return;
    }

    setVisibleDateLabel(null);
  }).current;

  const sendMessage = async () => {
    const text = body.trim();
    if (!roomId || !text) {
      return;
    }

    try {
      pendingOwnMessageScrollRef.current = true;
      setBody('');
      await sendMessageMutation.mutateAsync({ roomId, body: text });
    } catch {
      pendingOwnMessageScrollRef.current = false;
      setBody(text);
      Alert.alert(t('messageSendFailed'));
    }
  };

  const openEvent = (eventId: string) => router.push(`/event/${eventId}`);

  return (
    <AppScreen scroll={false} contentHorizontalPadding={false} contentContainerStyle={styles.screen}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={26} color={theme.colors.textPrimary} />
        </Pressable>
        <Pressable onPress={() => setDetailsOpen((current) => !current)} style={styles.headerTitle}>
          <ProfileAvatar name={room?.title} avatarUrl={room?.avatarUrl} size={42} />
          <View style={styles.headerCopy}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {room?.title ?? t('loading')}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {room?.type !== 'direct' && room?.adminOnly ? t('adminOnlyMode') : (room?.subtitle ?? t('chats'))}
            </AppText>
          </View>
        </Pressable>
      </View>

      {detailsOpen && room ? (
        <ChatDetailsPanel room={room} />
      ) : (
        <KeyboardAvoidingView
          style={styles.chat}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={CHAT_HEADER_HEIGHT}
        >
          <FlatList<ChatListItem>
            ref={messageListRef}
            data={chatItems}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) =>
              item.type === 'date' ? (
                <DateSeparator label={item.label} />
              ) : (
                <MessageBubble message={item.message} locale={locale} onOpenEvent={openEvent} />
              )
            }
            contentContainerStyle={messages.length === 0 ? styles.emptyMessages : styles.messageList}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            onContentSizeChange={() => performInitialScroll()}
            onLayout={() => performInitialScroll()}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={CHAT_VIEWABILITY_CONFIG}
            onScrollToIndexFailed={(info) => {
              messageListRef.current?.scrollToOffset({
                offset: Math.max(0, info.averageItemLength * info.index),
                animated: false,
              });
              setTimeout(() => {
                if (info.index < chatItems.length) {
                  try {
                    messageListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                      viewPosition: 0.16,
                    });
                  } catch {
                    messageListRef.current?.scrollToOffset({
                      offset: Math.max(0, info.averageItemLength * info.index),
                      animated: false,
                    });
                  }
                }
              }, 80);
            }}
            ListEmptyComponent={
              <AppText variant="body" color="textMuted">
                {isInitialLoading ? t('loading') : t('noMessages')}
              </AppText>
            }
            showsVerticalScrollIndicator={false}
          />
          {visibleDateLabel ? (
            <View pointerEvents="none" style={styles.stickyDateOverlay}>
              <DateSeparator label={visibleDateLabel} compact />
            </View>
          ) : null}

          <View
            style={[
              styles.composer,
              {
                borderTopColor: theme.colors.border,
                marginBottom: androidComposerBottomInset,
                paddingBottom: composerBottomPadding,
              },
            ]}
          >
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={canWrite ? t('messagePlaceholder') : t('adminOnlyHint')}
              placeholderTextColor={theme.colors.textMuted}
              editable={canWrite && !sendMessageMutation.isPending}
              multiline
              style={[
                styles.composerInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
            />
            <Pressable
              onPress={() => setPollOpen(true)}
              disabled={!canWrite}
              style={[styles.roundButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: canWrite ? 1 : 0.45 }]}
            >
              <Ionicons name="add" size={26} color={theme.colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => void sendMessage()}
              disabled={!canWrite || !body.trim() || sendMessageMutation.isPending}
              style={[
                styles.roundButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: !canWrite || !body.trim() || sendMessageMutation.isPending ? 0.45 : 1,
                },
              ]}
            >
              <Ionicons name="send-outline" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      <PollComposerModal visible={pollOpen} roomId={roomId} onClose={() => setPollOpen(false)} />
    </AppScreen>
  );
}

function DateSeparator({ label, compact = false }: { label: string; compact?: boolean }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.dateSeparatorWrapper, compact ? styles.dateSeparatorWrapperCompact : null]}>
      <View style={[styles.dateSeparatorPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
      </View>
    </View>
  );
}

function PollComposerModal({ visible, roomId, onClose }: { visible: boolean; roomId?: string; onClose: () => void }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const keyboardState = useKeyboardState({
    bottomInset: insets.bottom,
    extraOffset: Platform.OS === 'android' ? ANDROID_KEYBOARD_EXTRA_OFFSET : 0,
  });
  const createPollMutation = useCreateChatPollMutation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const modalBottomInset = keyboardState.bottomInset;
  const panelBottomPadding = Math.max(keyboardState.isKeyboardVisible ? 0 : insets.bottom, 10) + 8;

  const createPoll = async () => {
    if (!roomId) {
      return;
    }

    const payload: CreatePollPayload = {
      question: question.trim(),
      options: options.map((option) => option.trim()).filter(Boolean),
      allowMultiple,
    };

    try {
      await createPollMutation.mutateAsync({ roomId, payload });
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      onClose();
    } catch {
      Alert.alert(t('pollCreateFailed'));
    }
  };

  const updateOption = (index: number, text: string) => {
    setOptions((current) =>
      ensureTrailingPollOption(current.map((option, optionIndex) => (optionIndex === index ? text : option))),
    );
  };

  const compactOptions = () => {
    setOptions((current) => ensureTrailingPollOption(current.filter((option) => option.trim().length > 0)));
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    setOptions((current) => {
      if (!current[index]?.trim()) {
        return current;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length || !current[targetIndex]?.trim()) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.pollPanel,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              marginBottom: modalBottomInset,
              paddingBottom: panelBottomPadding,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.pollHeader}>
            <AppText variant="headline">{t('createPoll')}</AppText>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pollForm}
          >
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder={t('pollQuestion')}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
            />

            {options.map((option, index) => {
              const filledOptionsCount = options.filter((currentOption) => currentOption.trim().length > 0).length;

              return (
                <PollOptionInput
                  key={index}
                  value={option}
                  placeholder={t('pollOptionAddPlaceholder')}
                  placeholderTextColor={theme.colors.textMuted}
                  backgroundColor={theme.colors.surface}
                  borderColor={theme.colors.border}
                  color={theme.colors.textPrimary}
                  dragHandleColor={theme.colors.textMuted}
                  canDrag={option.trim().length > 0 && filledOptionsCount > 1}
                  onChangeText={(text) => updateOption(index, text)}
                  onBlur={compactOptions}
                  onMove={(direction) => moveOption(index, direction)}
                />
              );
            })}

            <Pressable onPress={() => setAllowMultiple((current) => !current)} style={styles.pollToggle}>
              <Ionicons
                name={allowMultiple ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={theme.colors.textSecondary}
              />
              <AppText variant="body">{t('allowMultipleVotes')}</AppText>
            </Pressable>
          </ScrollView>

          <AppButton
            title={t('createPoll')}
            onPress={() => void createPoll()}
            disabled={createPollMutation.isPending || !question.trim() || options.filter((option) => option.trim()).length < 2}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PollOptionInput({
  value,
  placeholder,
  placeholderTextColor,
  backgroundColor,
  borderColor,
  color,
  dragHandleColor,
  canDrag,
  onChangeText,
  onBlur,
  onMove,
}: {
  value: string;
  placeholder: string;
  placeholderTextColor: string;
  backgroundColor: string;
  borderColor: string;
  color: string;
  dragHandleColor: string;
  canDrag: boolean;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canDrag,
        onMoveShouldSetPanResponder: (_, gesture) =>
          canDrag && Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -24) {
            onMove('up');
          } else if (gesture.dy > 24) {
            onMove('down');
          }
        },
      }),
    [canDrag, onMove],
  );

  return (
    <View style={[styles.pollOptionRow, { backgroundColor, borderColor }]}>
      <View {...panResponder.panHandlers} style={[styles.pollOptionDragHandle, { opacity: canDrag ? 1 : 0.35 }]}>
        <Ionicons name="reorder-three-outline" size={20} color={dragHandleColor} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={[styles.pollOptionInput, { color }]}
      />
    </View>
  );
}

function ensureTrailingPollOption(nextOptions: string[]) {
  const normalized = nextOptions.slice(0, MAX_POLL_OPTIONS);

  while (normalized.length < MIN_POLL_OPTIONS) {
    normalized.push('');
  }

  if (normalized.length < MAX_POLL_OPTIONS && normalized.every((option) => option.trim().length > 0)) {
    normalized.push('');
  }

  return normalized;
}

function getFirstUnreadMessageIndex(messages: ChatMessage[], unreadCount: number) {
  if (unreadCount <= 0) {
    return -1;
  }

  let unreadMessagesLeft = unreadCount;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (!messages[index].mine) {
      unreadMessagesLeft -= 1;
      if (unreadMessagesLeft === 0) {
        return index;
      }
    }
  }

  return -1;
}

function buildChatListItems(
  messages: ChatMessage[],
  locale: 'hr' | 'en',
  t: (key: 'today' | 'yesterday') => string,
): ChatListItem[] {
  const items: ChatListItem[] = [];
  let previousDateKey: string | null = null;

  messages.forEach((message) => {
    const dateKey = getLocalDateKey(message.createdAt);
    if (dateKey !== previousDateKey) {
      items.push({
        key: `date-${dateKey}`,
        type: 'date',
        label: formatChatDateLabel(message.createdAt, locale, t),
      });
      previousDateKey = dateKey;
    }

    items.push({
      key: message.id,
      type: 'message',
      message,
    });
  });

  return items;
}

function getLocalDateKey(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatChatDateLabel(isoDate: string, locale: 'hr' | 'en', t: (key: 'today' | 'yesterday') => string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const today = new Date();
  if (isSameLocalDay(date, today)) {
    return t('today');
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameLocalDay(date, yesterday)) {
    return t('yesterday');
  }

  const formatterLocale = locale === 'hr' ? 'hr-HR' : 'en-US';
  const weekday = new Intl.DateTimeFormat(formatterLocale, { weekday: 'short' }).format(date).replace('.', '');
  const day = new Intl.DateTimeFormat(formatterLocale, { day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat(formatterLocale, { month: 'short' }).format(date).replace('.', '');

  return `${capitalizeFirstLetter(weekday)}, ${day} ${capitalizeFirstLetter(month)}`;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function capitalizeFirstLetter(value: string) {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  header: {
    height: CHAT_HEADER_HEIGHT,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
  },
  chat: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  dateSeparatorWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateSeparatorWrapperCompact: {
    paddingVertical: 0,
  },
  stickyDateOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dateSeparatorPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  emptyMessages: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  composer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingBottom: COMPOSER_BOTTOM_PADDING,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pollPanel: {
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  pollForm: {
    gap: 12,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalInput: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  pollOptionRow: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 14,
  },
  pollOptionDragHandle: {
    width: 28,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  pollOptionInput: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
    fontSize: 16,
  },
  pollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
});
