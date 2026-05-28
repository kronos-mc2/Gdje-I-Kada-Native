import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AppCard, AppText } from '@/components/primitives';
import { getEventImageSources, getEventVideoSource, isAuthenticatedImageSource } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDay } from '@/core/utils/date';
import { FypReelActions } from '@/features/events/components/fyp/fyp-reel-actions';
import { FypReelSummaryCard } from '@/features/events/components/fyp/fyp-reel-summary-card';
import { FypReelVideoLayer, canRenderFypVideo } from '@/features/events/components/fyp/fyp-reel-video-layer';

type FypReelSlideProps = Readonly<{
  event: AppEvent;
  locale: Locale;
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  isActive: boolean;
  shouldPreload: boolean;
  isMuted: boolean;
  onToggleLike: (event: AppEvent) => void;
  onLikeOnly: (event: AppEvent) => void;
  onToggleMute: () => void;
  onOpenDetails: (event: AppEvent) => void;
  onOpenShare: (event: AppEvent) => void;
  onNotInterested: (event: AppEvent) => void;
}>;

export function FypReelSlide({
  event,
  locale,
  width,
  height,
  topInset,
  bottomInset,
  isActive,
  shouldPreload,
  isMuted,
  onToggleLike,
  onLikeOnly,
  onToggleMute,
  onOpenDetails,
  onOpenShare,
  onNotInterested,
}: FypReelSlideProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [feedback, setFeedback] = useState<'heart' | 'muted' | 'unmuted' | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; localY: number; at: number } | null>(null);
  const touchMovedRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageSources = useMemo(() => getEventImageSources(event), [event]);
  const videoSource = getEventVideoSource(event);
  const hasVideo = Boolean(videoSource);
  const pageCount = imageSources.length + (hasVideo ? 1 : 0);
  const shouldRenderVideo = Boolean(videoSource) && shouldPreload && canRenderFypVideo();
  const videoIsFocused = isActive && activeMediaIndex === 0;
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [event.id]);
  const onMediaMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveMediaIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };
  const showFeedback = (nextFeedback: 'heart' | 'muted' | 'unmuted') => {
    setFeedback(nextFeedback);
    setTimeout(() => setFeedback(null), 620);
  };
  const handleSingleTap = () => {
    if (!hasVideo) {
      return;
    }
    onToggleMute();
    showFeedback(isMuted ? 'unmuted' : 'muted');
  };
  const handleDoubleTap = () => {
    onLikeOnly(event);
    showFeedback('heart');
  };
  const onTouchStart = (touchEvent: GestureResponderEvent) => {
    touchStartRef.current = {
      x: touchEvent.nativeEvent.pageX,
      y: touchEvent.nativeEvent.pageY,
      localY: touchEvent.nativeEvent.locationY,
      at: Date.now(),
    };
    touchMovedRef.current = false;
  };
  const onTouchMove = (touchEvent: GestureResponderEvent) => {
    const start = touchStartRef.current;
    if (!start) {
      return;
    }
    const dx = Math.abs(touchEvent.nativeEvent.pageX - start.x);
    const dy = Math.abs(touchEvent.nativeEvent.pageY - start.y);
    if (dx > 12 || dy > 12) {
      touchMovedRef.current = true;
    }
  };
  const onTouchEnd = () => {
    const start = touchStartRef.current;
    if (!start) {
      return;
    }
    const isCenterTap = start.localY >= topInset + 120 && start.localY <= height - bottomInset - 190;
    if (!isCenterTap || touchMovedRef.current || Date.now() - start.at > 360) {
      return;
    }
    const now = Date.now();
    if (now - lastTapAtRef.current < 280) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapAtRef.current = 0;
      handleDoubleTap();
      return;
    }
    lastTapAtRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      handleSingleTap();
    }, 280);
  };

  return (
    <View
      style={[styles.slide, { width, height, backgroundColor: theme.colors.background }]}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pageCount > 1 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={onMediaMomentumEnd}
          >
            {hasVideo ? (
              <View style={{ width, height }}>
                {imageSources[0] ? (
                  <Image
                    source={imageSources[0]}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy={isAuthenticatedImageSource(imageSources[0]) ? 'memory' : 'memory-disk'}
                  />
                ) : null}
                {shouldRenderVideo && videoSource ? <FypReelVideoLayer videoSource={videoSource} isActive={videoIsFocused} isMuted={isMuted} /> : null}
              </View>
            ) : null}
            {imageSources.map((source) => (
              <Image
                key={source.uri}
                source={source}
                style={{ width, height }}
                contentFit="cover"
                cachePolicy={isAuthenticatedImageSource(source) ? 'memory' : 'memory-disk'}
              />
            ))}
          </ScrollView>
          <View style={[styles.imagePageDots, { top: topInset + 86 }]}>
            {Array.from({ length: pageCount }).map((_, index) => (
              <View
                key={`media-page-${event.id}-${index}`}
                style={[
                  styles.imagePageDot,
                  {
                    backgroundColor: index === activeMediaIndex ? theme.colors.textPrimary : theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </>
      ) : hasVideo && videoSource ? (
        <>
          {imageSources[0] ? (
            <Image
              source={imageSources[0]}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy={isAuthenticatedImageSource(imageSources[0]) ? 'memory' : 'memory-disk'}
            />
          ) : null}
          {shouldRenderVideo ? <FypReelVideoLayer videoSource={videoSource} isActive={videoIsFocused} isMuted={isMuted} /> : null}
        </>
      ) : imageSources[0] ? (
        <Image
          source={imageSources[0]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy={isAuthenticatedImageSource(imageSources[0]) ? 'memory' : 'memory-disk'}
        />
      ) : null}

      {feedback ? (
        <View pointerEvents="none" style={styles.feedbackOverlay}>
          <View style={styles.feedbackIcon}>
            <Ionicons
              name={feedback === 'heart' ? 'heart' : feedback === 'muted' ? 'volume-mute' : 'volume-high'}
              size={72}
              color="#FFFFFF"
            />
          </View>
        </View>
      ) : null}

      <View style={[styles.topBadgeWrap, { paddingTop: topInset + 10 }]}>
        <AppCard variant="glass" style={styles.topBadge}>
          <View style={styles.topBadgeRow}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {formatEventDay(event.whenISO, locale)}
            </AppText>
            {event.joinedByMe ? (
              <View style={[styles.joinedBadge, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.mapAccent }]}>
                <AppText variant="caption" color="mapAccent">
                  {t('joinedBadge')}
                </AppText>
              </View>
            ) : null}
          </View>
        </AppCard>
      </View>

      <View style={[styles.bottomContent, { paddingBottom: bottomInset }]}>
        <View style={styles.summaryColumn}>
          <FypReelSummaryCard event={event} locale={locale} onOpenDetails={() => onOpenDetails(event)} />
        </View>
        <FypReelActions
          liked={Boolean(event.likedByMe)}
          likeCount={event.likeCount}
          onToggleLike={() => onToggleLike(event)}
          onOpenShare={() => onOpenShare(event)}
          onNotInterested={() => onNotInterested(event)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    overflow: 'hidden',
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 20, 0.28)',
    borderRadius: 999,
    height: 116,
    justifyContent: 'center',
    width: 116,
  },
  topBadgeWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    alignItems: 'flex-start',
  },
  topBadge: {
    minWidth: 130,
    maxWidth: 260,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
  },
  joinedBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  imagePageDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  imagePageDot: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 6,
    width: 6,
  },
  bottomContent: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  summaryColumn: {
    flex: 1,
    minWidth: 0,
  },
});
