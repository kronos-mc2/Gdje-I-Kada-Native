import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import { EventDetailSheet, EventMap } from '@/components/map';
import { AppText } from '@/components/primitives';
import { MapSearchBar, MapSearchResults } from '@/components/search';
import { useI18n } from '@/core/i18n/use-i18n';
import { MAP_AUTO_USER_ZOOM, MAP_FOCUS_ZOOM } from '@/core/maps/map-config';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, Locale } from '@/core/types/domain';
import { useEventMapSearch } from '@/features/events/hooks/use-event-map-search';
import { MapDateFilterControl } from '@/features/events/components/map-date-filter-control';
import { MapDateFilter } from '@/features/events/hooks/use-events-map-screen-model';
import { useMapLocationBootstrap } from '@/features/events/hooks/use-map-location-bootstrap';

type EventsMapExperienceProps = {
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  dateFilter: MapDateFilter;
  searchQuery: string;
  onDateFilterChange: (dateFilter: MapDateFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onCreateEventPress: () => void;
  onEventPress?: (eventId: string) => void;
};

export function EventsMapExperience({
  events,
  locale,
  userLocation,
  dateFilter,
  searchQuery,
  onDateFilterChange,
  onSearchQueryChange,
  onCreateEventPress,
}: EventsMapExperienceProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const locationConsent = useAppStore((state) => state.locationConsent);
  const locationSource = useAppStore((state) => state.locationSource);
  const setLocationSource = useAppStore((state) => state.setLocationSource);
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const { requestPreciseLocationNow } = useMapLocationBootstrap();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ coordinate: Coordinates; zoomLevel: number } | null>(null);
  const [isRecenterBusy, setIsRecenterBusy] = useState(false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const { results: searchResults, isSearching } = useEventMapSearch({ events, query: searchQuery, locale });

  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const selectedEvent = selectedEventId ? eventsById.get(selectedEventId) ?? null : null;
  const hasAutoCenteredOnDeviceRef = useRef(false);
  const focusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recenterResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueOneShotFocus = useCallback((coordinate: Coordinates, zoomLevel = MAP_FOCUS_ZOOM) => {
    const nextFocus = {
      coordinate: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      },
      zoomLevel,
    };

    setFocusTarget(nextFocus);

    if (focusResetTimerRef.current) {
      clearTimeout(focusResetTimerRef.current);
    }

    focusResetTimerRef.current = setTimeout(() => {
      setFocusTarget((current) => {
        if (!current) {
          return null;
        }

        const isSameTarget =
          Math.abs(current.coordinate.latitude - nextFocus.coordinate.latitude) < 0.000001 &&
          Math.abs(current.coordinate.longitude - nextFocus.coordinate.longitude) < 0.000001 &&
          Math.abs(current.zoomLevel - nextFocus.zoomLevel) < 0.000001;

        return isSameTarget ? null : current;
      });
    }, 900);
  }, []);

  const clearPendingFocus = useCallback(() => {
    if (focusResetTimerRef.current) {
      clearTimeout(focusResetTimerRef.current);
      focusResetTimerRef.current = null;
    }

    setFocusTarget(null);
  }, []);

  const recenterToLatestKnownLocation = useCallback((zoomLevel = MAP_FOCUS_ZOOM) => {
    const latestUserLocation = useAppStore.getState().userLocation;
    queueOneShotFocus(latestUserLocation, zoomLevel);
    setSelectedEventId(null);
    setIsSearchPanelVisible(false);
  }, [queueOneShotFocus]);

  const runRecenterFlow = useCallback(
    async (shouldRequestPrecise: boolean) => {
      if (isRecenterBusy) {
        return;
      }

      setIsRecenterBusy(true);

      if (recenterResetTimerRef.current) {
        clearTimeout(recenterResetTimerRef.current);
      }

      try {
        if (shouldRequestPrecise) {
          await requestPreciseLocationNow();
        }

        recenterToLatestKnownLocation(MAP_FOCUS_ZOOM);
      } finally {
        recenterResetTimerRef.current = setTimeout(() => {
          setIsRecenterBusy(false);
          recenterResetTimerRef.current = null;
        }, 820);
      }
    },
    [isRecenterBusy, recenterToLatestKnownLocation, requestPreciseLocationNow],
  );

  const handleNativeUserLocationUpdate = useCallback(
    (coordinates: Coordinates) => {
      setUserLocation(coordinates);
      setLocationSource('device');
    },
    [setLocationSource, setUserLocation],
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
    queueOneShotFocus(userLocation, MAP_AUTO_USER_ZOOM);
  }, [locationSource, queueOneShotFocus, userLocation]);

  useEffect(
    () => () => {
      if (focusResetTimerRef.current) {
        clearTimeout(focusResetTimerRef.current);
      }
      if (recenterResetTimerRef.current) {
        clearTimeout(recenterResetTimerRef.current);
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
        focusCoordinate={focusTarget?.coordinate ?? null}
        focusZoomLevel={focusTarget?.zoomLevel}
        showsUserLocation={locationConsent === 'accepted'}
        onCameraStateChange={() => {
          clearPendingFocus();
        }}
        onUserLocationUpdate={handleNativeUserLocationUpdate}
        onSelectEvent={(eventId) => {
          const event = eventsById.get(eventId);
          if (!event) {
            return;
          }

          setSelectedEventId(eventId);
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
            onSearchQueryChange(value);
            setIsSearchPanelVisible(value.trim().length > 0);
          }}
          onClear={() => {
            onSearchQueryChange('');
            setIsSearchPanelVisible(false);
          }}
          onFocus={() => setIsSearchPanelVisible(true)}
          onBlur={() => undefined}
        />

        <MapDateFilterControl
          dateFilter={dateFilter}
          locale={locale}
          canUseLiquidGlass={canUseLiquidGlass}
          onDateFilterChange={onDateFilterChange}
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
        accessibilityRole="button"
        accessibilityLabel={t('createEvent')}
        onPress={onCreateEventPress}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            bottom: detailBottomInset + 58,
            right: theme.tokens.spacing.md,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.mapAccent,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={22} color={theme.isDark ? theme.colors.textPrimary : theme.colors.background} />
      </Pressable>

      <Pressable
        disabled={isRecenterBusy}
        accessibilityRole="button"
        accessibilityLabel={t('recenterMap')}
        accessibilityState={{ busy: isRecenterBusy, disabled: isRecenterBusy }}
        onPress={() => {
          void runRecenterFlow(true);
        }}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            bottom: detailBottomInset + 10,
            right: theme.tokens.spacing.md,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            opacity: pressed || isRecenterBusy ? 0.62 : 1,
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
  floatingButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
