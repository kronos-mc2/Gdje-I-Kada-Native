import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EventImagePreviewModal } from '@/components/events/event-image-preview-modal';
import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { getApiErrorMessage } from '@/core/api/http-client';
import {
  useApproveEventParticipantMutation,
  useBlockEventParticipantMutation,
  useDeleteEventMediaMutation,
  useDeleteEventMutation,
  useEventParticipantsQuery,
  useEventQuery,
  useRemoveEventParticipantMutation,
  useUpdateEventMutation,
  useUploadEventMediaMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { getAuthenticatedImageSource } from '@/core/events/event-cover';
import {
  isEventImageResolutionTooSmall,
  isEventImageTooLarge,
  normalizePickedEventImage,
} from '@/core/events/event-image-assets';
import {
  formatEventVideoSize,
  isEventVideoUploadUriSupported,
  isEventVideoTooLarge,
  isSupportedEventVideo,
  normalizePickedEventVideo,
} from '@/core/events/event-video-assets';
import { useAppTheme } from '@/core/theme';
import { EventMedia, EventParticipant, LocalEventImage, LocalEventVideo } from '@/core/types/domain';
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
  const uploadMediaMutation = useUploadEventMediaMutation();
  const deleteMediaMutation = useDeleteEventMediaMutation();
  const [title, setTitle] = useState('');
  const [where, setWhere] = useState('');
  const [about, setAbout] = useState('');
  const [previewMedia, setPreviewMedia] = useState<EventMedia | null>(null);

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
    if (!eventId || !event) {
      return;
    }
    if ((event.media?.length ?? 0) >= 5) {
      Alert.alert(t('validation'), t('eventImagesMax'));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('validation'), t('imagePermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.92,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    let image: LocalEventImage;
    try {
      image = await normalizePickedEventImage(result.assets[0], `event-image-${Date.now()}.jpg`);
    } catch {
      Alert.alert(t('validation'), t('eventImageConversionFailed'));
      return;
    }
    if (isEventImageTooLarge(image)) {
      Alert.alert(t('validation'), t('eventImageTooLarge'));
      return;
    }
    if (isEventImageResolutionTooSmall(image)) {
      Alert.alert(t('validation'), t('eventImageResolutionTooSmall'));
      return;
    }
    try {
      await uploadMediaMutation.mutateAsync({ eventId, media: image, mediaType: 'image' });
    } catch (error) {
      Alert.alert(t('actionFailed'), getApiErrorMessage(error) ?? undefined);
    }
  };

  const addVideo = async () => {
    if (!eventId || !event) {
      return;
    }
    if (event.media?.some((media) => media.mediaType === 'video')) {
      Alert.alert(t('validation'), t('eventVideoMax'));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('validation'), t('mediaPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      legacy: true,
      mediaTypes: 'videos',
      videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    let video: LocalEventVideo;
    try {
      video = await normalizePickedEventVideo(result.assets[0], `event-video-${Date.now()}.mp4`);
    } catch {
      Alert.alert(t('validation'), t('eventVideoUnsupported'));
      return;
    }
    if (!isSupportedEventVideo(video)) {
      Alert.alert(t('validation'), t('eventVideoUnsupported'));
      return;
    }
    if (!isEventVideoUploadUriSupported(video)) {
      Alert.alert(t('validation'), t('eventVideoCouldNotPrepare'));
      return;
    }
    if (isEventVideoTooLarge(video)) {
      Alert.alert(t('validation'), t('eventVideoTooLarge'));
      return;
    }
    try {
      await uploadMediaMutation.mutateAsync({ eventId, media: video, mediaType: 'video' });
    } catch (error) {
      Alert.alert(t('actionFailed'), getApiErrorMessage(error) ?? undefined);
    }
  };

  const deleteImage = async (mediaId: string) => {
    if (!eventId || !event) {
      return;
    }
    const media = event.media?.find((item) => item.id === mediaId);
    const imageCount = event.media?.filter((item) => item.mediaType === 'image').length ?? 0;
    if (media?.mediaType === 'image' && imageCount <= 1) {
      Alert.alert(t('validation'), t('eventImageMustRemain'));
      return;
    }
    try {
      await deleteMediaMutation.mutateAsync({ eventId: event.id, mediaId });
    } catch (error) {
      Alert.alert(t('actionFailed'), getApiErrorMessage(error) ?? undefined);
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
  const videoMedia = event?.media?.find((media) => media.mediaType === 'video');
  const imageMedia = event?.media?.filter((media) => media.mediaType === 'image') ?? [];

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

          <SectionHeader title={t('eventVideo')} subtitle={t('eventVideoHint')} />
          <AppCard variant="glass" style={styles.card}>
            {videoMedia ? (
              <View style={styles.mediaRow}>
                <View style={[styles.videoPreviewIcon, { backgroundColor: theme.colors.surfaceElevated }]}>
                  <Ionicons name="play" size={22} color={theme.colors.accent} />
                </View>
                <View style={styles.mediaCopy}>
                  <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                    {getMediaDisplayName(videoMedia, t('videoFallbackName'))}
                  </AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {formatEventVideoSize(videoMedia.byteSize) ?? t('eventVideoSelected')}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('removeVideo')}
                  disabled={deleteMediaMutation.isPending}
                  onPress={() => void deleteImage(videoMedia.id)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.mediaDeleteButton, { opacity: deleteMediaMutation.isPending ? 0.34 : pressed ? 0.68 : 1 }]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <AppButton
                title={uploadMediaMutation.isPending ? t('loading') : t('addVideo')}
                variant="secondary"
                disabled={uploadMediaMutation.isPending}
                onPress={() => void addVideo()}
              />
            )}
          </AppCard>

          <SectionHeader title={t('media')} subtitle={t('addImage')} />
          <AppCard variant="glass" style={styles.card}>
            {imageMedia.map((media) => {
              const canDeleteImage = imageMedia.length > 1 && !deleteMediaMutation.isPending;
              return (
                <View key={media.id} style={styles.mediaRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={media.fileName ?? t('media')}
                    onPress={() => setPreviewMedia(media)}
                    style={({ pressed }) => [styles.mediaPreviewButton, { opacity: pressed ? 0.74 : 1 }]}
                  >
                    <Image source={getAuthenticatedImageSource(media.thumbnailUrl ?? media.url)} style={styles.mediaImage} contentFit="cover" />
                  </Pressable>
                  <View style={styles.mediaCopy}>
                    <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                      {getMediaDisplayName(media, t('imageFallbackName'))}
                    </AppText>
                    {media.width && media.height ? (
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>
                        {media.width}x{media.height}
                      </AppText>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('removeImage')}
                    accessibilityState={{ disabled: !canDeleteImage }}
                    disabled={!canDeleteImage}
                    onPress={() => void deleteImage(media.id)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.mediaDeleteButton, { opacity: !canDeleteImage ? 0.34 : pressed ? 0.68 : 1 }]}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
                  </Pressable>
                </View>
              );
            })}
            <AppButton
              title={uploadMediaMutation.isPending ? t('loading') : t('addImage')}
              variant="secondary"
              disabled={uploadMediaMutation.isPending || imageMedia.length >= 5}
              onPress={() => void addImage()}
            />
          </AppCard>
          <EventImagePreviewModal
            visible={previewMedia != null}
            source={getAuthenticatedImageSource(previewMedia?.url)}
            title={previewMedia ? getMediaDisplayName(previewMedia, t('imageFallbackName')) : undefined}
            onClose={() => setPreviewMedia(null)}
          />

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

function getMediaDisplayName(media: EventMedia, fallbackTemplate: string) {
  if (media.fileName?.trim()) {
    return media.fileName.trim();
  }
  return fallbackTemplate.replace('{index}', String(media.sortOrder + 1));
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
  mediaPreviewButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  videoPreviewIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  mediaCopy: {
    flex: 1,
    minWidth: 0,
  },
  mediaDeleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
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
