import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';

import { getLocationAccuracyRadiusMeters } from '@/core/maps/location-accuracy';
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
  focusZoomLevel,
  searchMarker,
  showsUserLocation = true,
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
  const userLocationAccuracyRadius = showsUserLocation ? getLocationAccuracyRadiusMeters(userLocation) : null;

  useEffect(() => {
    if (!focusCoordinate || !mapRef.current) {
      return;
    }

    const delta = zoomToDelta(focusZoomLevel ?? MAP_FOCUS_ZOOM);
    const region: Region = {
      latitude: focusCoordinate.latitude,
      longitude: focusCoordinate.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };

    mapRef.current.animateToRegion(region, 560);
  }, [focusCoordinate, focusZoomLevel]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // iOS intentionally uses MapKit renderer (no Google provider).
        mapType="standard"
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
        showsUserLocation={showsUserLocation}
        tintColor={theme.colors.mapAccent}
        userLocationAnnotationTitle=""
        userLocationCalloutEnabled={false}
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
        {userLocationAccuracyRadius && isValidCoordinate(userLocation.latitude, userLocation.longitude) ? (
          <Circle
            center={userLocation}
            radius={userLocationAccuracyRadius}
            fillColor={theme.colors.mapAccentSoft}
            strokeColor={theme.colors.mapAccent}
            strokeWidth={1}
          />
        ) : undefined}

        {validMarkers.map((marker, index) => (
          <Marker
            key={`event-marker-${marker.id}:${index}`}
            coordinate={marker.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onMarkerPress(marker.id)}
          >
            <MapMarkerBadge
              selected={marker.isSelected}
              coverImageSource={marker.coverImageSource}
              coverImageSources={marker.coverImageSources}
              count={marker.count}
              dateBadge={marker.dateBadge}
              isFriendsOnly={marker.isFriendsOnly}
            />
          </Marker>
        ))}

        {searchMarker && isValidCoordinate(searchMarker.latitude, searchMarker.longitude) ? (
          <Marker key="search-marker" coordinate={searchMarker} title="Search Result">
            <MapMarkerBadge selected kind="search" />
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
});
