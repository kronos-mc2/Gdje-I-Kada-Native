import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EventDetailSheet, EventMap } from '@/components/map';
import type { MapCameraState } from '@/components/map/types';
import { MapSearchBar, MapSearchResults } from '@/components/search';
import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { MAP_AUTO_USER_ZOOM, MAP_FOCUS_ZOOM } from '@/core/maps/map-config';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Coordinates, EventAttendanceMode, Locale } from '@/core/types/domain';
import { useEventMapSearch } from '@/features/events/hooks/use-event-map-search';
import { MapDateFilter, MapQuickFilter } from '@/features/events/hooks/use-events-map-screen-model';
import { useMapLocationBootstrap } from '@/features/events/hooks/use-map-location-bootstrap';
import { MapNearbySheet } from '@/features/events/components/map-nearby-sheet';
import { MapFilterModal } from '@/features/events/components/map-filter-modal';

const NEARBY_SHEET_COLLAPSED_HEIGHT = 96;
const TOOLBAR_BOTTOM_GAP_ANDROID = 18;
const TOOLBAR_BOTTOM_GAP_IOS = -18;
type IconName = ComponentProps<typeof Ionicons>['name'];

type EventsMapExperienceProps = Readonly<{
  events: AppEvent[];
  locale: Locale;
  userLocation: Coordinates;
  dateFilter: MapDateFilter;
  selectedTags: string[];
  attendanceModes: EventAttendanceMode[];
  activeQuickFilter: MapQuickFilter | null;
  searchQuery: string;
  onDateFilterChange: (dateFilter: MapDateFilter) => void;
  onSelectedTagsChange: (tags: string[]) => void;
  onClearFilters: () => void;
  onQuickFilterPress: (filter: MapQuickFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onMapCameraChange?: (camera: MapCameraState) => void;
  onCreateEventPress: () => void;
}>;

export function EventsMapExperience({
  events,
  locale,
  userLocation,
  dateFilter,
  selectedTags,
  attendanceModes,
  activeQuickFilter,
  searchQuery,
  onDateFilterChange,
  onSelectedTagsChange,
  onClearFilters,
  onQuickFilterPress,
  onSearchQueryChange,
  onMapCameraChange,
  onCreateEventPress,
}: EventsMapExperienceProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const locationConsent = useAppStore((state) => state.locationConsent);
  const locationSource = useAppStore((state) => state.locationSource);
  const setLocationSource = useAppStore((state) => state.setLocationSource);
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const nearbyRadiusKm = useAppStore((state) => state.nearbyRadiusKm);
  const { requestPreciseLocationNow } = useMapLocationBootstrap();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectionEvents, setSelectionEvents] = useState<AppEvent[] | null>(null);
  const [nearbyCloseSignal, setNearbyCloseSignal] = useState(0);
  const [nearbyVisibleHeight, setNearbyVisibleHeight] = useState(NEARBY_SHEET_COLLAPSED_HEIGHT);
  const [focusTarget, setFocusTarget] = useState<{ coordinate: Coordinates; zoomLevel: number } | null>(null);
  const [isRecenterBusy, setIsRecenterBusy] = useState(false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
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
  const detailBottomInset = Platform.OS === 'android' ? insets.bottom + 112 : insets.bottom + 102;
  const toolbarBottomGap = Platform.OS === 'ios' ? TOOLBAR_BOTTOM_GAP_IOS : TOOLBAR_BOTTOM_GAP_ANDROID;
  const toolbarBottomEdge = Math.max(insets.bottom, 10) + toolbarBottomGap;
  const floatingControlsBottom = Math.max(
    detailBottomInset + 10,
    toolbarBottomEdge + nearbyVisibleHeight + 10,
  );
  const hasActiveFilters = dateFilter.mode !== 'all' || selectedTags.length > 0 || attendanceModes.length > 0;

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
        onCameraStateChange={(camera) => {
          onMapCameraChange?.(camera);
          clearPendingFocus();
        }}
        onUserLocationUpdate={handleNativeUserLocationUpdate}
        onSelectEvent={(eventIds) => {
          const selectedEvents = eventIds.map((eventId) => eventsById.get(eventId)).filter((event): event is AppEvent => Boolean(event));
          const event = selectedEvents[0];
          if (!event) {
            return;
          }

          if (selectedEvents.length > 1) {
            setSelectionEvents(selectedEvents);
            setSelectedEventId(null);
            queueOneShotFocus(event.coordinates);
            setIsSearchPanelVisible(false);
            return;
          }

          setSelectionEvents(null);
          setSelectedEventId(event.id);
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
          onFilterPress={() => {
            setIsFilterModalVisible(true);
            setIsSearchPanelVisible(false);
          }}
          onFocus={() => setIsSearchPanelVisible(true)}
          onBlur={() => undefined}
          filterActive={hasActiveFilters}
          filterAccessibilityLabel={t('filters')}
          clearAccessibilityLabel={t('clearSearch')}
        />

        <MapQuickFilters activeFilter={activeQuickFilter} onPress={onQuickFilterPress} />

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
            bottom: floatingControlsBottom + 48,
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
            bottom: floatingControlsBottom,
            right: theme.tokens.spacing.md,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            opacity: pressed || isRecenterBusy ? 0.62 : 1,
          },
        ]}
      >
        <Ionicons name="locate-outline" size={17} color={theme.colors.textPrimary} />
      </Pressable>

      <MapNearbySheet
        events={events}
        locale={locale}
        userLocation={userLocation}
        radiusKm={nearbyRadiusKm}
        bottomInset={insets.bottom}
        closeSignal={nearbyCloseSignal}
        onVisibleHeightChange={setNearbyVisibleHeight}
        onSelectEvent={(event) => {
          setNearbyCloseSignal((signal) => signal + 1);
          setSelectionEvents(null);
          setSelectedEventId(event.id);
          queueOneShotFocus(event.coordinates);
        }}
      />

      {selectionEvents ? (
        <MapNearbySheet
          events={selectionEvents}
          locale={locale}
          userLocation={userLocation}
          radiusKm={Number.POSITIVE_INFINITY}
          bottomInset={insets.bottom}
          title={t('eventSelection')}
          initiallyExpanded
          onSelectEvent={(event) => {
            setNearbyCloseSignal((signal) => signal + 1);
            setSelectionEvents(null);
            setSelectedEventId(event.id);
            queueOneShotFocus(event.coordinates);
          }}
          onClose={() => setSelectionEvents(null)}
        />
      ) : null}

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

      <MapFilterModal
        visible={isFilterModalVisible}
        locale={locale}
        dateFilter={dateFilter}
        selectedTags={selectedTags}
        onDateFilterChange={onDateFilterChange}
        onSelectedTagsChange={onSelectedTagsChange}
        onClearFilters={onClearFilters}
        onClose={() => setIsFilterModalVisible(false)}
      />
    </View>
  );
}

