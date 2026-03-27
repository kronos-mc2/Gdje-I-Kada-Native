import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailSheet, EventMap } from '@/components/map';
import { MapSearchBar, MapSearchResults } from '@/components/search';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';
import { useEventMapSearch } from '@/features/events/hooks/use-event-map-search';

type EventsMapExperienceProps = {
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  onEventPress?: (eventId: string) => void;
};

export function EventsMapExperience({ events, locale, userLocation }: EventsMapExperienceProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [focusCoordinate, setFocusCoordinate] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const { results: searchResults, isSearching } = useEventMapSearch({ events, query: searchQuery, locale });

  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const selectedEvent = selectedEventId ? eventsById.get(selectedEventId) ?? null : null;

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    if (!eventsById.has(selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, eventsById]);

  const showSearchResults = isSearchPanelVisible && searchQuery.trim().length > 0;
  const detailBottomInset = Platform.OS === 'android' ? insets.bottom + 92 : insets.bottom + 62;

  return (
    <View style={styles.container}>
      <EventMap
        events={events}
        locale={locale}
        userLocation={userLocation}
        selectedEventId={selectedEventId}
        searchMarker={null}
        focusCoordinate={focusCoordinate}
        onSelectEvent={(eventId) => {
          const event = eventsById.get(eventId);
          if (!event) {
            return;
          }

          setSelectedEventId(eventId);
          setSearchQuery(event.title[locale]);
          setFocusCoordinate({
            latitude: event.coordinates.latitude,
            longitude: event.coordinates.longitude,
          });
          setIsSearchPanelVisible(false);
        }}
      />

      <View
        style={[
          styles.topOverlay,
          {
            top: insets.top + theme.tokens.spacing.xs,
            left: theme.tokens.spacing.md,
            right: theme.tokens.spacing.md,
          },
        ]}
      >
        <MapSearchBar
          value={searchQuery}
          placeholder={t('searchEventsMapPlaceholder')}
          loading={isSearching}
          onChangeText={(value) => {
            setSearchQuery(value);
            setIsSearchPanelVisible(value.trim().length > 0);
          }}
          onClear={() => {
            setSearchQuery('');
            setIsSearchPanelVisible(false);
          }}
          onFocus={() => setIsSearchPanelVisible(true)}
          onBlur={() => undefined}
        />

        <MapSearchResults
          visible={showSearchResults}
          loading={isSearching}
          query={searchQuery}
          results={searchResults}
          searchingLabel={t('searchingEvents')}
          noResultsLabel={t('noEventsFoundForSearch')}
          hintLabel={t('typeToSearchEvents')}
          onSelectResult={(result) => {
            setSearchQuery(result.title);
            setSelectedEventId(result.eventId);
            const event = eventsById.get(result.eventId);
            if (event) {
              setFocusCoordinate({
                latitude: event.coordinates.latitude,
                longitude: event.coordinates.longitude,
              });
            }
            setIsSearchPanelVisible(false);
          }}
        />
      </View>

      {selectedEvent ? (
        <EventDetailSheet
          key={selectedEvent.id}
          event={selectedEvent}
          locale={locale}
          topInset={insets.top + 64}
          bottomInset={detailBottomInset}
          onClose={() => setSelectedEventId(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
  },
});
