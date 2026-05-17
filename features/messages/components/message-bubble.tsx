import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useRespondFriendRequestMutation, useVotePollMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatMessage, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type MessageBubbleProps = Readonly<{
  message: ChatMessage;
  locale: Locale;
  onOpenEvent: (eventId: string) => void;
}>;

export function MessageBubble({ message, locale, onOpenEvent }: MessageBubbleProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const voteMutation = useVotePollMutation();
  const respondFriendRequestMutation = useRespondFriendRequestMutation();
  const alignSelf = message.mine ? 'flex-end' : 'flex-start';
  const bubbleColor = message.mine ? theme.colors.surfaceElevated : theme.colors.surface;

  const vote = (pollId: string, optionId: string, allowMultiple: boolean, currentOptionIds: string[]) => {
    const optionIds = getNextVoteOptionIds(allowMultiple, currentOptionIds, optionId);
    if (optionIds.length === 0) {
      return;
    }
    voteMutation.mutate({ pollId, optionIds });
  };

  return (
    <View style={[styles.wrapper, { alignSelf }]}>
      {!message.mine && message.senderName ? (
        <View style={styles.senderRow}>
          <ProfileAvatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size={24} />
          <AppText variant="caption" color="textMuted" style={styles.sender}>
            {message.senderName}
          </AppText>
        </View>
      ) : null}
      <View style={[styles.bubble, { backgroundColor: bubbleColor, borderColor: theme.colors.border }]}>
        {message.type === 'text' ? (
          <AppText variant="body">{message.body}</AppText>
        ) : null}

        {message.type === 'event_share' && message.event ? (
          <Pressable onPress={() => onOpenEvent(message.event!.id)} style={styles.eventCard}>
            {message.event.coverUrl ? <Image source={{ uri: message.event.coverUrl }} style={styles.eventImage} /> : null}
            <View style={styles.eventCopy}>
              <AppText variant="caption" color="textMuted">
                {t('sharedEvent')}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={2}>
                {message.event.title[locale]}
              </AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {message.event.where[locale]} · {formatEventDate(message.event.whenISO, locale)}
              </AppText>
              <View style={styles.eventCta}>
                <AppText variant="label">{t('openEvent')}</AppText>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textPrimary} />
              </View>
            </View>
          </Pressable>
        ) : null}

        {message.type === 'poll' && message.poll ? (
          <View style={styles.poll}>
            <AppText variant="bodyStrong">{message.poll.question}</AppText>
            {message.poll.options.map((option) => {
              const ratio = message.poll!.totalVotes > 0 ? option.voteCount / message.poll!.totalVotes : 0;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => vote(message.poll!.id, option.id, message.poll!.allowMultiple, message.poll!.myOptionIds)}
                  disabled={voteMutation.isPending || message.poll!.closed}
                  style={({ pressed }) => [
                    styles.pollOption,
                    {
                      borderColor: option.votedByMe ? theme.colors.mapAccent : theme.colors.border,
                      backgroundColor: theme.colors.card,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <View style={[styles.pollFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: theme.colors.mapAccentSoft }]} />
                  <AppText variant="caption" style={styles.pollOptionText}>
                    {option.text}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {option.voteCount}
                  </AppText>
                </Pressable>
              );
            })}
            <AppText variant="caption" color="textMuted">
              {message.poll.totalVotes} {t('votes')}
            </AppText>
          </View>
        ) : null}

        {message.type === 'friend_request' && message.friendRequest ? (
          <View style={styles.friendRequest}>
            <AppText variant="bodyStrong">{t('friendRequest')}</AppText>
            <AppText variant="caption" color="textMuted">
              {getFriendRequestLabel(message)}
            </AppText>
            {message.friendRequest.status === 'pending' && !message.mine ? (
              <View style={styles.friendRequestActions}>
                <Pressable
                  disabled={respondFriendRequestMutation.isPending}
                  onPress={() => respondFriendRequestMutation.mutate({ requestId: message.friendRequest!.id, status: 'accepted' })}
                  style={[styles.friendRequestButton, { backgroundColor: theme.colors.mapAccent }]}
                >
                  <AppText variant="caption">{t('approve')}</AppText>
                </Pressable>
                <Pressable
                  disabled={respondFriendRequestMutation.isPending}
                  onPress={() => respondFriendRequestMutation.mutate({ requestId: message.friendRequest!.id, status: 'rejected' })}
                  style={[styles.friendRequestButton, { backgroundColor: theme.colors.surfaceElevated }]}
                >
                  <AppText variant="caption">{t('decline')}</AppText>
                </Pressable>
              </View>
            ) : (
              <AppText variant="caption" color="textMuted">
                {getFriendRequestStatusLabel(message.friendRequest.status, t)}
              </AppText>
            )}
          </View>
        ) : null}

        <AppText variant="caption" color="textMuted" style={styles.time}>
          {message.timeLabel}
        </AppText>
      </View>
    </View>
  );
}

function getNextVoteOptionIds(allowMultiple: boolean, currentOptionIds: string[], optionId: string) {
  if (!allowMultiple) {
    return [optionId];
  }
  return currentOptionIds.includes(optionId)
    ? currentOptionIds.filter((currentOptionId) => currentOptionId !== optionId)
    : [...currentOptionIds, optionId];
}

function getFriendRequestLabel(message: ChatMessage) {
  const request = message.friendRequest;
  if (!request) {
    return '';
  }
  return message.mine
    ? request.recipientName ?? ''
    : request.requesterName ?? '';
}

function getFriendRequestStatusLabel(status: NonNullable<ChatMessage['friendRequest']>['status'], t: ReturnType<typeof useI18n>['t']) {
  if (status === 'accepted') {
    return t('friendRequestAccepted');
  }
  if (status === 'rejected') {
    return t('friendRequestRejected');
  }
  return t('friendRequestPending');
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '82%',
    marginBottom: 12,
  },
  sender: {
    flex: 1,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  eventCard: {
    minWidth: 220,
    gap: 10,
  },
  eventImage: {
    height: 112,
    borderRadius: 14,
  },
  eventCopy: {
    gap: 4,
  },
  eventCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 4,
  },
  poll: {
    minWidth: 230,
    gap: 8,
  },
  friendRequest: {
    minWidth: 220,
    gap: 8,
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendRequestButton: {
    minHeight: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pollOption: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollFill: {
    ...StyleSheet.absoluteFillObject,
  },
  pollOptionText: {
    flex: 1,
  },
});