function MapQuickFilters({
  activeFilter,
  onPress,
}: {
  activeFilter: MapQuickFilter | null;
  onPress: (filter: MapQuickFilter) => void;
}) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const filters: { key: MapQuickFilter; label: string; icon: IconName }[] = [
    { key: 'today', label: t('quickToday'), icon: 'moon-outline' },
    { key: 'thisWeek', label: t('thisWeek'), icon: 'calendar-outline' },
    { key: 'free', label: t('freeFilter'), icon: 'ticket-outline' },
    { key: 'paid', label: t('paidFilter'), icon: 'card-outline' },
    { key: 'waitlist', label: t('reservationFilter'), icon: 'time-outline' },
    { key: 'weekend', label: t('weekend'), icon: 'sunny-outline' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickFilterContent}
      style={styles.quickFilterScroll}
    >
      {filters.map((filter) => {
        const active = activeFilter === filter.key;
        return (
          <Pressable
            key={filter.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onPress(filter.key)}
            style={({ pressed }) => [
              styles.quickFilterChip,
              {
                borderColor: active ? theme.colors.mapAccent : theme.colors.border,
                backgroundColor: active ? theme.colors.mapAccent : theme.colors.surface,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Ionicons name={filter.icon} size={14} color={active ? '#FFFFFF' : theme.colors.textSecondary} />
            <AppText variant="caption" style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary }}>
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
  },
  quickFilterScroll: {
    marginTop: 10,
  },
  quickFilterContent: {
    gap: 8,
    paddingRight: 6,
  },
  quickFilterChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
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
