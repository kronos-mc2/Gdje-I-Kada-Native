import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';

import { AppButton, AppText } from '@/components/primitives';
import {
  getAuthenticatedImageSource,
  getEventImageMedia,
  getEventPosterSource,
} from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate, formatEventDay, formatEventDuration, formatEventTime } from '@/core/utils/date';
import { getDistanceKm } from '@/core/utils/location';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type EventDetailsContentProps = {
  event: AppEvent;
  locale: Locale;
  isJoined: boolean;
  isJoinDisabled: boolean;
  joinButtonTitle?: string;
  onToggleJoin: () => void;
  canOpenEventChat?: boolean;
  isEventChatPending?: boolean;
  onOpenEventChat?: () => void;
  expanded?: boolean;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

export function EventDetailsContent({
  event,
  locale,
  isJoined,
  isJoinDisabled,
  joinButtonTitle,
  onToggleJoin,
  canOpenEventChat = false,
  isEventChatPending = false,
  onOpenEventChat,
  expanded = true,
}: EventDetailsContentProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const userLocation = useAppStore((state) => state.userLocation);
  const coverSource = getEventPosterSource(event);
  const imageSources = getEventImageMedia(event).map((media) => getAuthenticatedImageSource(media.url));
  const startIso = event.startAt ?? event.whenISO;
  const dateLabel = formatEventDay(startIso, locale);
  const timeLabel = formatEventTime(startIso, locale);
  const durationLabel = formatEventDuration(startIso, event.endAt, locale);
  const priceLabel = formatPrice(event);
  const hasOrganizerRating = (event.organizerRatingCount ?? 0) > 0;
  const organizerName = event.creatorName ?? t('organizerFallback');
  const distanceLabel = formatDistance(getDistanceKm(userLocation, event.coordinates), locale);

  const openSource = () => {
    if (event.sourceUrl) {
      void Linking.openURL(event.sourceUrl);
    }
  };

  const openMaps = () => {
    const label = encodeURIComponent(event.address ?? event.where[locale]);
    const { latitude, longitude } = event.coordinates;
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${label}&ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    void Linking.openURL(url).catch(() => {
      void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.heroRow}>
        <View
          style={[
            styles.heroPoster,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
          )}
        </View>

        <View style={styles.heroCopy}>
          <AppText variant="headline" numberOfLines={3} style={styles.title}>
            {event.title[locale]}
          </AppText>
          <View style={styles.whenRow}>
            <View style={[styles.whenPill, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.mapAccent }]}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.mapAccent} />
              <AppText variant="caption" style={{ color: theme.colors.mapAccent }}>
                {dateLabel}
              </AppText>
            </View>
            <View style={[styles.whenPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Ionicons name="time-outline" size={13} color={theme.colors.textSecondary} />
              <AppText variant="caption" color="textSecondary">
                {timeLabel}
              </AppText>
            </View>
          </View>
          <View style={styles.eventActionRow}>
            <AppButton
              title={joinButtonTitle ?? (isJoined ? t('leaveEvent') : t('joinEvent'))}
              variant={isJoined ? 'secondary' : 'primary'}
              disabled={isJoinDisabled}
              onPress={onToggleJoin}
              style={styles.joinButton}
            />
            {canOpenEventChat ? (
              <AppButton
                variant="secondary"
                accessibilityLabel={t('openMessages')}
                disabled={isEventChatPending}
                onPress={onOpenEventChat}
                style={styles.eventChatButton}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.textSecondary} />
              </AppButton>
            ) : null}
          </View>
        </View>
      </View>

      <AttendanceStatusNotice event={event} />

      <View style={[styles.statRow, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
        <StatCell
          icon="star-outline"
          value={hasOrganizerRating ? event.organizerRatingAverage?.toFixed(1) ?? '0.0' : '-'}
          label={t('organizer')}
          caption={hasOrganizerRating ? `${formatCompactCount(event.organizerRatingCount, locale)} ${t('reviews')}` : t('notRatedYet')}
        />
        <StatCell
          icon="people-outline"
          value={formatCompactCount(event.participantCount, locale)}
          label={t('participants')}
          caption={t('going')}
        />
        <TagsCell tags={event.tags ?? []} />
        <StatCell icon="location" label={t('locationLabel')} caption={distanceLabel} onPress={openMaps} />
      </View>

      {expanded ? (
        <>
          {imageSources.length > 0 ? (
            <GestureScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              alwaysBounceHorizontal
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContent}
              style={styles.gallery}
            >
              {imageSources.map((source, index) => (
                <Image
                  key={`${source.uri}-${index}`}
                  source={source}
                  style={[styles.galleryImage, { backgroundColor: theme.colors.surfaceElevated }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ))}
            </GestureScrollView>
          ) : null}

          <AppText variant="body" color="textSecondary" style={styles.aboutText}>
            {event.about[locale]}
          </AppText>

          <View style={styles.organizerRow}>
            <ProfileAvatar name={organizerName} avatarUrl={event.creatorAvatarUrl} size={54} />
            <View style={styles.organizerCopy}>
              <AppText variant="caption" color="textMuted">
                {t('organizer')}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {organizerName}
              </AppText>
            </View>
            <View style={styles.organizerRating}>
              <AppText variant="headline">
                {hasOrganizerRating ? event.organizerRatingAverage?.toFixed(1) ?? '0.0' : '-'}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {hasOrganizerRating ? `${formatCompactCount(event.organizerRatingCount, locale)} ${t('reviews')}` : t('notRatedYet')}
              </AppText>
            </View>
          </View>

          <View style={styles.detailsBlock}>
            <AppText variant="headline" style={styles.detailsTitle}>
              {t('detailsShort')}
            </AppText>
            <DetailRow label={t('startDateLabel')} value={dateLabel} />
            <DetailRow label={t('eventTimeLabel')} value={timeLabel} />
            {durationLabel ? <DetailRow label={t('durationLabel')} value={durationLabel} /> : null}
            <DetailRow label={t('addressLabel')} value={event.address ?? event.where[locale]} />
            <DetailRow label={t('attendanceMode')} value={getAttendanceModeLabel(event, t)} />
            <DetailRow label={t('eventVisibility')} value={getVisibilityLabel(event, t)} />
            {priceLabel ? <DetailRow label={t('priceAmountLabel')} value={priceLabel} /> : null}
            {event.capacity ? <DetailRow label={t('capacityLabel')} value={String(event.capacity)} /> : null}
            {event.tags?.length ? <DetailRow label={t('eventTags')} value={event.tags.join(', ')} /> : null}
            {event.entranceCoordinates ? (
              <DetailRow
                label={t('entrancePin')}
                value={formatCoordinates(event.entranceCoordinates.latitude, event.entranceCoordinates.longitude)}
              />
            ) : null}
            {event.entryInstructions ? <DetailRow label={t('entryInstructions')} value={event.entryInstructions[locale]} /> : null}
            {event.endAt ? <DetailRow label={t('endDateLabel')} value={formatEventDate(event.endAt, locale)} /> : null}
          </View>

          {event.sourceUrl ? (
            <View style={styles.sourceBlock}>
              <AppText variant="caption" color="textMuted">
                {t('eventSource')}
              </AppText>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={t('openSourcePage')}
                onPress={openSource}
                style={({ pressed }) => [
                  styles.sourceButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceElevated,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Ionicons name="open-outline" size={16} color={theme.colors.mapAccent} />
                <AppText variant="bodyStrong" style={{ color: theme.colors.mapAccent }}>
                  {t('openSourcePage')}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : (
        <AppText variant="body" color="textSecondary" numberOfLines={2} style={styles.collapsedAbout}>
          {event.about[locale]}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroPoster: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    flexShrink: 1,
  },
  whenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  whenPill: {
    minHeight: 26,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  joinButton: {
    flexShrink: 1,
    minHeight: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  eventActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventChatButton: {
    width: 38,
    height: 32,
    minHeight: 32,
    paddingHorizontal: 0,
    borderRadius: 16,
  },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  tagsCell: {
    flex: 1.18,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  statValueRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
  },
  statCaption: {
    textAlign: 'center',
  },
  statTagsContent: {
    gap: 5,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  statTagsScroll: {
    alignSelf: 'stretch',
    height: 66,
  },
  statTagPill: {
    maxWidth: 92,
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: {
    marginHorizontal: -2,
  },
  galleryContent: {
    gap: 14,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  galleryImage: {
    width: 214,
    height: 338,
    borderRadius: 14,
    overflow: 'hidden',
  },
  aboutText: {
    marginTop: 2,
  },
  collapsedAbout: {
    marginTop: -4,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerCopy: {
    flex: 1,
    minWidth: 0,
  },
  organizerRating: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  detailsBlock: {
    gap: 0,
  },
  detailsTitle: {
    marginBottom: 6,
  },
  detailRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  detailLabel: {
    maxWidth: '44%',
  },
  sourceBlock: {
    gap: 8,
    paddingTop: 2,
  },
  sourceButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  attendanceNotice: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attendanceNoticeCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});

type TranslateFn = ReturnType<typeof useI18n>['t'];

function AttendanceStatusNotice({ event }: { event: AppEvent }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const content = getAttendanceStatusNotice(event.attendanceStatus, t);

  if (!content) {
    return null;
  }

  return (
    <View
      style={[
        styles.attendanceNotice,
        {
          borderColor: content.kind === 'success' ? theme.colors.eventJoinedAccent : theme.colors.border,
          backgroundColor: content.kind === 'success' ? theme.colors.eventJoinedAccentSoft : theme.colors.surfaceElevated,
        },
      ]}
    >
      <Ionicons name={content.icon} size={18} color={content.kind === 'success' ? theme.colors.eventJoinedAccent : theme.colors.textSecondary} />
      <View style={styles.attendanceNoticeCopy}>
        <AppText variant="bodyStrong">{content.title}</AppText>
        <AppText variant="caption" color="textMuted">
          {content.body}
        </AppText>
      </View>
    </View>
  );
}

function getAttendanceStatusNotice(status: AppEvent['attendanceStatus'], t: TranslateFn) {
  if (status === 'waitlisted') {
    return {
      icon: 'hourglass-outline' as IconName,
      kind: 'neutral' as const,
      title: t('waitlistStatusTitle'),
      body: t('waitlistStatusBody'),
    };
  }
  if (status === 'approved' || status === 'joined') {
    return {
      icon: 'checkmark-circle-outline' as IconName,
      kind: 'success' as const,
      title: t('attendanceApproved'),
      body: t('attendanceApprovedBody'),
    };
  }
  if (status === 'rejected') {
    return {
      icon: 'remove-circle-outline' as IconName,
      kind: 'neutral' as const,
      title: t('attendanceRemoved'),
      body: t('attendanceRemovedBody'),
    };
  }
  if (status === 'blocked') {
    return {
      icon: 'ban-outline' as IconName,
      kind: 'neutral' as const,
      title: t('attendanceBlocked'),
      body: t('attendanceBlockedBody'),
    };
  }
  return null;
}

function StatCell({
  icon,
  value,
  label,
  caption,
  onPress,
}: {
  icon: IconName;
  value?: string;
  label: string;
  caption: string;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const Content = (
    <>
      <View style={styles.statValueRow}>
        <Ionicons name={icon} size={18} color={theme.colors.textPrimary} />
        {value ? (
          <AppText variant="headline" numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
            {value}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={1} adjustsFontSizeToFit style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="caption" color="textMuted" numberOfLines={1} adjustsFontSizeToFit style={styles.statCaption}>
        {caption}
      </AppText>
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.statCell, { opacity: pressed ? 0.74 : 1 }]}>
        {Content}
      </Pressable>
    );
  }

  return (
    <View style={styles.statCell}>
      {Content}
    </View>
  );
}

function TagsCell({ tags }: { tags: string[] }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    },
    [],
  );

  const scheduleCollapse = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }

    collapseTimerRef.current = setTimeout(() => {
      setExpanded(false);
      collapseTimerRef.current = null;
    }, 5000);
  };

  const showAllTags = () => {
    if (tags.length === 0) {
      return;
    }

    setExpanded(true);
    scheduleCollapse();
  };

  const firstTagLabel = tags.length > 1 ? `${tags[0]}...` : tags[0];
  const header = (
    <>
      <View style={styles.statValueRow}>
        <Ionicons name="pricetags-outline" size={18} color={theme.colors.textPrimary} />
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.statLabel}>
        {t('eventTags')}
      </AppText>
    </>
  );

  if (expanded && tags.length) {
    return (
      <View style={styles.tagsCell} onTouchStart={scheduleCollapse}>
        {header}
        <GestureScrollView
          nestedScrollEnabled
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={250}
          contentContainerStyle={styles.statTagsContent}
          style={styles.statTagsScroll}
          onScrollBeginDrag={scheduleCollapse}
          onScroll={scheduleCollapse}
          onMomentumScrollEnd={scheduleCollapse}
          onTouchStart={scheduleCollapse}
          onTouchEnd={scheduleCollapse}
        >
          {tags.map((tag) => (
            <View key={tag} style={[styles.statTagPill, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.mapAccent }]}>
              <AppText variant="caption" numberOfLines={1} style={{ color: theme.colors.mapAccent }}>
                {tag}
              </AppText>
            </View>
          ))}
        </GestureScrollView>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('eventTags')}
      onPress={showAllTags}
      style={({ pressed }) => [styles.tagsCell, { opacity: pressed && tags.length > 0 ? 0.76 : 1 }]}
    >
      {header}
      {tags.length ? (
        <AppText variant="caption" color="textMuted" numberOfLines={1} adjustsFontSizeToFit style={styles.statCaption}>
          {firstTagLabel}
        </AppText>
      ) : (
        <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.statCaption}>
          {t('notSpecified')}
        </AppText>
      )}
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
      <AppText variant="body" color="textSecondary" numberOfLines={2} style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" numberOfLines={2} style={styles.detailValue}>
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

function formatDistance(distanceKm: number, locale: Locale) {
  return `${new Intl.NumberFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    maximumFractionDigits: distanceKm < 10 ? 1 : 0,
  }).format(distanceKm)} km`;
}

function formatCompactCount(value: number | undefined, locale: Locale) {
  const count = value ?? 0;
  return new Intl.NumberFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    notation: count >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(count);
}
