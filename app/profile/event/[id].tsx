import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import {
  useAddEventMediaMutation,
  useApproveEventParticipantMutation,
  useBlockEventParticipantMutation,
  useDeleteEventMediaMutation,
  useDeleteEventMutation,
  useEventParticipantsQuery,
  useEventQuery,
  useRemoveEventParticipantMutation,
  useUpdateEventMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { EventParticipant } from '@/core/types/domain';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

export default function ManageCreatedEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { data: event } = useEventQuery(eventId);
  const { data: participants = [] } = useEventParticipantsQuery(eventId);
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const addMediaMutation = useAddEventMediaMutation();
  const deleteMediaMutation = useDeleteEventMediaMutation();
  const [title, setTitle] = useState('');
  const [where, setWhere] = useState('');
  const [about, setAbout] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!event) {
      return;
    }
    setTitle(event.title[locale] ?? '');
    setWhere(event.where[locale] ?? '');
    setAbout(event.about[locale] ?? '');
  }, [event, locale]);

  const save = async () => {
    if (!eventId || !event) {
      return;
    }
    try {
      await updateEventMutation.mutateAsync({
        eventId,
        payload: {
          title: title.trim(),
          where: where.trim(),
          about: about.trim(),
          address: event.address,
          startAt: event.startAt,
          whenISO: event.whenISO,
          endAt: event.endAt,
          coordinates: event.coordinates,
          entranceCoordinates: event.entranceCoordinates,
          entryInstructions: event.entryInstructions?.[locale],
          visibility: event.visibility,
          attendanceMode: event.attendanceMode,
          priceAmount: event.priceAmount,
          priceCurrency: event.priceCurrency,
          capacity: event.capacity,
          status: event.status,
        },
      });
      Alert.alert(t('eventSaved'));
    } catch {
      Alert.alert(t('eventSaveFailed'));
    }
  };

  const addImage = async () => {
    if (!eventId || !imageUrl.trim()) {
      return;
    }
    try {
      await addMediaMutation.mutateAsync({ eventId, payload: { mediaType: 'image', url: imageUrl.trim() } });
      setImageUrl('');
    } catch {
      Alert.alert(t('actionFailed'));
    }
  };

  const deleteEvent = () => {
    if (!eventId) {
      return;
    }
    Alert.alert(t('deleteEvent'), t('deleteEvent'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteEvent'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventMutation.mutateAsync(eventId);
            Alert.alert(t('eventDeleted'));
            router.replace('/profile/created-events');
          } catch {
            Alert.alert(t('eventDeleteFailed'));
          }
        },
      },
    ]);
  };

  const waitlisted = participants.filter((participant) => participant.status === 'waitlisted');
  const activeParticipants = participants.filter((participant) => participant.status !== 'waitlisted');

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('manageEvent')}</AppText>
        <AppIconButton icon="trash-outline" onPress={deleteEvent} />
      </View>

      {!event ? (
        <AppText variant="body" color="textMuted">
          {t('loading')}
        </AppText>
      ) : (
        <>
          <SectionHeader title={t('details')} subtitle={event.address} />
          <AppCard variant="glass" style={styles.card}>
            <AppInput label={t('titleLabel')} value={title} onChangeText={setTitle} />
            <AppInput label={t('locationLabel')} value={where} onChangeText={setWhere} />
            <AppInput label={t('aboutLabel')} value={about} onChangeText={setAbout} multiline style={styles.textArea} />
            <AppButton title={updateEventMutation.isPending ? t('loading') : t('submit')} onPress={() => void save()} />
          </AppCard>

          <SectionHeader title={t('media')} subtitle={t('addImage')} />
          <AppCard variant="glass" style={styles.card}>
            {event.media?.map((media) => (
              <View key={media.id} style={styles.mediaRow}>
                <Image source={{ uri: media.thumbnailUrl ?? media.url }} style={styles.mediaImage} contentFit="cover" />
                <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.mediaUrl}>
                  {media.url}
                </AppText>
                <Pressable onPress={() => deleteMediaMutation.mutate({ eventId: event.id, mediaId: media.id })} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            ))}
            <AppInput label={t('imageUrlLabel')} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />
            <AppButton title={t('addImage')} variant="secondary" disabled={!imageUrl.trim()} onPress={() => void addImage()} />
          </AppCard>

          <SectionHeader title={t('waitlist')} subtitle={`${waitlisted.length} ${t('waitlistWaiting')}`} />
          <AppCard variant="glass" style={styles.card}>
            {waitlisted.length ? (
              waitlisted.map((participant) => <ParticipantRow key={participant.userId} eventId={event.id} eventIsPaid={event.attendanceMode === 'paid'} participant={participant} />)
            ) : (
              <AppText variant="body" color="textMuted">
                {t('noWaitlistWaiting')}
              </AppText>
            )}
          </AppCard>

          <SectionHeader title={t('attendees')} subtitle={`${activeParticipants.length} ${t('participants')}`} />
          <AppCard variant="glass" style={styles.card}>
            {activeParticipants.length ? (
              activeParticipants.map((participant) => <ParticipantRow key={participant.userId} eventId={event.id} eventIsPaid={event.attendanceMode === 'paid'} participant={participant} />)
            ) : (
              <AppText variant="body" color="textMuted">
                {t('noChatMembers')}
              </AppText>
            )}
          </AppCard>
        </>
      )}
    </AppScreen>
  );
}

function ParticipantRow({
  eventId,
  eventIsPaid,
  participant,
}: {
  eventId: string;
  eventIsPaid: boolean;
  participant: EventParticipant;
}) {
  const { t } = useI18n();
  const approveMutation = useApproveEventParticipantMutation();
  const removeMutation = useRemoveEventParticipantMutation();
  const blockMutation = useBlockEventParticipantMutation();

  const run = async (action: 'approve' | 'remove' | 'block') => {
    try {
      if (action === 'approve') {
        await approveMutation.mutateAsync({ eventId, userId: participant.userId });
      } else if (action === 'remove') {
        await removeMutation.mutateAsync({ eventId, userId: participant.userId });
      } else {
        await blockMutation.mutateAsync({ eventId, userId: participant.userId });
      }
    } catch {
      Alert.alert(t('actionFailed'));
    }
  };

  return (
    <View style={styles.participantRow}>
      <ProfileAvatar name={participant.name} avatarUrl={participant.avatarUrl} size={38} />
      <View style={styles.participantCopy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {participant.name}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {participant.blocked ? t('attendanceBlocked') : participant.status === 'rejected' ? t('attendanceRemoved') : participant.status}
        </AppText>
      </View>
      {participant.status === 'waitlisted' ? (
        <AppButton title={t('approve')} variant="secondary" style={styles.smallButton} onPress={() => void run('approve')} />
      ) : null}
      <AppButton title={t('remove')} variant="ghost" style={styles.smallButton} onPress={() => void run('remove')} />
      {!eventIsPaid ? <AppButton title={t('block')} variant="ghost" style={styles.smallButton} onPress={() => void run('block')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    gap: 12,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  mediaUrl: {
    flex: 1,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  participantCopy: {
    flex: 1,
    minWidth: 0,
  },
  smallButton: {
    minHeight: 34,
    paddingHorizontal: 10,
  },
});
