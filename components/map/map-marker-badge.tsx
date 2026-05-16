import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/core/theme';

type MapMarkerBadgeProps = Readonly<{
  selected?: boolean;
  kind?: 'event' | 'search';
  coverImageUri?: string;
  onImageLoad?: () => void;
}>;

export function MapMarkerBadge({ selected = false, kind = 'event', coverImageUri, onImageLoad }: MapMarkerBadgeProps) {
  const { theme } = useAppTheme();
  const size = kind === 'search' ? 20 : 44;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [coverImageUri]);

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
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderColor: selected ? theme.colors.mapAccent : theme.colors.accent,
            shadowColor: theme.colors.background,
          },
        ]}
      >
        {coverImageUri && !imageFailed ? (
          <Image
            source={{ uri: coverImageUri }}
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
            backgroundColor: selected ? theme.colors.mapAccent : theme.colors.accent,
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
    width: 52,
    height: 54,
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
  dot: {
    width: 10,
    height: 10,
    marginTop: 2,
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
