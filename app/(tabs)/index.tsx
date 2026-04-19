import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventsMapExperience } from '@/features/events/components/events-map-experience';
import { createInitialMapDateFilter, MapDateFilter, useEventsMapScreenModel } from '@/features/events/hooks/use-events-map-screen-model';
import { useAppTheme } from '@/core/theme';

export default function EventsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [dateFilter, setDateFilter] = useState<MapDateFilter>(() => createInitialMapDateFilter());
  const [searchQuery, setSearchQuery] = useState('');
  const { events, userLocation, locale } = useEventsMapScreenModel({ dateFilter, searchQuery });

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <EventsMapExperience
        events={events}
        locale={locale}
        userLocation={userLocation}
        dateFilter={dateFilter}
        searchQuery={searchQuery}
        onDateFilterChange={setDateFilter}
        onSearchQueryChange={setSearchQuery}
        onCreateEventPress={() => router.push('/create-event')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
