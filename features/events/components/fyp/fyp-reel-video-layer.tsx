import type { VideoSource } from 'expo-video';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';

type FypReelVideoLayerProps = Readonly<{
  videoUri: string;
  isActive: boolean;
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

export function FypReelVideoLayer({ videoUri, isActive }: FypReelVideoLayerProps) {
  const videoModule = requireExpoVideoModule();
  const videoSource = useMemo<VideoSource>(() => ({ uri: videoUri, useCaching: true }), [videoUri]);
  const player = videoModule.useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });
  const ExpoVideoView = videoModule.VideoView;

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

function requireExpoVideoModule() {
  if (expoVideoModule == null) {
    throw new Error('expo-video native module is not available.');
  }
  return expoVideoModule;
}
