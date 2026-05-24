import { Image } from 'expo-image';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { AppCard, AppText } from '@/components/primitives';
import { getEventImageSources, getEventPosterSource, getEventVideoUri, isAuthenticatedImageSource } from '@/core/events/event-cover';
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
  onToggleLike: (event: AppEvent) => void;
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
  onToggleLike,
  onOpenDetails,
  onOpenShare,
  onNotInterested,
}: FypReelSlideProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageSources = useMemo(() => getEventImageSources(event), [event]);
  const posterSource = getEventPosterSource(event);
  const videoUri = getEventVideoUri(event);
  const shouldRenderVideo = Boolean(videoUri) && shouldPreload && canRenderFypVideo();
  const onImageMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.slide, { width, height, backgroundColor: theme.colors.background }]}>
      {imageSources.length > 1 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={onImageMomentumEnd}
          >
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
            {imageSources.map((source, index) => (
              <View
                key={`${source.uri}-${index}`}
                style={[
                  styles.imagePageDot,
                  {
                    backgroundColor: index === activeImageIndex ? theme.colors.textPrimary : theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </>
      ) : posterSource ? (
        <Image
          source={posterSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy={isAuthenticatedImageSource(posterSource) ? 'memory' : 'memory-disk'}
        />
      ) : null}
      {shouldRenderVideo && videoUri ? <FypReelVideoLayer videoUri={videoUri} isActive={isActive} /> : null}

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
