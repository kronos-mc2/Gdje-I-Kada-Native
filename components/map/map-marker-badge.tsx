import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import type { AuthenticatedImageSource } from '@/core/events/event-cover';
import { useAppTheme } from '@/core/theme';
import { AppText } from '@/components/primitives';

type MapMarkerBadgeProps = Readonly<{
  selected?: boolean;
  kind?: 'event' | 'search';
  coverImageSource?: AuthenticatedImageSource;
  coverImageSources?: AuthenticatedImageSource[];
  count?: number;
  dateBadge?: {
    label: string;
    colorKey: 'todayAccent' | 'tomorrowAccent' | 'weekAccent';
  } | null;
  isFriendsOnly?: boolean;
  onImageLoad?: () => void;
}>;

export function MapMarkerBadge({
  selected = false,
  kind = 'event',
  coverImageSource,
  coverImageSources,
  count = 1,
  dateBadge,
  isFriendsOnly = false,
  onImageLoad,
}: MapMarkerBadgeProps) {
  const { theme } = useAppTheme();
  const size = kind === 'search' ? 20 : 44;
  const [imageFailed, setImageFailed] = useState(false);
  const borderColor = isFriendsOnly ? theme.colors.friendEventAccent : selected ? theme.colors.mapAccent : theme.colors.accent;
  const visibleSources = coverImageSources?.length ? coverImageSources.slice(0, 4) : coverImageSource ? [coverImageSource] : [];
  const hasDateBadge = Boolean(dateBadge);

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
      <View style={styles.markerHead}>
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
            hasDateBadge && Platform.OS === 'android' ? styles.badgeUnderDate : null,
          ]}
        >
          {visibleSources.length > 1 && !imageFailed ? (
            <View style={styles.multiImageGrid}>
              {visibleSources.map((source, index) => (
                <Image
                  key={`${source.uri}:${index}`}
                  source={source}
                  style={styles.multiImage}
                  onLoad={() => onImageLoad?.()}
                  onError={() => {
                    setImageFailed(true);
                    onImageLoad?.();
                  }}
                />
              ))}
            </View>
          ) : visibleSources[0] && !imageFailed ? (
            <Image
              source={visibleSources[0]}
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
        {dateBadge ? <MarkerDateBadge badge={dateBadge} /> : null}
        {count > 1 ? (
          <View style={[styles.countBadge, { backgroundColor: theme.colors.mapAccent }]}>
            <AppText variant="label" color="textPrimary" style={styles.countText}>
              {count}+
            </AppText>
          </View>
        ) : null}
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

function MarkerDateBadge({ badge }: { badge: NonNullable<MapMarkerBadgeProps['dateBadge']> }) {
  const { theme } = useAppTheme();

  return (
    <View pointerEvents="none" style={styles.dateBadgeRail}>
      <View style={[styles.dateBadgePill, { backgroundColor: theme.colors[badge.colorKey] }]}>
        <AppText variant="caption" color="textPrimary" numberOfLines={1} style={styles.dateBadgeText}>
          {badge.label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 72,
    height: 56,
    overflow: 'visible',
  },
  markerHead: {
    position: 'relative',
    width: 72,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    top: 0,
    borderRadius: 999,
    borderWidth: 3,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 1,
  },
  friendsBadge: {
    shadowOpacity: 0.52,
    shadowRadius: 14,
    elevation: 12,
  },
  badgeUnderDate: {
    elevation: 0,
    zIndex: 0,
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
    marginTop: 0,
    borderRadius: 999,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  multiImageGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  multiImage: {
    width: '50%',
    height: '50%',
  },
  countBadge: {
    position: 'absolute',
    top: -9,
    right: -3,
    minWidth: 25,
    height: 25,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 11,
    lineHeight: 14,
  },
  dateBadgeRail: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    elevation: 50,
  },
  dateBadgePill: {
    borderRadius: 5,
    minWidth: 44,
    maxWidth: 70,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dateBadgeText: {
    fontSize: 9,
    lineHeight: 11,
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
