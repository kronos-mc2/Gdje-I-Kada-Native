import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/core/theme';

type MapMarkerBadgeProps = {
  selected?: boolean;
  kind?: 'event' | 'search';
  coverImageUri?: string;
  onImageLoad?: () => void;
};

export function MapMarkerBadge({ selected = false, kind = 'event', coverImageUri, onImageLoad }: MapMarkerBadgeProps) {
  const { theme } = useAppTheme();
  const size = kind === 'search' ? 20 : 44;
  const isAndroid = Platform.OS === 'android';
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

  if (isAndroid) {
    return (
      <View style={styles.androidMarkerWrap} collapsable={false}>
        <View
          style={[
            styles.androidBadge,
            {
              width: size,
              height: size,
              borderColor: selected ? theme.colors.mapAccent : 'rgba(255,255,255,0.92)',
              shadowColor: '#000000',
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
        <View style={[styles.androidDot, { backgroundColor: selected ? theme.colors.mapAccent : '#FFFFFF' }]} />
      </View>
    );
  }

  return (
    <View style={styles.markerWrap} collapsable={false}>
      <View style={styles.pinRoot}>
        <View
          style={[
            styles.badge,
            {
              width: size,
              height: size,
              borderColor: selected ? theme.colors.mapAccent : 'rgba(255,255,255,0.9)',
              shadowColor: '#000000',
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
              <Ionicons name="calendar" size={selected ? 18 : 14} color={theme.colors.textSecondary} />
            </View>
          )}
        </View>

        <View
          style={[
            styles.pinTail,
            {
              backgroundColor: theme.colors.surfaceElevated,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  androidMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 52,
    height: 54,
    overflow: 'visible',
  },
  androidBadge: {
    borderRadius: 999,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  androidDot: {
    width: 8,
    height: 8,
    marginTop: 1,
    borderRadius: 999,
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 52,
    height: 58,
    overflow: 'visible',
  },
  pinRoot: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
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
  pinTail: {
    width: 12,
    height: 12,
    marginTop: -1,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  searchBadge: {
    borderRadius: 999,
    borderWidth: 3,
  },
});
