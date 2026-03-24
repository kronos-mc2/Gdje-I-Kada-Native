import { Pressable, StyleSheet } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { translate } from '@/core/i18n/translations';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';

type EventsMapProps = {
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  onEventPress: (eventId: string) => void;
};

export function EventsMap({ events, locale, onEventPress }: EventsMapProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard variant="glass" style={styles.container}>
      <AppText variant="headline" style={{ marginBottom: 6 }}>
        {translate(locale, 'mapView')}
      </AppText>
      <AppText variant="body" color="textMuted" style={{ marginBottom: 14 }}>
        {translate(locale, 'mapFallback')}
      </AppText>

      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => onEventPress(event.id)}
          style={({ pressed }) => [
            styles.row,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.84 : 1,
              borderRadius: theme.tokens.radius.md,
            },
          ]}
        >
          <AppText variant="bodyStrong">{event.title[locale]}</AppText>
          <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
            {event.where[locale]}
          </AppText>
        </Pressable>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
});
