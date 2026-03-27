import { StyleSheet, View } from 'react-native';

import { EventsMapExperience } from '@/features/events/components/events-map-experience';
import { useEventsMapScreenModel } from '@/features/events/hooks/use-events-map-screen-model';
import { useAppTheme } from '@/core/theme';

export default function EventsScreen() {
  const { theme } = useAppTheme();
  const { events, userLocation, locale } = useEventsMapScreenModel();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <EventsMapExperience events={events} locale={locale} userLocation={userLocation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
