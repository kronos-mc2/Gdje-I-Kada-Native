import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { AuthenticatedImageSource } from '@/core/events/event-cover';
import { useAppTheme } from '@/core/theme';

type MapMarkerBadgeProps = Readonly<{
  selected?: boolean;
  kind?: 'event' | 'search';
  coverImageSource?: AuthenticatedImageSource;
  isFriendsOnly?: boolean;
  onImageLoad?: () => void;
}>;

export function MapMarkerBadge({
  selected = false,
  kind = 'event',
  coverImageSource,
  isFriendsOnly = false,
  onImageLoad,
}: MapMarkerBadgeProps) {
  const { theme } = useAppTheme();
  const size = kind === 'search' ? 20 : 44;
  const [imageFailed, setImageFailed] = useState(false);
  const borderColor = isFriendsOnly ? theme.colors.friendEventAccent : selected ? theme.colors.mapAccent : theme.colors.accent;

  useEffect(() => {
    setImageFailed(false);
  }, [coverImageSource?.uri]);

  if (kind === 'search') {
    return (
      <View
        style={[
          styles.searchBadge,
          {
            width: size,
            height: size,
            borderColor: theme.colors.textPrimary,
            backgroundColor: theme.colors.mapAccent,
          },
        ]}
      />
    );
  }

  return (
    <View style={styles.markerWrap} collapsable={false}>
      {isFriendsOnly ? <View style={[styles.friendGlow, { borderColor: theme.colors.friendEventAccentSoft }]} /> : null}
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderColor,
            shadowColor: isFriendsOnly ? theme.colors.friendEventAccent : theme.colors.background,
          },
          isFriendsOnly ? styles.friendsBadge : null,
        ]}
      >
        {coverImageSource && !imageFailed ? (
          <Image
            source={coverImageSource}
            style={styles.image}
            onLoad={() => onImageLoad?.()}
            onError={() => {
              setImageFailed(true);
              onImageLoad?.();
            }}
          />
        ) : (
          <View style={[styles.fallback, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: borderColor,
            borderColor: theme.colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 56,
    height: 62,
    overflow: 'visible',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  friendsBadge: {
    shadowOpacity: 0.52,
    shadowRadius: 14,
    elevation: 12,
  },
  friendGlow: {
    position: 'absolute',
    top: -5,
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 2,
  },
  dot: {
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBadge: {
    borderRadius: 999,
    borderWidth: 3,
  },
});
