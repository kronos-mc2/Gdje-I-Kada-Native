import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import Supercluster from 'supercluster';

import { AppText } from '@/components/primitives';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapMarker, EventMapSurfaceProps } from '@/components/map/types';
import { MAP_DEFAULT_ZOOM, MAP_FOCUS_ZOOM, MAPLIBRE_STYLE_URL_DARK, MAPLIBRE_STYLE_URL_LIGHT } from '@/core/maps/map-config';
import { useAppTheme } from '@/core/theme';

type RegionFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    zoomLevel?: number;
    visibleBounds?: [GeoJSON.Position, GeoJSON.Position];
  }
>;

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');
type MarkerFeatureProperties = {
  markerKey: string;
};
type Bounds = [number, number, number, number];
const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;

const hasMapLibreNativeModule = Boolean(NativeModules?.MLRNModule);
const mapLibreModule: MapLibreModule | null = hasMapLibreNativeModule
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@maplibre/maplibre-react-native') as MapLibreModule)
  : null;
const zoomToDelta = (zoom: number) => Math.min(0.25, Math.max(0.005, 180 / Math.pow(2, zoom)));

export function EventMapSurface({
  markers,
  userLocation,
  initialCenter,
  focusCoordinate,
  searchMarker,
  interactive = true,
  onMarkerPress,
  onCameraStateChange,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapLibreCameraRef = useRef<any>(null);
  const initialCameraSettingsRef = useRef({
    centerCoordinate: [initialCenter.longitude, initialCenter.latitude] as [number, number],
    zoomLevel: MAP_DEFAULT_ZOOM,
  });
  const annotationRefs = useRef<Record<string, { refresh?: () => void } | null>>({});
  const [currentZoom, setCurrentZoom] = useState<number>(MAP_DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);

  const validMarkers = useMemo(
    () => markers.filter((marker) => isValidCoordinate(marker.coordinate.latitude, marker.coordinate.longitude)),
    [markers],
  );
  const indexedMarkers = useMemo(
    () => validMarkers.map((marker, index) => ({ marker, markerKey: `${marker.id}:${index}` })),
    [validMarkers],
  );
  const markerByKey = useMemo(() => new Map(indexedMarkers.map((entry) => [entry.markerKey, entry.marker])), [indexedMarkers]);
  const clusterPoints = useMemo<GeoJSON.Feature<GeoJSON.Point, MarkerFeatureProperties>[]>(
    () =>
      indexedMarkers.map(({ marker, markerKey }) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.coordinate.longitude, marker.coordinate.latitude],
        },
        properties: {
          markerKey,
        },
      })),
    [indexedMarkers],
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

  const activeBounds = useMemo<Bounds>(() => {
    if (currentBounds) {
      return currentBounds;
    }

    const delta = zoomToDelta(currentZoom);
    return [
      initialCenter.longitude - delta / 2,
      initialCenter.latitude - delta / 2,
      initialCenter.longitude + delta / 2,
      initialCenter.latitude + delta / 2,
    ];
  }, [currentBounds, currentZoom, initialCenter]);

  const clusters = useMemo(() => {
    const [west, south, east, north] = activeBounds;
    const zoom = Math.max(0, Math.min(20, Math.floor(currentZoom)));

    if (east < west) {
      return clusterIndex.getClusters([-180, south, 180, north], zoom);
    }

    return clusterIndex.getClusters([west, south, east, north], zoom);
  }, [activeBounds, clusterIndex, currentZoom]);

  const renderItems = useMemo(
    () =>
      clusters.reduce<
        (
          | {
              kind: 'cluster';
              key: string;
              clusterId: number;
              count: number;
              latitude: number;
              longitude: number;
            }
          | { kind: 'marker'; key: string; markerKey: string; marker: EventMapMarker }
        )[]
      >((acc, feature) => {
        const [longitude, latitude] = feature.geometry.coordinates as [number, number];
        if (!isValidCoordinate(latitude, longitude)) {
          return acc;
        }

        const properties = feature.properties as {
          cluster?: boolean;
          cluster_id?: number;
          point_count?: number;
          markerKey?: string;
        };

        if (properties.cluster && typeof properties.cluster_id === 'number') {
          acc.push({
            kind: 'cluster',
            key: `cluster-${properties.cluster_id}`,
            clusterId: properties.cluster_id,
            count: properties.point_count ?? 0,
            latitude,
            longitude,
          });
          return acc;
        }

        const markerKey = properties.markerKey;
        if (!markerKey) {
          return acc;
        }

        const marker = markerByKey.get(markerKey);
        if (!marker) {
          return acc;
        }

        acc.push({
          kind: 'marker',
          key: `marker-${markerKey}`,
          markerKey,
          marker,
        });
        return acc;
      }, []),
    [clusters, markerByKey],
  );

  useEffect(() => {
    if (!focusCoordinate || !mapLibreModule || !mapLibreCameraRef.current) {
      return;
    }

    mapLibreCameraRef.current.setCamera({
      centerCoordinate: [focusCoordinate.longitude, focusCoordinate.latitude],
      zoomLevel: MAP_FOCUS_ZOOM,
      animationDuration: 560,
      animationMode: 'easeTo',
    });
  }, [focusCoordinate]);

  useEffect(() => {
    if (!mapLibreModule) {
      return;
    }

    const refreshAll = () => {
      for (const entry of indexedMarkers) {
        annotationRefs.current[entry.markerKey]?.refresh?.();
      }
    };

    const timers = [120, 450, 900].map((delayMs) => setTimeout(refreshAll, delayMs));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [indexedMarkers]);

  if (!mapLibreModule) {
    return (
      <View style={[styles.container, styles.missingModuleWrap, { backgroundColor: theme.colors.background }]}>
        <AppText variant="caption" color="textMuted">
          MapLibre native module nije dostupan u ovom buildu.
        </AppText>
      </View>
    );
  }

  const { Camera, MapView, PointAnnotation } = mapLibreModule;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        // Android default renderer: MapLibre (fallback above if native module is missing).
        mapStyle={theme.isDark ? MAPLIBRE_STYLE_URL_DARK : MAPLIBRE_STYLE_URL_LIGHT}
        logoEnabled={false}
        localizeLabels
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        onRegionDidChange={(feature) => {
          const region = feature as RegionFeature;
          const [longitude, latitude] = region.geometry.coordinates;
          const zoomLevel = region.properties?.zoomLevel;
          const visibleBounds = region.properties?.visibleBounds;

          if (typeof latitude === 'number' && typeof longitude === 'number') {
            if (typeof zoomLevel === 'number') {
              setCurrentZoom(zoomLevel);
            }

            if (Array.isArray(visibleBounds) && visibleBounds.length === 2) {
              const [northEast, southWest] = visibleBounds;
              const [east, north] = northEast;
              const [west, south] = southWest;

              if ([east, north, west, south].every((value) => typeof value === 'number')) {
                setCurrentBounds([west as number, south as number, east as number, north as number]);
              }
            }

            onCameraStateChange?.({
              center: { latitude, longitude },
              zoomLevel,
            });
          }
        }}
      >
        <Camera
          ref={mapLibreCameraRef}
          defaultSettings={initialCameraSettingsRef.current}
        />

        {renderItems.map((item) => {
          if (item.kind === 'cluster') {
            return (
              <PointAnnotation
                key={item.key}
                id={item.key}
                coordinate={[item.longitude, item.latitude]}
                anchor={{ x: 0.5, y: 0.5 }}
                onSelected={() => {
                  const expansionZoom = clusterIndex.getClusterExpansionZoom(item.clusterId);

                  mapLibreCameraRef.current?.setCamera({
                    centerCoordinate: [item.longitude, item.latitude],
                    zoomLevel: expansionZoom + 0.35,
                    animationDuration: 380,
                    animationMode: 'easeTo',
                  });
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
                    {item.count}
                  </AppText>
                </View>
              </PointAnnotation>
            );
          }

          const marker = item.marker;

          return (
            <PointAnnotation
              key={item.key}
              id={item.key}
              coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
              anchor={{ x: 0.5, y: 1 }}
              ref={(ref) => {
                annotationRefs.current[item.markerKey] = ref;
              }}
              onSelected={() => onMarkerPress(marker.id)}
            >
              <MapMarkerBadge
                selected={marker.isSelected}
                coverImageUri={marker.coverImageUri}
                onImageLoad={() => {
                  annotationRefs.current[item.markerKey]?.refresh?.();
                  setTimeout(() => {
                    annotationRefs.current[item.markerKey]?.refresh?.();
                  }, 120);
                }}
              />
            </PointAnnotation>
          );
        })}

        {searchMarker ? (
          <PointAnnotation id="search-marker" coordinate={[searchMarker.longitude, searchMarker.latitude]} anchor={{ x: 0.5, y: 1 }}>
            <MapMarkerBadge selected kind="search" />
          </PointAnnotation>
        ) : null}

        <PointAnnotation id="user-location-marker" coordinate={[userLocation.longitude, userLocation.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
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
        </PointAnnotation>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  missingModuleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
