import type { VideoSource } from 'expo-video';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { useCachedVideoSource } from '@/core/cache/video-cache';
import { isAuthenticatedImageSource, type AuthenticatedImageSource } from '@/core/events/event-cover';

type FypReelVideoLayerProps = Readonly<{
  videoSource: AuthenticatedImageSource;
  isActive: boolean;
  isMuted: boolean;
}>;

type ExpoVideoModule = typeof import('expo-video');

const DISABLED_FULLSCREEN_OPTIONS = { enable: false } as const;

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

export function canRenderFypVideo() {
  return expoVideoModule != null;
}

export function FypReelVideoLayer({ videoSource, isActive, isMuted }: FypReelVideoLayerProps) {
  const videoModule = requireExpoVideoModule();
  const cachedVideoSource = useCachedVideoSource(videoSource);
  const lastLoadedSourceRef = useRef<string | null>(null);
  const source = useMemo<VideoSource>(
    () => ({
      uri: cachedVideoSource.uri,
      headers: cachedVideoSource.localFile ? undefined : cachedVideoSource.headers,
      contentType: 'progressive',
      useCaching: !cachedVideoSource.localFile && !isAuthenticatedImageSource(cachedVideoSource),
    }),
    [cachedVideoSource.headers, cachedVideoSource.localFile, cachedVideoSource.uri],
  );
  const sourceSignature = useMemo(() => JSON.stringify(source), [source]);
  const player = videoModule.useVideoPlayer(null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = isMuted;
  });
  const ExpoVideoView = videoModule.VideoView;

  useEffect(() => {
    let cancelled = false;
    if (lastLoadedSourceRef.current === sourceSignature) {
      return () => {
        cancelled = true;
      };
    }

    lastLoadedSourceRef.current = sourceSignature;
    void player
      .replaceAsync(source)
      .then(() => {
        if (cancelled) {
          return;
        }
        player.loop = true;
        player.muted = isMuted;
        if (isActive) {
          player.play();
        } else {
          player.pause();
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isActive, isMuted, player, source, sourceSignature]);

  useEffect(() => {
    if (isActive) {
      player.play();
      return;
    }

    player.pause();
  }, [isActive, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  return (
    <ExpoVideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      fullscreenOptions={DISABLED_FULLSCREEN_OPTIONS}
      surfaceType="textureView"
      useExoShutter={false}
    />
  );
}

function requireExpoVideoModule() {
  if (expoVideoModule == null) {
    throw new Error('expo-video native module is not available.');
  }
  return expoVideoModule;
}
