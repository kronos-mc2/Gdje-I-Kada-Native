import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton, AppScreen, AppText } from '@/components/primitives';
import { useChatRoomQuery, useCreateChatPollMutation, useSendChatMessageMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatMessage, CreatePollPayload } from '@/core/types/domain';
import { ChatDetailsPanel } from '@/features/messages/components/chat-details-panel';
import { MessageBubble } from '@/features/messages/components/message-bubble';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { data, isLoading } = useChatRoomQuery(roomId);
  const sendMessageMutation = useSendChatMessageMutation();
  const [body, setBody] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const room = data?.room;
  const messages = data?.messages ?? [];
  const canWrite = room ? !room.adminOnly || room.myRole === 'owner' || room.myRole === 'admin' : false;

  const sendMessage = async () => {
    const text = body.trim();
    if (!roomId || !text) {
      return;
    }

    try {
      setBody('');
      await sendMessageMutation.mutateAsync({ roomId, body: text });
    } catch {
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
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.mapAccentSoft }]}>
            <AppText variant="label">{room?.title.slice(0, 1).toUpperCase() ?? 'G'}</AppText>
          </View>
          <View style={styles.headerCopy}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {room?.title ?? t('loading')}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {room?.adminOnly ? t('adminOnlyMode') : (room?.subtitle ?? t('chats'))}
            </AppText>
          </View>
        </Pressable>
      </View>

      {detailsOpen && room ? (
        <ChatDetailsPanel room={room} />
      ) : (
        <KeyboardAvoidingView style={styles.chat} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={18}>
          <FlatList<ChatMessage>
            data={messages}
            keyExtractor={(message) => message.id}
            renderItem={({ item }) => <MessageBubble message={item} locale={locale} onOpenEvent={openEvent} />}
            contentContainerStyle={messages.length === 0 ? styles.emptyMessages : styles.messageList}
            ListEmptyComponent={
              <AppText variant="body" color="textMuted">
                {isLoading ? t('loading') : t('noConversations')}
              </AppText>
            }
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.composer, { borderTopColor: theme.colors.border }]}>
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

function PollComposerModal({ visible, roomId, onClose }: { visible: boolean; roomId?: string; onClose: () => void }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const createPollMutation = useCreateChatPollMutation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.pollPanel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => {}}>
          <View style={styles.pollHeader}>
            <AppText variant="headline">{t('createPoll')}</AppText>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={t('pollQuestion')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.modalInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          />

          {options.map((option, index) => (
            <TextInput
              key={index}
              value={option}
              onChangeText={(text) => setOptions((current) => current.map((value, optionIndex) => (optionIndex === index ? text : value)))}
              placeholder={`${t('pollOptionPlaceholder')} ${index + 1}`}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
            />
          ))}

          <Pressable onPress={() => setOptions((current) => [...current, ''])} style={styles.pollToggle}>
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.textSecondary} />
            <AppText variant="body">{t('addPollOption')}</AppText>
          </Pressable>

          <Pressable onPress={() => setAllowMultiple((current) => !current)} style={styles.pollToggle}>
            <Ionicons
              name={allowMultiple ? 'checkbox-outline' : 'square-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
            <AppText variant="body">{t('allowMultipleVotes')}</AppText>
          </Pressable>

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

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  header: {
    height: 68,
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
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 18,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 18,
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
  pollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
});
