import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getEventImageSources, getEventVideoSource, isAuthenticatedImageSource } from '@/core/events/event-cover';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { FypReelActions } from '@/features/events/components/fyp/fyp-reel-actions';
import { FypReelSummaryCard } from '@/features/events/components/fyp/fyp-reel-summary-card';
import { FypReelVideoLayer, canRenderFypVideo } from '@/features/events/components/fyp/fyp-reel-video-layer';

const BOTTOM_SCRIM_SOURCE = require('../../../../assets/images/fyp-bottom-scrim.png');

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

      <BottomScrim />

      <View style={[styles.bottomContent, { paddingBottom: bottomInset }]}>
        <View style={styles.summaryColumn}>
          <FypReelSummaryCard
            event={event}
            locale={locale}
            activeMediaIndex={activeMediaIndex}
            mediaPageCount={pageCount}
            onOpenDetails={() => onOpenDetails(event)}
          />
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

function BottomScrim() {
  return (
    <View pointerEvents="none" style={styles.scrim}>
      <Image source={BOTTOM_SCRIM_SOURCE} style={StyleSheet.absoluteFill} contentFit="fill" cachePolicy="memory-disk" />
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
  scrim: {
    bottom: 0,
    height: '62%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bottomContent: {
    position: 'absolute',
    left: 18,
    right: 16,
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
