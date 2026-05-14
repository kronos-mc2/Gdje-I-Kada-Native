import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '@/components/primitives';
import { getEventPosterUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type EventDetailsContentProps = {
  event: AppEvent;
  locale: Locale;
  isJoined: boolean;
  isJoinDisabled: boolean;
  joinButtonTitle?: string;
  onToggleJoin: () => void;
  expanded?: boolean;
};

export function EventDetailsContent({
  event,
  locale,
  isJoined,
  isJoinDisabled,
  joinButtonTitle,
  onToggleJoin,
  expanded = true,
}: EventDetailsContentProps) {
  const { t } = useI18n();
  const coverUri = getEventPosterUri(event);
  const hasOrganizerRating = (event.organizerRatingCount ?? 0) > 0;
  const hasEventRating = (event.eventRatingCount ?? 0) > 0;
  const priceLabel = formatPrice(event);

  return (
    <>
      <View style={styles.coverRow}>
        <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
        <View style={styles.coverMeta}>
          <AppText variant="bodyStrong">{event.where[locale]}</AppText>
          <AppText variant="caption" color="textMuted">
            {formatEventDate(event.whenISO, locale)}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {event.participantCount} {t('participants')}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {getAttendanceModeLabel(event, t)}
          </AppText>
        </View>
      </View>

      <AppText variant="body" color="textSecondary" style={styles.aboutText}>
        {event.about[locale]}
      </AppText>

      <AppButton
        title={joinButtonTitle ?? (isJoined ? t('leaveEvent') : t('joinEvent'))}
        variant={isJoined ? 'secondary' : 'primary'}
        disabled={isJoinDisabled}
        onPress={onToggleJoin}
        style={styles.joinButton}
      />

      {expanded ? (
        <View style={styles.expandedBlock}>
          <AppText variant="label" color="textMuted">
            {t('details')}
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.expandedText}>
            {event.about[locale]}
          </AppText>

          <View style={styles.detailGrid}>
            <DetailRow label={t('attendanceMode')} value={getAttendanceModeLabel(event, t)} />
            <DetailRow label={t('eventVisibility')} value={getVisibilityLabel(event, t)} />
            {priceLabel ? <DetailRow label={t('priceAmountLabel')} value={priceLabel} /> : null}
            {event.capacity ? <DetailRow label={t('capacityLabel')} value={String(event.capacity)} /> : null}
            <DetailRow
              label={t('eventRating')}
              value={
                hasEventRating
                  ? `${event.eventRatingAverage?.toFixed(1) ?? '0.0'} (${event.eventRatingCount ?? 0})`
                  : t('notRatedYet')
              }
            />
            <DetailRow
              label={t('organizerRating')}
              value={
                hasOrganizerRating
                  ? `${event.organizerRatingAverage?.toFixed(1) ?? '0.0'} (${event.organizerRatingCount ?? 0})`
                  : t('notRatedYet')
              }
            />
            {event.entranceCoordinates ? (
              <DetailRow
                label={t('entrancePin')}
                value={formatCoordinates(event.entranceCoordinates.latitude, event.entranceCoordinates.longitude)}
              />
            ) : null}
            {event.entryInstructions ? <DetailRow label={t('entryInstructions')} value={event.entryInstructions[locale]} /> : null}
            <DetailRow label={t('addressLabel')} value={event.address ?? event.where[locale]} />
            {event.endAt ? <DetailRow label={t('endDateLabel')} value={formatEventDate(event.endAt, locale)} /> : null}
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  coverRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cover: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverMeta: {
    flex: 1,
    gap: 2,
  },
  aboutText: {
    marginTop: 12,
  },
  joinButton: {
    marginTop: 12,
  },
  expandedBlock: {
    marginTop: 10,
    paddingTop: 10,
  },
  expandedText: {
    marginTop: 6,
  },
  detailGrid: {
    marginTop: 12,
    gap: 9,
  },
  detailRow: {
    gap: 2,
  },
});

type TranslateFn = ReturnType<typeof useI18n>['t'];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="body" color="textSecondary">
        {value}
      </AppText>
    </View>
  );
}

function getAttendanceModeLabel(event: AppEvent, t: TranslateFn) {
  switch (event.attendanceMode) {
    case 'waitlist':
      return t('waitlistAttendance');
    case 'paid':
      return t('paidAttendance');
    case 'open':
    default:
      return t('openAttendance');
  }
}

function getVisibilityLabel(event: AppEvent, t: TranslateFn) {
  return event.visibility === 'friends' ? t('friendsOption') : t('publicOption');
}

function formatPrice(event: AppEvent) {
  if (event.attendanceMode !== 'paid' || event.priceAmount == null) {
    return null;
  }

  return `${Number(event.priceAmount).toFixed(2)} ${event.priceCurrency ?? 'EUR'}`;
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
