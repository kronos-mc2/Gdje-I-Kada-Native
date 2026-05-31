import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/primitives';
import { useLikeEventMutation, useUnlikeEventMutation } from '@/core/api/query-hooks';
import { getEventPosterSource } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';
import { getDistanceKm } from '@/core/utils/location';

export type NearbySheetMode = 'collapsed' | 'preview' | 'expanded';
type NearbyCardMode = 'preview' | 'expanded';
type NearbyEvent = AppEvent & { distanceKm: number };
type NearbyCardWidth = number | `${number}%`;

const COLLAPSED_VISIBLE_HEIGHT = 96;
const PREVIEW_VISIBLE_HEIGHT = 342;
const TOOLBAR_BOTTOM_GAP_ANDROID = 18;
const TOOLBAR_BOTTOM_GAP_IOS = -18;
const OPEN_CONTENT_BOTTOM_SPACER = 86;
const SHEET_HORIZONTAL_INSET = 12;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = 12;

type MapNearbySheetProps = Readonly<{
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  radiusKm: number;
  bottomInset: number;
  title?: string;
  initiallyExpanded?: boolean;
  closeSignal?: number;
  onModeChange?: (mode: NearbySheetMode) => void;
  onVisibleHeightChange?: (height: number) => void;
  onSelectEvent: (event: AppEvent) => void;
  onClose?: () => void;
}>;

