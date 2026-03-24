import { Pressable, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { AppCard, AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';

type EventsMapProps = {
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  onEventPress: (eventId: string) => void;
};

export function EventsMap({ events, locale, userLocation, onEventPress }: EventsMapProps) {
  const { theme } = useAppTheme();
  const initialCenter = events[0]?.coordinates ?? userLocation;

  return (
    <AppCard variant="glass" style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        <Marker coordinate={userLocation} title="You" description="Current user location" pinColor={theme.colors.textSecondary} />

        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            title={event.title[locale]}
            description={event.where[locale]}
            pinColor={theme.colors.textMuted}
          >
            <Pressable
              onPress={() => onEventPress(event.id)}
              style={({ pressed }) => [
                styles.markerChip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <AppText variant="caption" style={{ color: theme.colors.textSecondary }}>
                {event.title[locale]}
              </AppText>
            </Pressable>
          </Marker>
        ))}
      </MapView>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 340,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
