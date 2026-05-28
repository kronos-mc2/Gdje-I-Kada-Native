import type { VideoSource } from 'expo-video';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { isAuthenticatedImageSource, type AuthenticatedImageSource } from '@/core/events/event-cover';

type FypReelVideoLayerProps = Readonly<{
  videoSource: AuthenticatedImageSource;
  isActive: boolean;
  isMuted: boolean;
}>;

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

export function canRenderFypVideo() {
  return expoVideoModule != null;
}

export function FypReelVideoLayer({ videoSource, isActive, isMuted }: FypReelVideoLayerProps) {
  const videoModule = requireExpoVideoModule();
  const source = useMemo<VideoSource>(
    () => ({
      uri: videoSource.uri,
      headers: videoSource.headers,
      contentType: 'progressive',
      useCaching: !isAuthenticatedImageSource(videoSource),
    }),
    [videoSource.headers, videoSource.uri],
  );
  const player = videoModule.useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = isMuted;
  });
  const ExpoVideoView = videoModule.VideoView;

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
      allowsFullscreen={false}
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
