import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { EventMapSurfaceProps } from '@/components/map/types';

export function EventMapSurface({ markers, onMarkerPress }: EventMapSurfaceProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard variant="glass" style={styles.container}>
      <AppText variant="headline" style={styles.title}>
        Map view
      </AppText>
      <AppText variant="body" color="textMuted" style={styles.subtitle}>
        Native map rendering is enabled on iOS and Android.
      </AppText>

      <View>
        {markers.map((marker) => (
          <Pressable
            key={marker.id}
            onPress={() => onMarkerPress(marker.id)}
            style={({ pressed }) => [
              styles.row,
              {
                borderColor: marker.isFriendsOnly
                  ? theme.colors.friendEventAccent
                  : selectedMarkerBorderColor(marker.isSelected, theme.colors.mapAccent, theme.colors.border),
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <AppText variant="bodyStrong">{marker.title}</AppText>
            {marker.subtitle ? (
              <AppText variant="caption" color="textMuted" style={styles.caption}>
                {marker.subtitle}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </View>
    </AppCard>
  );
}

function selectedMarkerBorderColor(selected: boolean, selectedColor: string, fallbackColor: string) {
  return selected ? selectedColor : fallbackColor;
}

const styles = StyleSheet.create({
  container: {
    minHeight: 320,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 14,
  },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  caption: {
    marginTop: 2,
  },
});
