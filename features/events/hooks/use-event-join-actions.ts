import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useGetOrCreateEventChatRoomMutation, useJoinEventMutation, useLeaveEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent } from '@/core/types/domain';
import { usePaidEventCheckout } from '@/features/payments/hooks/use-paid-event-checkout';

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
  const joinAlreadyPaidEvent = useCallback((eventId: string) => joinEventMutation.mutateAsync(eventId), [joinEventMutation]);
  const { isPending: isPaidJoinPending, startPaidJoin } = usePaidEventCheckout({
    onAlreadyPaid: joinAlreadyPaidEvent,
    onJoined: promptForEventChat,
  });
  const isJoinPending = joinEventMutation.isPending || leaveEventMutation.isPending || isPaidJoinPending;
  const isJoinDisabled = !event || (!canLeave && event.canJoin === false) || isJoinPending;
  const joinButtonTitle = isWaitlisted
    ? t('leaveWaitlist')
    : !canLeave && event?.attendanceMode === 'paid'
      ? t('buyTicket')
      : canLeave
        ? t('leaveEvent')
        : t('joinEvent');

  const onToggleJoin = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      if (canLeave) {
        await leaveEventMutation.mutateAsync(event.id);
        Alert.alert(isWaitlisted ? t('waitlistLeft') : t('eventLeft'));
        return;
      }

      if (event.attendanceMode === 'paid') {
        await startPaidJoin(event);
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
  }, [canLeave, event, isWaitlisted, joinEventMutation, leaveEventMutation, promptForEventChat, startPaidJoin, t]);

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
