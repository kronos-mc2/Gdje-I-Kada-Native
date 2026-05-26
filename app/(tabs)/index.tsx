import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapCameraState } from '@/components/map/types';
import { EventsMapExperience } from '@/features/events/components/events-map-experience';
import {
  createInitialMapDateFilter,
  useEventsMapScreenModel,
} from '@/features/events/hooks/use-events-map-screen-model';
import type { MapDateFilter, MapEventViewport } from '@/features/events/hooks/use-events-map-screen-model';
import { useAppTheme } from '@/core/theme';

const MIN_VIEWPORT_RADIUS_KM = 5;
const MAX_VIEWPORT_RADIUS_KM = 500;

export default function EventsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [dateFilter, setDateFilter] = useState<MapDateFilter>(() => createInitialMapDateFilter());
  const [searchQuery, setSearchQuery] = useState('');
  const [mapViewport, setMapViewport] = useState<MapEventViewport | null>(null);
  const { events, userLocation, locale } = useEventsMapScreenModel({ dateFilter, searchQuery, viewport: mapViewport });

  const handleMapCameraChange = useCallback((camera: MapCameraState) => {
    const radiusKm = estimateViewportRadiusKm(camera);
    setMapViewport((current) => {
      if (
        current &&
        Math.abs(current.latitude - camera.center.latitude) < 0.01 &&
        Math.abs(current.longitude - camera.center.longitude) < 0.01 &&
        Math.abs(current.radiusKm - radiusKm) < 2
      ) {
        return current;
      }

      return {
        latitude: camera.center.latitude,
        longitude: camera.center.longitude,
        radiusKm,
      };
    });
  }, []);

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
        onMapCameraChange={handleMapCameraChange}
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

function estimateViewportRadiusKm(camera: MapCameraState) {
  if (typeof camera.latitudeDelta === 'number' || typeof camera.longitudeDelta === 'number') {
    const latRadius = ((camera.latitudeDelta ?? 0) * 111) / 2;
    const lngRadius = ((camera.longitudeDelta ?? 0) * 111) / 2;
    return clampRadius(Math.max(latRadius, lngRadius) * 1.35);
  }

  if (typeof camera.zoomLevel === 'number') {
    return clampRadius(20000 / Math.pow(2, camera.zoomLevel));
  }

  return 50;
}

function clampRadius(radiusKm: number) {
  if (!Number.isFinite(radiusKm)) {
    return 50;
  }

  return Math.min(MAX_VIEWPORT_RADIUS_KM, Math.max(MIN_VIEWPORT_RADIUS_KM, Math.round(radiusKm)));
}
