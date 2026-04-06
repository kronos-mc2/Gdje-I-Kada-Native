import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { MAP_FOCUS_ZOOM, MAP_IOS_DELTA } from '@/core/maps/map-config';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapSurfaceProps } from '@/components/map/types';
import { useAppTheme } from '@/core/theme';

const zoomToDelta = (zoom: number) => Math.min(0.25, Math.max(0.005, 180 / Math.pow(2, zoom)));

export function EventMapSurface({
  markers,
  initialCenter,
  focusCoordinate,
  searchMarker,
  interactive = true,
  onMarkerPress,
  onCameraStateChange,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapRef = useRef<MapView | null>(null);

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
          latitudeDelta: MAP_IOS_DELTA,
          longitudeDelta: MAP_IOS_DELTA,
        }}
        onRegionChangeComplete={(region) =>
          onCameraStateChange?.({
            center: { latitude: region.latitude, longitude: region.longitude },
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          })
        }
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onMarkerPress(marker.id)}
          >
            <MapMarkerBadge selected={marker.isSelected} coverImageUri={marker.coverImageUri} />
          </Marker>
        ))}

        {searchMarker ? (
          <Marker coordinate={searchMarker} title="Search Result">
            <MapMarkerBadge selected kind="search" />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
