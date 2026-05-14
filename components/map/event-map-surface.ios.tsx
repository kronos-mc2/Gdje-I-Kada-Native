import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { MAP_FOCUS_ZOOM, MAP_IOS_DELTA } from '@/core/maps/map-config';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapSurfaceProps } from '@/components/map/types';
import { useAppTheme } from '@/core/theme';

const zoomToDelta = (zoom: number) => Math.min(0.25, Math.max(0.005, 180 / Math.pow(2, zoom)));
const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;

export function EventMapSurface({
  markers,
  userLocation,
  initialCenter,
  initialZoomLevel,
  focusCoordinate,
  searchMarker,
  interactive = true,
  onMarkerPress,
  onCameraStateChange,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapRef = useRef<MapView | null>(null);
  const validMarkers = useMemo(
    () => markers.filter((marker) => isValidCoordinate(marker.coordinate.latitude, marker.coordinate.longitude)),
    [markers],
  );

  useEffect(() => {
    if (!focusCoordinate || !mapRef.current) {
      return;
    }

    const delta = zoomToDelta(MAP_FOCUS_ZOOM);
    const region: Region = {
      latitude: focusCoordinate.latitude,
      longitude: focusCoordinate.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };

    mapRef.current.animateToRegion(region, 560);
  }, [focusCoordinate]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // iOS intentionally uses MapKit renderer (no Google provider).
        mapType="standard"
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        initialRegion={{
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          latitudeDelta: initialZoomLevel ? zoomToDelta(initialZoomLevel) : MAP_IOS_DELTA,
          longitudeDelta: initialZoomLevel ? zoomToDelta(initialZoomLevel) : MAP_IOS_DELTA,
        }}
        onRegionChangeComplete={(region) => {
          onCameraStateChange?.({
            center: { latitude: region.latitude, longitude: region.longitude },
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          });
        }}
      >
        {validMarkers.map((marker, index) => (
          <Marker
            key={`event-marker-${marker.id}:${index}`}
            coordinate={marker.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onMarkerPress(marker.id)}
          >
            <MapMarkerBadge selected={marker.isSelected} coverImageUri={marker.coverImageUri} />
          </Marker>
        ))}

        {searchMarker && isValidCoordinate(searchMarker.latitude, searchMarker.longitude) ? (
          <Marker key="search-marker" coordinate={searchMarker} title="Search Result">
            <MapMarkerBadge selected kind="search" />
          </Marker>
        ) : undefined}

        {isValidCoordinate(userLocation.latitude, userLocation.longitude) ? (
          <Marker key="user-location-marker" coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={[
                styles.userLocationOuter,
                {
                  borderColor: theme.colors.mapAccent,
                  backgroundColor: theme.colors.mapAccentSoft,
                },
              ]}
            >
              <View style={[styles.userLocationInner, { backgroundColor: theme.colors.mapAccent }]} />
            </View>
          </Marker>
        ) : undefined}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userLocationOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
