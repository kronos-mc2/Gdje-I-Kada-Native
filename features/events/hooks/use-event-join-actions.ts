import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useGetOrCreateEventChatRoomMutation, useJoinEventMutation, useLeaveEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent } from '@/core/types/domain';

export function useEventJoinActions(event?: AppEvent | null) {
  const router = useRouter();
  const { t } = useI18n();
  const joinEventMutation = useJoinEventMutation();
  const leaveEventMutation = useLeaveEventMutation();
  const eventChatMutation = useGetOrCreateEventChatRoomMutation();
  const isJoined = event?.joinedByMe === true;
  const isJoinPending = joinEventMutation.isPending || leaveEventMutation.isPending;
  const isJoinDisabled = !event || (!isJoined && event.canJoin === false) || isJoinPending;

  const onToggleJoin = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      if (isJoined) {
        await leaveEventMutation.mutateAsync(event.id);
        Alert.alert(t('eventLeft'));
        return;
      }

      const joinedEvent = await joinEventMutation.mutateAsync(event.id);
      if (joinedEvent.attendanceStatus === 'waitlisted') {
        Alert.alert(t('eventJoined'), t('onWaitlist'));
        return;
      }

      Alert.alert(t('eventJoined'), t('joinEventChatPrompt'), [
        { text: t('notNow'), style: 'cancel' },
        {
          text: t('openMessages'),
          onPress: async () => {
            try {
              const room = await eventChatMutation.mutateAsync(joinedEvent.id);
              router.push(`/chat/${room.id}`);
            } catch {
              router.push('/(tabs)/messages');
            }
          },
        },
      ]);
    } catch {
      Alert.alert(isJoined ? t('leaveEventFailed') : t('joinEventFailed'));
    }
  }, [event, eventChatMutation, isJoined, joinEventMutation, leaveEventMutation, router, t]);

  return {
    isJoined,
    isJoinDisabled,
    isJoinPending,
    onToggleJoin,
  };
}
