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
  const isActiveAttendance = event?.attendanceStatus === 'joined' || event?.attendanceStatus === 'approved';
  const isWaitlisted = event?.attendanceStatus === 'waitlisted';
  const canLeave = isActiveAttendance || isWaitlisted;
  const canOpenEventChat = isActiveAttendance;
  const promptForEventChat = useCallback(
    (joinedEvent: AppEvent) => {
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
    },
    [eventChatMutation, router, t],
  );
  const isJoinPending = joinEventMutation.isPending || leaveEventMutation.isPending;
  const isJoinDisabled = !event || (!canLeave && event.canJoin === false) || isJoinPending;
  const joinButtonTitle = getJoinButtonTitle(event, canLeave, isWaitlisted, t);

  const onToggleJoin = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      if (canLeave) {
        Alert.alert(isWaitlisted ? t('leaveWaitlistConfirmTitle') : t('leaveEventConfirmTitle'), t('leaveEventConfirmBody'), [
          { text: t('cancel'), style: 'cancel' },
          {
            text: isWaitlisted ? t('leaveWaitlist') : t('leaveEvent'),
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveEventMutation.mutateAsync(event.id);
                Alert.alert(isWaitlisted ? t('waitlistLeft') : t('eventLeft'));
              } catch {
                Alert.alert(t('leaveEventFailed'));
              }
            },
          },
        ]);
        return;
      }

      if (event.attendanceMode === 'paid') {
        router.push({ pathname: '/tickets/checkout', params: { eventId: event.id } });
        return;
      }

      const joinedEvent = await joinEventMutation.mutateAsync(event.id);
      if (joinedEvent.attendanceStatus === 'waitlisted') {
        Alert.alert(t('eventJoined'), t('onWaitlist'));
        return;
      }

      promptForEventChat(joinedEvent);
    } catch {
      Alert.alert(canLeave ? t('leaveEventFailed') : t('joinEventFailed'));
    }
  }, [canLeave, event, isWaitlisted, joinEventMutation, leaveEventMutation, promptForEventChat, router, t]);

  const openEventChat = useCallback(async () => {
    if (!event || !canOpenEventChat) {
      return;
    }

    try {
      const room = await eventChatMutation.mutateAsync(event.id);
      router.push(`/chat/${room.id}`);
    } catch {
      router.push('/(tabs)/messages');
    }
  }, [canOpenEventChat, event, eventChatMutation, router]);

  return {
    isJoined: canLeave,
    isJoinDisabled,
    isJoinPending,
    joinButtonTitle,
    onToggleJoin,
    canOpenEventChat,
    isEventChatPending: eventChatMutation.isPending,
    openEventChat,
  };
}

function getJoinButtonTitle(
  event: AppEvent | null | undefined,
  canLeave: boolean,
  isWaitlisted: boolean,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (isWaitlisted) {
    return t('leaveWaitlist');
  }
  if (canLeave) {
    return t('leaveEvent');
  }
  if (event?.attendanceMode === 'paid') {
    return t('buyTicket');
  }
  if (event?.attendanceMode === 'waitlist') {
    return t('joinWaitlist');
  }
  return t('joinEvent');
}
