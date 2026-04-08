import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Supercluster from 'supercluster';

import { MAP_FOCUS_ZOOM, MAP_IOS_DELTA } from '@/core/maps/map-config';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapSurfaceProps } from '@/components/map/types';
import { useAppTheme } from '@/core/theme';
import { AppText } from '@/components/primitives';

const zoomToDelta = (zoom: number) => Math.min(0.25, Math.max(0.005, 180 / Math.pow(2, zoom)));
const deltaToZoom = (delta: number) => Math.max(0, Math.min(20, Math.round(Math.log2(360 / Math.max(delta, 0.0001)))));

type MarkerFeatureProperties = {
  id: string;
};

export function EventMapSurface({
  markers,
  userLocation: _userLocation,
  initialCenter,
  focusCoordinate,
  searchMarker,
  interactive = true,
  onMarkerPress,
  onCameraStateChange,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapRef = useRef<MapView | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: initialCenter.latitude,
    longitude: initialCenter.longitude,
    latitudeDelta: MAP_IOS_DELTA,
    longitudeDelta: MAP_IOS_DELTA,
  });

  const markerById = useMemo(() => new Map(markers.map((marker) => [marker.id, marker])), [markers]);
  const clusterPoints = useMemo<GeoJSON.Feature<GeoJSON.Point, MarkerFeatureProperties>[]>(
    () =>
      markers.map((marker) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.coordinate.longitude, marker.coordinate.latitude],
        },
        properties: {
          id: marker.id,
        },
      })),
    [markers],
  );

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<MarkerFeatureProperties>({
      radius: 60,
      maxZoom: 20,
      minPoints: 2,
    });
    index.load(clusterPoints);
    return index;
  }, [clusterPoints]);

  const clusters = useMemo(() => {
    const west = currentRegion.longitude - currentRegion.longitudeDelta / 2;
    const east = currentRegion.longitude + currentRegion.longitudeDelta / 2;
    const south = currentRegion.latitude - currentRegion.latitudeDelta / 2;
    const north = currentRegion.latitude + currentRegion.latitudeDelta / 2;
    const zoom = deltaToZoom(currentRegion.longitudeDelta);

    if (east < west) {
      return clusterIndex.getClusters([-180, south, 180, north], zoom);
    }

    return clusterIndex.getClusters([west, south, east, north], zoom);
  }, [clusterIndex, currentRegion]);

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
        onRegionChangeComplete={(region) => {
          setCurrentRegion(region);
          onCameraStateChange?.({
            center: { latitude: region.latitude, longitude: region.longitude },
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          });
        }}
      >
        {clusters.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates as [number, number];
          const properties = feature.properties as { cluster?: boolean; cluster_id?: number; point_count?: number; id?: string };

          if (properties.cluster && typeof properties.cluster_id === 'number') {
            const clusterId = properties.cluster_id;
            const count = properties.point_count ?? 0;

            return (
              <Marker
                key={`cluster-${clusterId}`}
                coordinate={{ latitude, longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => {
                  const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
                  const nextDelta = zoomToDelta(expansionZoom + 0.35);

                  mapRef.current?.animateToRegion(
                    {
                      latitude,
                      longitude,
                      latitudeDelta: nextDelta,
                      longitudeDelta: nextDelta,
                    },
                    380,
                  );
                }}
              >
                <View
                  style={[
                    styles.clusterBubble,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceElevated,
                    },
                  ]}
                >
                  <AppText variant="caption" style={styles.clusterLabel}>
                    {count}
                  </AppText>
                </View>
              </Marker>
            );
          }

          const markerId = properties.id;
          const marker = markerId ? markerById.get(markerId) : null;

          if (!marker) {
            return null;
          }

          return (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => onMarkerPress(marker.id)}
            >
              <MapMarkerBadge selected={marker.isSelected} coverImageUri={marker.coverImageUri} />
            </Marker>
          );
        })}

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
  clusterBubble: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clusterLabel: {
    textAlign: 'center',
  },
});
