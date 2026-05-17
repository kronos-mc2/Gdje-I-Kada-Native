import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/components/primitives';
import {
  useUpdateChatNotificationSettingsMutation,
  useUpdateChatRoomMutation,
  useCreateFriendRequestMutation,
  useRespondFriendRequestMutation,
  useUserUpcomingEventsQuery,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatRoom } from '@/core/types/domain';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { ProfileEventRow } from '@/features/profile/components/profile-event-row';

type ChatDetailsPanelProps = Readonly<{
  room: ChatRoom;
}>;

export function ChatDetailsPanel({ room }: ChatDetailsPanelProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const updateRoomMutation = useUpdateChatRoomMutation();
  const updateNotificationMutation = useUpdateChatNotificationSettingsMutation();
  const createFriendRequestMutation = useCreateFriendRequestMutation();
  const respondFriendRequestMutation = useRespondFriendRequestMutation();
  const canAdmin = room.myRole === 'owner' || room.myRole === 'admin';
  const { data: upcomingEvents = [], isLoading: upcomingLoading } = useUserUpcomingEventsQuery(room.directUserId);
  const friendshipStatus = room.friendshipStatus ?? 'none';
  const pendingFriendRequest = room.pendingFriendRequest;
  const isFriendActionPending = createFriendRequestMutation.isPending || respondFriendRequestMutation.isPending;

  return (
    <ScrollView style={[styles.panel, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <AppCard variant="glass" style={styles.card}>
        <View style={styles.identityRow}>
          <ProfileAvatar name={room.title} avatarUrl={room.avatarUrl} size={54} />
          <View style={styles.identityCopy}>
            <AppText variant="headline" numberOfLines={2}>{room.title}</AppText>
            <AppText variant="body" color="textMuted">
              {getRoomTypeLabel(room.type, t)}
            </AppText>
          </View>
        </View>
        {room.type === 'direct' && room.directUserId ? (
          <FriendshipAction
            room={room}
            friendshipStatus={friendshipStatus}
            isPending={isFriendActionPending}
            onAddFriend={() => createFriendRequestMutation.mutate({ recipientUserId: room.directUserId!, chatRoomId: room.id })}
            onAccept={() =>
              pendingFriendRequest
                ? respondFriendRequestMutation.mutate({ requestId: pendingFriendRequest.id, status: 'accepted' })
                : undefined
            }
            onDecline={() =>
              pendingFriendRequest
                ? respondFriendRequestMutation.mutate({ requestId: pendingFriendRequest.id, status: 'rejected' })
                : undefined
            }
          />
        ) : null}
      </AppCard>

      <AppCard variant="glass" style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <AppText variant="bodyStrong">{t('muteNotifications')}</AppText>
            <AppText variant="caption" color="textMuted">
              {t('muteNotificationsSubtitle')}
            </AppText>
          </View>
          <Switch
            value={room.mutedByMe}
            disabled={updateNotificationMutation.isPending}
            onValueChange={(muted) => updateNotificationMutation.mutate({ roomId: room.id, muted })}
          />
        </View>
      </AppCard>

      {room.type !== 'direct' ? (
        <AppCard variant="glass" style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <AppText variant="bodyStrong">{t('adminOnlyMode')}</AppText>
              <AppText variant="caption" color="textMuted">
                {t('adminOnlyHint')}
              </AppText>
            </View>
            <Switch
              value={room.adminOnly}
              disabled={!canAdmin || updateRoomMutation.isPending}
              onValueChange={(adminOnly) => updateRoomMutation.mutate({ roomId: room.id, adminOnly })}
            />
          </View>
        </AppCard>
      ) : null}

      {room.type !== 'direct' ? (
        <AppCard variant="glass" style={styles.card}>
          <AppText variant="bodyStrong">{t('chatMembers')}</AppText>
          {room.members?.length ? (
            room.members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberIdentity}>
                  <ProfileAvatar name={member.name} avatarUrl={member.avatarUrl} size={34} />
                  <AppText variant="body" numberOfLines={1} style={styles.memberName}>
                    {member.name}
                  </AppText>
                </View>
                <AppText variant="caption" color="textMuted">
                  {member.role}
                </AppText>
              </View>
            ))
          ) : (
            <AppText variant="body" color="textMuted">
              {t('noChatMembers')}
            </AppText>
          )}
        </AppCard>
      ) : null}

      {room.type === 'direct' ? (
        <AppCard variant="glass" style={styles.card}>
          <AppText variant="bodyStrong">{t('upcomingEvents')}</AppText>
          {upcomingLoading ? (
            <AppText variant="body" color="textMuted">
              {t('loading')}
            </AppText>
          ) : upcomingEvents.length ? (
            upcomingEvents.map((event) => (
              <ProfileEventRow
                key={event.id}
                event={event}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
              />
            ))
          ) : (
            <AppText variant="body" color="textMuted">
              {t('noUpcomingUserEvents')}
            </AppText>
          )}
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

function FriendshipAction({
  room,
  friendshipStatus,
  isPending,
  onAddFriend,
  onAccept,
  onDecline,
}: Readonly<{
  room: ChatRoom;
  friendshipStatus: NonNullable<ChatRoom['friendshipStatus']>;
  isPending: boolean;
  onAddFriend: () => void;
  onAccept: () => void;
  onDecline: () => void;
}>) {
  const { t } = useI18n();
  const hasPendingRequest = Boolean(room.pendingFriendRequest);

  if (friendshipStatus === 'friends') {
    return <AppButton title={t('alreadyFriends')} variant="secondary" disabled />;
  }

  if (friendshipStatus === 'pending_sent') {
    return <AppButton title={t('friendRequestPending')} variant="secondary" disabled />;
  }

  if (friendshipStatus === 'pending_received' && hasPendingRequest) {
    return (
      <View style={styles.friendshipActions}>
        <AppButton title={isPending ? t('loading') : t('approve')} disabled={isPending} onPress={onAccept} style={styles.friendshipButton} />
        <AppButton
          title={t('decline')}
          variant="secondary"
          disabled={isPending}
          onPress={onDecline}
          style={styles.friendshipButton}
        />
      </View>
    );
  }

  return <AppButton title={isPending ? t('loading') : t('addFriend')} variant="secondary" disabled={isPending} onPress={onAddFriend} />;
}

function getRoomTypeLabel(roomType: ChatRoom['type'], t: ReturnType<typeof useI18n>['t']) {
  if (roomType === 'event') {
    return t('eventChat');
  }
  if (roomType === 'group') {
    return t('groupChat');
  }
  return t('directChat');
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  memberIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberName: {
    flex: 1,
  },
  friendshipActions: {
    flexDirection: 'row',
    gap: 10,
  },
  friendshipButton: {
    flex: 1,
  },
});