export function MapNearbySheet({
  events,
  locale,
  userLocation,
  radiusKm,
  bottomInset,
  title,
  initiallyExpanded = false,
  closeSignal = 0,
  onModeChange,
  onVisibleHeightChange,
  onSelectEvent,
  onClose,
}: MapNearbySheetProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const likeEventMutation = useLikeEventMutation();
  const unlikeEventMutation = useUnlikeEventMutation();
  const [mode, setMode] = useState<NearbySheetMode>(initiallyExpanded ? 'expanded' : 'collapsed');
  const [isDragging, setIsDragging] = useState(false);
  const sheetVisibleHeight = useRef(new Animated.Value(COLLAPSED_VISIBLE_HEIGHT)).current;
  const dragStartHeightRef = useRef(COLLAPSED_VISIBLE_HEIGHT);
  const visibleHeightRef = useRef(COLLAPSED_VISIBLE_HEIGHT);
  const shouldLoadEvents = mode !== 'collapsed' && !isDragging;
  const eventsWithDistance = useMemo(
    () =>
      shouldLoadEvents
        ? events
            .map((event) => ({ ...event, distanceKm: getDistanceKm(userLocation, event.coordinates) }))
            .sort((a, b) => a.distanceKm - b.distanceKm || new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        : [],
    [events, shouldLoadEvents, userLocation],
  );
  const nearbyEvents = eventsWithDistance.filter((event) => event.distanceKm <= radiusKm);
  const cityLabel = inferNearbyCity(nearbyEvents, locale);
  const expandedEvents = Number.isFinite(radiusKm)
    ? eventsWithDistance.filter((event) => inferEventCity(event, locale) === cityLabel)
    : eventsWithDistance;
  const previewCardWidth = Math.min(150, Math.max(128, width * 0.34));
  const expandedVisibleHeight = Math.min(height * 0.62, 560);
  const toolbarBottomGap = Platform.OS === 'ios' ? TOOLBAR_BOTTOM_GAP_IOS : TOOLBAR_BOTTOM_GAP_ANDROID;
  const sheetBottom = Math.max(bottomInset, 10) + toolbarBottomGap;
  const previewVisibleHeight = Math.min(PREVIEW_VISIBLE_HEIGHT, expandedVisibleHeight);
  const previewTitle = title ?? t('eventsNearby').replace('{count}', String(nearbyEvents.length));
  const expandedTitle = title ?? t('allEventsInCity').replace('{city}', cityLabel);
  const visibleTitle = mode === 'expanded' ? expandedTitle : previewTitle;
  const subtitle =
    mode === 'expanded' || !Number.isFinite(radiusKm)
      ? cityLabel
      : `${cityLabel} · ${t('nearbyRadius').replace('{radius}', String(radiusKm))}`;

  const setVisibleHeight = (visibleHeight: number) => {
    visibleHeightRef.current = visibleHeight;
    sheetVisibleHeight.setValue(visibleHeight);
    onVisibleHeightChange?.(visibleHeight);
  };

  const animateToMode = (nextMode: NearbySheetMode, animated = true) => {
    const nextVisibleHeight =
      nextMode === 'expanded' ? expandedVisibleHeight : nextMode === 'preview' ? previewVisibleHeight : COLLAPSED_VISIBLE_HEIGHT;
    visibleHeightRef.current = nextVisibleHeight;
    onVisibleHeightChange?.(nextVisibleHeight);

    if (!animated) {
      sheetVisibleHeight.setValue(nextVisibleHeight);
      return;
    }

    Animated.spring(sheetVisibleHeight, {
      toValue: nextVisibleHeight,
      useNativeDriver: false,
      damping: 24,
      stiffness: 210,
      mass: 0.9,
    }).start();
  };

  const settleDrag = (visibleHeight: number, velocityY: number) => {
    const midpoint = (COLLAPSED_VISIBLE_HEIGHT + previewVisibleHeight) / 2;
    const nextMode: NearbySheetMode =
      velocityY < -0.45
        ? mode === 'preview' ? 'expanded' : 'preview'
      : velocityY > 0.45
          ? 'collapsed'
          : visibleHeight >= previewVisibleHeight + (expandedVisibleHeight - previewVisibleHeight) * 0.45
            ? 'expanded'
            : visibleHeight > midpoint
              ? 'preview'
              : 'collapsed';

    setMode(nextMode);
    setIsDragging(false);
    if (nextMode === 'collapsed') {
      onClose?.();
    }
    animateToMode(nextMode);
  };

  useEffect(() => {
    if (closeSignal > 0) {
      setMode('collapsed');
      animateToMode('collapsed');
    }
  }, [closeSignal]);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useLayoutEffect(() => {
    animateToMode(mode, false);
  }, [expandedVisibleHeight, previewVisibleHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          setIsDragging(true);
          dragStartHeightRef.current = visibleHeightRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const nextVisibleHeight = Math.min(
            expandedVisibleHeight,
            Math.max(COLLAPSED_VISIBLE_HEIGHT, dragStartHeightRef.current - gesture.dy),
          );
          setVisibleHeight(nextVisibleHeight);
        },
        onPanResponderRelease: (_, gesture) => {
          settleDrag(visibleHeightRef.current, gesture.vy);
        },
        onPanResponderTerminate: (_, gesture) => {
          settleDrag(visibleHeightRef.current, gesture.vy);
        },
      }),
    [expandedVisibleHeight, mode, previewVisibleHeight],
  );

  const toggleLike = (event: AppEvent) => {
    if (event.likedByMe) {
      unlikeEventMutation.mutate(event.id);
      return;
    }

    likeEventMutation.mutate(event.id);
  };

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height: sheetVisibleHeight,
          bottom: sheetBottom,
          backgroundColor: theme.colors.floatingTabBackground,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <View style={[styles.grabber, { backgroundColor: theme.colors.mapAccent }]} />
      </View>

      {mode !== 'collapsed' || isDragging ? (
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {isDragging ? (
              <AppText variant="bodyStrong" numberOfLines={1}>
                {t('nearby')}
              </AppText>
            ) : (
              <>
                <AppText variant={mode === 'expanded' ? 'headline' : 'bodyStrong'} numberOfLines={1}>
                  {visibleTitle}
                </AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {subtitle}
                </AppText>
              </>
            )}
          </View>
          {mode === 'preview' && !isDragging ? (
            <Pressable
              onPress={() => {
                setMode('expanded');
                animateToMode('expanded');
              }}
              style={[styles.seeAllButton, { backgroundColor: theme.colors.mapAccentSoft }]}
            >
              <AppText variant="label" color="textPrimary">
                {t('seeAll')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {mode === 'collapsed' && !isDragging ? null : !shouldLoadEvents ? (
        <NearbySkeleton />
      ) : mode === 'expanded' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          <View style={styles.gridWrap}>
            {expandedEvents.map((event) => (
              <NearbyEventCard
                key={event.id}
                event={event}
                locale={locale}
                mode="expanded"
                width="48.2%"
                onPress={() => {
                  setMode('collapsed');
                  onSelectEvent(event);
                }}
                onToggleLike={() => toggleLike(event)}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {nearbyEvents.map((event) => (
            <NearbyEventCard
              key={event.id}
              event={event}
              locale={locale}
              mode="preview"
              width={previewCardWidth}
              onPress={() => {
                setMode('collapsed');
                onSelectEvent(event);
              }}
              onToggleLike={() => toggleLike(event)}
            />
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

function NearbySkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.skeletonCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.skeletonImage, { backgroundColor: theme.colors.surfaceElevated }]} />
          <View style={styles.skeletonCopy}>
            <View style={[styles.skeletonLineStrong, { backgroundColor: theme.colors.surfaceElevated }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceElevated }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function NearbyEventCard({
  event,
  locale,
  mode,
  width,
  onPress,
  onToggleLike,
}: {
  event: NearbyEvent;
  locale: Locale;
  mode: NearbyCardMode;
  width: NearbyCardWidth;
  onPress: () => void;
  onToggleLike: () => void;
}) {
  const { theme } = useAppTheme();
  const posterSource = getEventPosterSource(event);
  const badge = getEventDateBadge(event.startAt, locale);
  const compact = mode === 'preview';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <View style={[styles.imageWrap, compact ? styles.imageWrapCompact : null]}>
        {posterSource ? (
          <Image source={posterSource} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Ionicons name="calendar-outline" size={compact ? 18 : 24} color={theme.colors.textMuted} />
          </View>
        )}
        {badge ? <DateBadge badge={badge} compact={compact} /> : null}
      </View>
      <View style={[styles.cardBody, compact ? styles.cardBodyCompact : null]}>
        <AppText variant={compact ? 'caption' : 'bodyStrong'} numberOfLines={1}>
          {event.title[locale]}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {event.where[locale]}
        </AppText>
        <View style={styles.cardFooter}>
          <View style={styles.distance}>
            <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
            <AppText variant="caption" color="textMuted">
              {event.distanceKm.toFixed(1)} km
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onToggleLike} hitSlop={8}>
            <Ionicons
              name={event.likedByMe ? 'heart' : 'heart-outline'}
              size={compact ? 20 : 24}
              color={event.likedByMe ? theme.colors.mapAccent : theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function DateBadge({
  badge,
  compact,
}: {
  badge: { label: string; colorKey: 'todayAccent' | 'tomorrowAccent' | 'weekAccent' };
  compact: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.dateBadge, compact ? styles.dateBadgeCompact : null, { backgroundColor: theme.colors[badge.colorKey] }]}>
      <AppText variant="caption" color="textPrimary" style={[styles.dateBadgeText, compact ? styles.dateBadgeTextCompact : null]}>
        {badge.label}
      </AppText>
    </View>
  );
}

function getEventDateBadge(startAt: string, locale: Locale) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfEventDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const dayDelta = Math.round((startOfEventDay - startOfToday) / 86400000);

  if (dayDelta === 0) {
    return { label: locale === 'hr' ? 'DANAS' : 'TODAY', colorKey: 'todayAccent' as const };
  }
  if (dayDelta === 1) {
    return { label: locale === 'hr' ? 'SUTRA' : 'TOMORROW', colorKey: 'tomorrowAccent' as const };
  }
  if (dayDelta > 1 && dayDelta <= 7) {
    return { label: locale === 'hr' ? 'OVAJ TJEDAN' : 'THIS WEEK', colorKey: 'weekAccent' as const };
  }

  return null;
}

function inferNearbyCity(events: NearbyEvent[], locale: Locale) {
  const firstEvent = events[0];
  if (!firstEvent) {
    return 'Zagreb';
  }

  return inferEventCity(firstEvent, locale);
}

function inferEventCity(event: Pick<AppEvent, 'address' | 'where' | 'coordinates'>, locale: Locale) {
  if (isNearZagreb(event.coordinates)) {
    return 'Zagreb';
  }

  const addressParts = event.address?.split(',').map((part) => part.trim()).filter(Boolean) ?? [];
  const zagrebPart = addressParts.find((part) => /\bzagreb\b/i.test(part));
  if (zagrebPart) {
    return 'Zagreb';
  }

  const cityPart = addressParts
    .map((part) => part.replace(/^\d{4,6}\s*/, '').trim())
    .find((part) => part && !/^\d+$/.test(part));

  return cityPart ?? event.where[locale] ?? 'Zagreb';
}

function isNearZagreb(coordinates: Coordinates) {
  return Math.abs(coordinates.latitude - 45.815) < 0.22 && Math.abs(coordinates.longitude - 15.9819) < 0.28;
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: SHEET_HORIZONTAL_INSET,
    right: SHEET_HORIZONTAL_INSET,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 39,
    borderBottomRightRadius: 39,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  dragHandle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  grabber: {
    width: 58,
    height: 5,
    borderRadius: 999,
    opacity: 0.78,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerCopy: {
    flex: 1,
  },
  seeAllButton: {
    minHeight: 38,
    borderRadius: 19,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  horizontalList: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: OPEN_CONTENT_BOTTOM_SPACER,
  },
  skeletonWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    width: 136,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 82,
  },
  skeletonCopy: {
    gap: 7,
    padding: 9,
  },
  skeletonLineStrong: {
    width: '78%',
    height: 9,
    borderRadius: 999,
  },
  skeletonLine: {
    width: '56%',
    height: 8,
    borderRadius: 999,
  },
  grid: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: OPEN_CONTENT_BOTTOM_SPACER,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: GRID_COLUMN_GAP,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 112,
  },
  imageWrapCompact: {
    height: 82,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    position: 'absolute',
    left: 8,
    bottom: 7,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateBadgeCompact: {
    left: 7,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dateBadgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  dateBadgeTextCompact: {
    fontSize: 8,
    lineHeight: 10,
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardBodyCompact: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
