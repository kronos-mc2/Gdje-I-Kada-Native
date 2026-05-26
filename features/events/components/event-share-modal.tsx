import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppText } from '@/components/primitives';
import { useCreateChatRoomMutation, useEventShareRecipientsQuery, useShareEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import type { AppEvent, Friend, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type EventShareModalProps = {
  event?: AppEvent | null;
  visible: boolean;
  locale: Locale;
  onClose: () => void;
};

export function EventShareModal({ event, visible, locale, onClose }: EventShareModalProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: shareRecipients = [], isLoading: isRecipientsLoading } = useEventShareRecipientsQuery(event?.id);
  const createChatRoomMutation = useCreateChatRoomMutation();
  const shareEventMutation = useShareEventMutation();
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(() => new Set());
  const selectedCount = selectedFriendIds.size;
  const isSharing = createChatRoomMutation.isPending || shareEventMutation.isPending;

  const nativeMessage = useMemo(() => {
    if (!event) {
      return '';
    }

    return `${event.title[locale]}\n${event.where[locale]}\n${formatEventDate(event.whenISO, locale)}\n\n${event.about[locale]}`;
  }, [event, locale]);

  useEffect(() => {
    setSelectedFriendIds(new Set());
  }, [visible, event?.id]);

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds((current) => {
      const next = new Set(current);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const onNativeShare = async () => {
    if (!event) {
      return;
    }

    try {
      await Share.share({
        title: event.title[locale],
        message: nativeMessage,
      });
    } catch {
      // ignore native share dismiss/errors
    }
  };

  const onShareToSelected = async () => {
    if (!event || selectedFriendIds.size === 0) {
      return;
    }

    try {
      const selectedFriends = shareRecipients.filter((friend) => selectedFriendIds.has(friend.id));
      for (const friend of selectedFriends) {
        const room = await createChatRoomMutation.mutateAsync({ type: 'direct', memberUserId: friend.id });
        await shareEventMutation.mutateAsync({ conversationId: room.id, eventId: event.id });
      }
      Alert.alert(t('eventSharedToSelected'), event.title[locale]);
      onClose();
    } catch {
      Alert.alert(t('eventShareFailed'));
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const selected = selectedFriendIds.has(item.id);
    return (
      <Pressable
        onPress={() => toggleFriend(item.id)}
        disabled={isSharing}
        style={({ pressed }) => [
          styles.friendBubble,
          {
            opacity: pressed || isSharing ? 0.78 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.avatarRing,
            {
              borderColor: selected ? theme.colors.mapAccent : 'transparent',
              backgroundColor: selected ? theme.colors.mapAccentSoft : 'transparent',
            },
          ]}
        >
          <ProfileAvatar name={item.name} avatarUrl={item.avatarUrl} size={58} />
          {selected ? (
            <View style={[styles.checkBadge, { backgroundColor: theme.colors.mapAccent, borderColor: theme.colors.background }]}>
              <Ionicons name="checkmark" size={13} color={theme.colors.textPrimary} />
            </View>
          ) : null}
        </View>
        <AppText variant="caption" numberOfLines={2} style={styles.friendName}>
          {item.name}
        </AppText>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible && !!event} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.overlay,
            paddingTop: insets.top + 28,
          },
        ]}
        onPress={onClose}
      >
        <Pressable style={styles.panelPressable} onPress={() => {}}>
          <AppCard variant="glass" style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <AppText variant="headline">{t('shareEvent')}</AppText>
                {event ? (
                  <AppText variant="body" color="textSecondary" style={styles.eventTitle}>
                    {event.title[locale]}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, { borderColor: theme.colors.border, opacity: pressed ? 0.74 : 1 }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
              {t('shareToFriends')}
            </AppText>
            {event?.visibility === 'friends' ? (
              <AppText variant="caption" color="textMuted">
                {t('friendsEventShareHelp')}
              </AppText>
            ) : null}

            {isRecipientsLoading ? (
              <AppText variant="body" color="textMuted">
                {t('loading')}
              </AppText>
            ) : shareRecipients.length === 0 ? (
              <AppText variant="body" color="textMuted">
                {t('noFriendsToShare')}
              </AppText>
            ) : (
              <FlatList
                data={shareRecipients}
                keyExtractor={(friend) => friend.id}
                renderItem={renderFriend}
                numColumns={4}
                style={styles.friendsList}
                contentContainerStyle={styles.friendsListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}

            <View style={styles.footerActions}>
              <AppButton
                title={isSharing ? t('loading') : t('shareToSelected')}
                variant="primary"
                style={styles.primaryFooterButton}
                disabled={selectedCount === 0 || isSharing}
                onPress={() => void onShareToSelected()}
              />
              {event?.visibility === 'friends' ? null : (
                <AppButton
                  title={t('shareOutsideApp')}
                  variant="glass"
                  style={styles.secondaryFooterButton}
                  disabled={isSharing}
                  onPress={() => void onNativeShare()}
                />
              )}
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  panelPressable: {
    width: '100%',
  },
  panel: {
    gap: 14,
    maxHeight: '96%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eventTitle: {
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: 4,
  },
  friendsList: {
    maxHeight: 940,
  },
  friendsListContent: {
    paddingTop: 12,
    paddingBottom: 18,
  },
  friendBubble: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 12,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendName: {
    marginTop: 6,
    textAlign: 'center',
    minHeight: 36,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  primaryFooterButton: {
    flex: 1.25,
  },
  secondaryFooterButton: {
    flex: 1,
  },
});
