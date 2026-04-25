import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { VideoSource } from 'expo-video';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/components/primitives';
import { getEventPosterUri, getEventPrimaryMedia, getEventVideoUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type FypReelSlideProps = {
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
};

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: number;
  active?: boolean;
  onPress: () => void;
};

type ExpoVideoModule = typeof import('expo-video');

let expoVideoModule: ExpoVideoModule | null = null;
let hasLoggedMissingExpoVideo = false;

try {
  expoVideoModule = require('expo-video') as ExpoVideoModule;
} catch (error) {
  if (__DEV__ && !hasLoggedMissingExpoVideo) {
    hasLoggedMissingExpoVideo = true;
    console.warn(
      'expo-video native modul nije dostupan; FYP koristi poster fallback dok se ne napravi novi native build.',
      error,
    );
  }
}

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
}: FypReelSlideProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const primaryMedia = getEventPrimaryMedia(event);
  const posterUri = getEventPosterUri(event, 1200, 1800);
  const videoUri = getEventVideoUri(event);
  const shouldRenderVideo = Boolean(videoUri) && shouldPreload && expoVideoModule != null;

  return (
    <View style={[styles.slide, { width, height }]}>
      <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      {shouldRenderVideo && videoUri ? (
        <FypVideoLayer videoUri={videoUri} isActive={isActive} />
      ) : null}

      <View style={styles.backdrop} />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={[styles.content, { paddingTop: topInset + 10, paddingBottom: bottomInset + 22 }]}>
        <AppCard variant="glass" style={styles.topCard}>
          <View style={styles.topCardRow}>
            <View style={styles.topCardCopy}>
              <AppText variant="label" color="textMuted">
                {primaryMedia?.mediaType === 'video' ? t('videoLabel') : t('imageLabel')}
              </AppText>
              <AppText variant="bodyStrong">{formatEventDate(event.whenISO, locale)}</AppText>
            </View>
            {event.joinedByMe ? (
              <View style={[styles.joinedBadge, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.mapAccent }]}>
                <AppText variant="caption" color="mapAccent">
                  {t('joinedBadge')}
                </AppText>
              </View>
            ) : null}
          </View>
        </AppCard>

        <View style={styles.bottomRow}>
          <AppCard variant="glass" style={styles.storyCard}>
            <AppText variant="display" style={styles.title}>
              {event.title[locale]}
            </AppText>
            <AppText variant="bodyStrong" color="textSecondary" style={styles.location}>
              {event.where[locale]}
            </AppText>
            <AppText variant="body" color="textMuted" numberOfLines={3} style={styles.about}>
              {event.about[locale]}
            </AppText>

            <View style={styles.metaRow}>
              <MetaPill icon="people-outline" label={`${event.participantCount} ${t('participants')}`} />
              <MetaPill icon="heart-outline" label={`${event.likeCount} ${t('likesCountShort')}`} />
              {event.attendanceMode ? <MetaPill icon="ticket-outline" label={event.attendanceMode.toUpperCase()} /> : null}
            </View>

            <View style={styles.ctaRow}>
              <AppButton title={t('detailsCta')} variant="glass" style={styles.ctaButton} onPress={() => onOpenDetails(event)} />
              <AppButton title={t('shareCta')} variant="secondary" style={styles.ctaButton} onPress={() => onOpenShare(event)} />
            </View>
          </AppCard>

          <View style={styles.rightActions}>
            <ActionButton
              icon={event.likedByMe ? 'heart' : 'heart-outline'}
              label={t('like')}
              value={event.likeCount}
              active={event.likedByMe}
              onPress={() => onToggleLike(event)}
            />
            <ActionButton icon="share-social-outline" label={t('shareCta')} onPress={() => onOpenShare(event)} />
          </View>
        </View>
      </View>
    </View>
  );
}

function FypVideoLayer({ videoUri, isActive }: { videoUri: string; isActive: boolean }) {
  const videoSource = useMemo<VideoSource>(() => ({ uri: videoUri, useCaching: true }), [videoUri]);
  const player = expoVideoModule!.useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });
  const ExpoVideoView = expoVideoModule!.VideoView;

  useEffect(() => {
    if (isActive) {
      player.play();
      return;
    }

    player.pause();
  }, [isActive, player]);

  return (
    <ExpoVideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      useExoShutter={false}
    />
  );
}

function ActionButton({ icon, label, value, active = false, onPress }: ActionButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable style={({ pressed }) => [styles.actionWrap, { opacity: pressed ? 0.78 : 1 }]} onPress={onPress}>
      <View style={[styles.actionIconWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
        <Ionicons name={icon} size={24} color={active ? theme.colors.accent : theme.colors.textPrimary} />
      </View>
      <AppText variant="caption" style={styles.actionLabel}>
        {value ?? label}
      </AppText>
    </Pressable>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.metaPill, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
      <Ionicons name={icon} size={14} color={theme.colors.textSecondary} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    justifyContent: 'space-between',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 16, 0.28)',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(11, 16, 28, 0.36)',
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
    backgroundColor: 'rgba(8, 10, 18, 0.54)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topCard: {
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topCardCopy: {
    flex: 1,
    gap: 4,
  },
  joinedBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  storyCard: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
  },
  location: {
    marginTop: 8,
  },
  about: {
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  ctaButton: {
    flex: 1,
  },
  rightActions: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 6,
  },
  actionWrap: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    textAlign: 'center',
  },
});
