import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useDeferredValue, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen, AppText } from '@/components/primitives';
import {
  CHAT_PEOPLE_SEARCH_MIN_LENGTH,
  useChatPeopleQuery,
  useChatRoomsQuery,
  useCreateChatRoomMutation,
  useFriendsQuery,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatPerson, Friend } from '@/core/types/domain';
import { ChatRoomRow } from '@/features/messages/components/chat-room-row';
import { useKeyboardState } from '@/features/messages/hooks/use-keyboard-bottom-inset';

const ANDROID_MODAL_KEYBOARD_EXTRA_OFFSET = 36;

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [isNewChatOpen, setNewChatOpen] = useState(false);
  const [isFriendsOpen, setFriendsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const { data: rooms = [], isLoading } = useChatRoomsQuery(deferredQuery);

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <AppText variant="display">{t('messages')}</AppText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setFriendsOpen(true)}
            style={({ pressed }) => [styles.headerIconButton, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="people-outline" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => setNewChatOpen(true)}
            style={({ pressed }) => [styles.headerIconButton, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="add" size={30} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={24} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchMessages')}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <AppText variant="body" color="textMuted" style={styles.loading}>
          {t('loading')}
        </AppText>
      ) : null}

      <FlatList
        data={rooms}
        keyExtractor={(room) => room.id}
        renderItem={({ item }) => <ChatRoomRow room={item} onPress={() => router.push(`/chat/${item.id}`)} />}
        contentContainerStyle={rooms.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <AppText variant="body" color="textMuted">
              {t('noConversations')}
            </AppText>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <NewChatModal visible={isNewChatOpen} onClose={() => setNewChatOpen(false)} />
      <FriendsModal visible={isFriendsOpen} onClose={() => setFriendsOpen(false)} />
    </AppScreen>
  );
}

function FriendsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: friends = [], isLoading } = useFriendsQuery();
  const createRoomMutation = useCreateChatRoomMutation();
  const panelBottomPadding = Math.max(insets.bottom, 10) + 8;

  const startChat = async (friend: Friend) => {
    const room = await createRoomMutation.mutateAsync({ type: 'direct', memberUserId: friend.id });
    onClose();
    router.push(`/chat/${room.id}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalPanel,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              paddingBottom: panelBottomPadding,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.modalHeader}>
            <View>
              <AppText variant="headline">{t('friends')}</AppText>
              <AppText variant="body" color="textMuted">
                {t('choosePerson')}
              </AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={friends}
            keyExtractor={(friend) => friend.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void startChat(item)}
                disabled={createRoomMutation.isPending}
                style={({ pressed }) => [styles.personRow, { opacity: pressed || createRoomMutation.isPending ? 0.7 : 1 }]}
              >
                <View style={[styles.personAvatar, { backgroundColor: theme.colors.mapAccentSoft }]}>
                  <AppText variant="label">{item.name.slice(0, 1).toUpperCase()}</AppText>
                </View>
                <View style={styles.personCopy}>
                  <AppText variant="bodyStrong">{item.name}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {item.status[locale]}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
            ListEmptyComponent={
              <AppText variant="body" color="textMuted" style={styles.loading}>
                {isLoading ? t('loading') : t('noFriends')}
              </AppText>
            }
            style={styles.peopleList}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NewChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const keyboardState = useKeyboardState({
    bottomInset: insets.bottom,
    extraOffset: Platform.OS === 'android' ? ANDROID_MODAL_KEYBOARD_EXTRA_OFFSET : 0,
  });
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim();
  const canSearchPeople = normalizedQuery.length >= CHAT_PEOPLE_SEARCH_MIN_LENGTH;
  const { data: people = [], isLoading } = useChatPeopleQuery(normalizedQuery);
  const createRoomMutation = useCreateChatRoomMutation();
  const modalBottomInset = keyboardState.bottomInset;
  const panelBottomPadding = Math.max(keyboardState.isKeyboardVisible ? 0 : insets.bottom, 10) + 8;

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const startChat = async (person: ChatPerson) => {
    const room = await createRoomMutation.mutateAsync({ type: 'direct', memberUserId: person.id });
    onClose();
    router.push(`/chat/${room.id}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalPanel,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              marginBottom: modalBottomInset,
              paddingBottom: panelBottomPadding,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.modalHeader}>
            <View>
              <AppText variant="headline">{t('newChat')}</AppText>
              <AppText variant="body" color="textMuted">
                {t('choosePerson')}
              </AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={22} color={theme.colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('searchPeople')}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={canSearchPeople ? people : []}
            keyExtractor={(person) => person.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void startChat(item)}
                disabled={createRoomMutation.isPending}
                style={({ pressed }) => [styles.personRow, { opacity: pressed || createRoomMutation.isPending ? 0.7 : 1 }]}
              >
                <View style={[styles.personAvatar, { backgroundColor: theme.colors.mapAccentSoft }]}>
                  <AppText variant="label">{item.name.slice(0, 1).toUpperCase()}</AppText>
                </View>
                <View style={styles.personCopy}>
                  <AppText variant="bodyStrong">{item.name}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {item.email}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
            ListEmptyComponent={
              <AppText variant="body" color="textMuted" style={styles.loading}>
                {!canSearchPeople ? t('typeToSearchPeople') : isLoading ? t('loading') : t('noPeopleFound')}
              </AppText>
            }
            style={styles.peopleList}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 8,
  },
  loading: {
    marginTop: 8,
  },
  list: {
    paddingBottom: 110,
  },
  emptyList: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleList: {
    marginTop: 4,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCopy: {
    flex: 1,
  },
});
