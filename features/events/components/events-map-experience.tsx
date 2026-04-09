import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EventDetailSheet, EventMap } from '@/components/map';
import { MapSearchBar, MapSearchResults } from '@/components/search';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';
import { useEventMapSearch } from '@/features/events/hooks/use-event-map-search';
import { useMapLocationBootstrap } from '@/features/events/hooks/use-map-location-bootstrap';

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
  const locationConsent = useAppStore((state) => state.locationConsent);
  const locationSource = useAppStore((state) => state.locationSource);
  const setLocationConsent = useAppStore((state) => state.setLocationConsent);
  const { requestPreciseLocationNow } = useMapLocationBootstrap();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [focusCoordinate, setFocusCoordinate] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const { results: searchResults, isSearching } = useEventMapSearch({ events, query: searchQuery, locale });

  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const selectedEvent = selectedEventId ? eventsById.get(selectedEventId) ?? null : null;
  const hasAutoCenteredOnDeviceRef = useRef(false);
  const focusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueOneShotFocus = useCallback((coordinate: Coordinates) => {
    const nextFocus = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };

    setFocusCoordinate(nextFocus);

    if (focusResetTimerRef.current) {
      clearTimeout(focusResetTimerRef.current);
    }

    focusResetTimerRef.current = setTimeout(() => {
      setFocusCoordinate((current) => {
        if (!current) {
          return null;
        }

        const isSameTarget =
          Math.abs(current.latitude - nextFocus.latitude) < 0.000001 &&
          Math.abs(current.longitude - nextFocus.longitude) < 0.000001;

        return isSameTarget ? null : current;
      });
    }, 900);
  }, []);

  const clearPendingFocus = useCallback(() => {
    if (focusResetTimerRef.current) {
      clearTimeout(focusResetTimerRef.current);
      focusResetTimerRef.current = null;
    }

    setFocusCoordinate(null);
  }, []);

  const recenterToLatestKnownLocation = useCallback(() => {
    const latestUserLocation = useAppStore.getState().userLocation;
    queueOneShotFocus(latestUserLocation);
    setSelectedEventId(null);
    setIsSearchPanelVisible(false);
  }, [queueOneShotFocus]);

  const runRecenterFlow = useCallback(
    async (shouldRequestPrecise: boolean) => {
      if (shouldRequestPrecise && Platform.OS !== 'android') {
        await requestPreciseLocationNow();
      }

      recenterToLatestKnownLocation();
    },
    [recenterToLatestKnownLocation, requestPreciseLocationNow],
  );

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    if (!eventsById.has(selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, eventsById]);

  useEffect(() => {
    if (locationSource !== 'device' || hasAutoCenteredOnDeviceRef.current) {
      return;
    }

    hasAutoCenteredOnDeviceRef.current = true;
    queueOneShotFocus(userLocation);
  }, [locationSource, queueOneShotFocus, userLocation]);

  useEffect(
    () => () => {
      if (focusResetTimerRef.current) {
        clearTimeout(focusResetTimerRef.current);
      }
    },
    [],
  );

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
        onCameraStateChange={() => {
          clearPendingFocus();
        }}
        onSelectEvent={(eventId) => {
          const event = eventsById.get(eventId);
          if (!event) {
            return;
          }

          setSelectedEventId(eventId);
          setSearchQuery(event.title[locale]);
          queueOneShotFocus(event.coordinates);
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
              queueOneShotFocus(event.coordinates);
            }
            setIsSearchPanelVisible(false);
          }}
        />
      </View>

      <Pressable
        onPress={() => {
          if (locationConsent !== 'accepted') {
            Alert.alert(t('locationConsentTitle'), t('locationConsentBody'), [
              {
                text: t('notNow'),
                style: 'cancel',
                onPress: () => {
                  setLocationConsent('rejected');
                  recenterToLatestKnownLocation();
                },
              },
              {
                text: t('allow'),
                onPress: () => {
                  setLocationConsent('accepted');
                  void runRecenterFlow(true);
                },
              },
            ]);
          } else {
            void runRecenterFlow(true);
          }
        }}
        style={({ pressed }) => [
          styles.recenterButton,
          {
            bottom: detailBottomInset + 10,
            right: theme.tokens.spacing.md,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons name="locate-outline" size={17} color={theme.colors.textPrimary} />
      </Pressable>

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
  recenterButton: {
    position: 'absolute',
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
