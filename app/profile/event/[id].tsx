import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EventImagePreviewModal } from '@/components/events/event-image-preview-modal';
import { EventMap } from '@/components/map';
import { AppButton, AppCard, AppDateTimeField, AppIconButton, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
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
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { Coordinates, EventAttendanceMode, EventMedia, EventParticipant, EventVisibility, LocalEventImage, LocalEventVideo } from '@/core/types/domain';
import { CreateEventAddressField } from '@/features/events/create/create-event-address-field';
import { parseOptionalMoneyAmount, parseOptionalPositiveInteger } from '@/features/events/create/create-event-form';
import { CreateEventSegmentedControl } from '@/features/events/create/create-event-segmented-control';
import { CreateEventTagSelector } from '@/features/events/create/create-event-tag-selector';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { LocationSearchResult } from '@/services/locationSearch';

export default function ManageCreatedEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const userLocation = useAppStore((state) => state.userLocation);
  const pickedEntranceCoordinates = useAppStore((state) => state.fypEntranceCoordinates);
  const clearEntranceCoordinates = useAppStore((state) => state.clearFypEntranceCoordinates);
  const { data: event } = useEventQuery(eventId);
  const { data: participants = [] } = useEventParticipantsQuery(eventId);
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const uploadMediaMutation = useUploadEventMediaMutation();
  const deleteMediaMutation = useDeleteEventMediaMutation();
  const [title, setTitle] = useState('');
  const [where, setWhere] = useState('');
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [entryInstructions, setEntryInstructions] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [attendanceMode, setAttendanceMode] = useState<EventAttendanceMode>('open');
  const [priceAmount, setPriceAmount] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('EUR');
  const [capacity, setCapacity] = useState('');
  const [eventCoordinates, setEventCoordinates] = useState<Coordinates | null>(null);
  const [entranceCoordinates, setEntranceCoordinates] = useState<Coordinates | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<EventMedia | null>(null);

  useEffect(() => {
    if (!event) {
      return;
    }
    setTitle(event.title[locale] ?? '');
    setWhere(event.where[locale] ?? '');
    setAddress(event.address ?? '');
    setAbout(event.about[locale] ?? '');
    setStartAt(event.startAt ?? event.whenISO ?? '');
    setEndAt(event.endAt ?? '');
    setEntryInstructions(event.entryInstructions?.[locale] ?? '');
    setVisibility(event.visibility ?? 'public');
    setAttendanceMode(event.attendanceMode ?? 'open');
    setPriceAmount(event.priceAmount == null ? '' : String(event.priceAmount));
    setPriceCurrency(event.priceCurrency ?? 'EUR');
    setCapacity(event.capacity == null ? '' : String(event.capacity));
    setEventCoordinates(event.coordinates);
    setEntranceCoordinates(event.entranceCoordinates ?? null);
    setSelectedTags(event.tags ?? []);
    clearEntranceCoordinates();
  }, [clearEntranceCoordinates, event, locale]);

  useEffect(() => {
    if (!pickedEntranceCoordinates) {
      return;
    }

    setEntranceCoordinates(pickedEntranceCoordinates);
    clearEntranceCoordinates();
  }, [clearEntranceCoordinates, pickedEntranceCoordinates]);

  const updateAddress = (value: string) => {
    setAddress(value);
    setEventCoordinates(null);
    setEntranceCoordinates(null);
    clearEntranceCoordinates();
  };

  const selectAddress = (result: LocationSearchResult) => {
    setEventCoordinates(result.coordinates);
    setWhere((current) => (current.trim() ? current : result.title));
  };

  const openEntrancePicker = () => {
    if (!eventCoordinates) {
      return;
    }

    router.push({
      pathname: '/entrance-map-picker',
      params: {
        centerLat: String(entranceCoordinates?.latitude ?? eventCoordinates.latitude),
        centerLng: String(entranceCoordinates?.longitude ?? eventCoordinates.longitude),
      },
    });
  };

  const save = async () => {
    if (!eventId || !event) {
      return;
    }
    if (!title.trim() || !where.trim() || !address.trim() || !about.trim() || !startAt.trim()) {
      Alert.alert(t('validation'), t('fillAllFields'));
      return;
    }
    if (Number.isNaN(new Date(startAt).getTime()) || (endAt.trim() && Number.isNaN(new Date(endAt).getTime()))) {
      Alert.alert(t('validation'), t('invalidDate'));
      return;
    }
    if (endAt.trim() && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      Alert.alert(t('validation'), t('invalidEndDate'));
      return;
    }
    if (!eventCoordinates) {
      Alert.alert(t('validation'), t('selectAddressFromSuggestions'));
      return;
    }

    const parsedCapacity = parseOptionalPositiveInteger(capacity);
    if (parsedCapacity === null) {
      Alert.alert(t('validation'), t('invalidCapacity'));
      return;
    }

    const parsedPriceAmount = attendanceMode === 'paid' ? parseOptionalMoneyAmount(priceAmount) : undefined;
    if (attendanceMode === 'paid' && parsedPriceAmount === null) {
      Alert.alert(t('validation'), t('invalidPrice'));
      return;
    }
    if (attendanceMode === 'paid' && priceCurrency.trim().toUpperCase().length !== 3) {
      Alert.alert(t('validation'), t('invalidCurrency'));
      return;
    }

    try {
      await updateEventMutation.mutateAsync({
        eventId,
        payload: {
          title: title.trim(),
          where: where.trim(),
          about: about.trim(),
          address: address.trim(),
          startAt,
          whenISO: startAt,
          endAt: endAt.trim(),
          coordinates: eventCoordinates,
          entranceCoordinates: entranceCoordinates ?? undefined,
          entryInstructions: entryInstructions.trim(),
          visibility,
          attendanceMode,
          priceAmount: typeof parsedPriceAmount === 'number' ? parsedPriceAmount : undefined,
          priceCurrency: attendanceMode === 'paid' ? priceCurrency.trim().toUpperCase() : undefined,
          capacity: typeof parsedCapacity === 'number' ? parsedCapacity : undefined,
          status: event.status,
          tags: selectedTags,
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
            <AppDateTimeField label={t('startDateLabel')} locale={locale} valueISO={startAt} onChangeISO={setStartAt} />
            <AppDateTimeField
              label={`${t('endDateLabel')} (${t('optional')})`}
              locale={locale}
              valueISO={endAt}
              onChangeISO={setEndAt}
              onClear={() => setEndAt('')}
              clearAccessibilityLabel={t('clearDateTime')}
            />
            <CreateEventAddressField
              label={t('addressLabel')}
              value={address}
              onChangeText={updateAddress}
              onSelectAddress={selectAddress}
              placeholder={t('createEventAddressPlaceholder')}
              locale={locale}
              proximity={userLocation}
              searchingLabel={t('searchingLocations')}
              noResultsLabel={t('noLocationsFound')}
              hintLabel={t('typeToSearchLocation')}
              providerLabel={t('mapSearchSource')}
            />
            <View style={[styles.mapPreview, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <EventMap
                key={eventCoordinates ? `${eventCoordinates.latitude}:${eventCoordinates.longitude}` : 'empty-edit-address-map'}
                events={[]}
                locale={locale}
                userLocation={eventCoordinates ?? userLocation}
                selectedEventId={null}
                searchMarker={eventCoordinates}
                focusCoordinate={eventCoordinates}
                initialZoomLevel={eventCoordinates ? 16.8 : 13.2}
                interactive={false}
                onSelectEvent={() => undefined}
              />
              {!eventCoordinates ? (
                <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.overlay }]}>
                  <Ionicons name="location-outline" size={22} color={theme.colors.textPrimary} />
                  <AppText variant="caption" color="textSecondary" style={styles.mapPlaceholderText}>
                    {t('selectAddressForMapPreview')}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppInput
              label={`${t('entryInstructions')} (${t('optional')})`}
              value={entryInstructions}
              onChangeText={setEntryInstructions}
              placeholder={t('createEventEntryInstructionsPlaceholder')}
              multiline
              style={styles.textAreaSmall}
            />
            <AppButton
              title={eventCoordinates && entranceCoordinates ? t('changeEntrancePin') : t('chooseEntrancePin')}
              variant="glass"
              disabled={!eventCoordinates}
              onPress={openEntrancePicker}
            />
            <AppText variant="caption" color="textMuted">
              {eventCoordinates && entranceCoordinates
                ? `${entranceCoordinates.latitude.toFixed(5)}, ${entranceCoordinates.longitude.toFixed(5)}`
                : eventCoordinates
                  ? t('noEntrancePin')
                  : t('chooseAddressBeforeEntrance')}
            </AppText>
            <CreateEventTagSelector selectedTags={selectedTags} locale={locale} onChange={setSelectedTags} />
            <CreateEventSegmentedControl
              label={t('eventVisibility')}
              value={visibility}
              onChange={setVisibility}
              options={[
                { label: t('publicOption'), value: 'public' },
                { label: t('friendsOption'), value: 'friends' },
              ]}
            />
            <CreateEventSegmentedControl
              label={t('attendanceMode')}
              value={attendanceMode}
              onChange={setAttendanceMode}
              options={[
                { label: t('openAttendance'), value: 'open' },
                { label: t('waitlistAttendance'), value: 'waitlist' },
                { label: t('paidAttendance'), value: 'paid' },
              ]}
            />
            {attendanceMode === 'paid' ? (
              <View style={styles.paidFields}>
                <AppInput
                  label={t('priceAmountLabel')}
                  value={priceAmount}
                  onChangeText={setPriceAmount}
                  placeholder="10.00"
                  keyboardType="decimal-pad"
                />
                <AppInput
                  label={t('priceCurrencyLabel')}
                  value={priceCurrency}
                  onChangeText={setPriceCurrency}
                  placeholder="EUR"
                  autoCapitalize="characters"
                />
              </View>
            ) : null}
            <AppInput
              label={t('capacityLabel')}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="-"
              keyboardType="number-pad"
            />
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
              waitlisted.map((participant) => (
                <ParticipantRow
                  key={participant.userId}
                  eventId={event.id}
                  eventIsPaid={event.attendanceMode === 'paid'}
                  ownerUserId={event.creatorUserId}
                  participant={participant}
                />
              ))
            ) : (
              <AppText variant="body" color="textMuted">
                {t('noWaitlistWaiting')}
              </AppText>
            )}
          </AppCard>

          <SectionHeader title={t('attendees')} subtitle={`${activeParticipants.length} ${t('participants')}`} />
          <AppCard variant="glass" style={styles.card}>
            {activeParticipants.length ? (
              activeParticipants.map((participant) => (
                <ParticipantRow
                  key={participant.userId}
                  eventId={event.id}
                  eventIsPaid={event.attendanceMode === 'paid'}
                  ownerUserId={event.creatorUserId}
                  participant={participant}
                />
              ))
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
  ownerUserId,
  participant,
}: {
  eventId: string;
  eventIsPaid: boolean;
  ownerUserId?: string;
  participant: EventParticipant;
}) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const approveMutation = useApproveEventParticipantMutation();
  const removeMutation = useRemoveEventParticipantMutation();
  const blockMutation = useBlockEventParticipantMutation();
  const isOwnerParticipant = Boolean(ownerUserId && participant.userId === ownerUserId);

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
      {!isOwnerParticipant ? (
        <View style={styles.participantActions}>
          {participant.status === 'waitlisted' ? (
            <ParticipantActionButton
              accessibilityLabel={t('approve')}
              icon="checkmark"
              color={theme.colors.mapAccent}
              onPress={() => void run('approve')}
            />
          ) : null}
          <ParticipantActionButton
            accessibilityLabel={t('remove')}
            icon="close"
            color={theme.colors.textSecondary}
            onPress={() => void run('remove')}
          />
          {!eventIsPaid ? (
            <ParticipantActionButton
              accessibilityLabel={t('block')}
              icon="ban-outline"
              color={theme.colors.textSecondary}
              onPress={() => void run('block')}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ParticipantActionButton({
  accessibilityLabel,
  icon,
  color,
  onPress,
}: {
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.participantActionButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.68 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
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
  textAreaSmall: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  mapPreview: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  mapPlaceholderText: {
    textAlign: 'center',
  },
  paidFields: {
    gap: 10,
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
    gap: 9,
  },
  participantCopy: {
    flex: 1,
    minWidth: 0,
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  participantActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
