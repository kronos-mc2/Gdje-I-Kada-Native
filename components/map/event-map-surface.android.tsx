import { useEffect, useRef } from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapSurfaceProps } from '@/components/map/types';
import { MAP_DEFAULT_ZOOM, MAP_FOCUS_ZOOM, MAPLIBRE_STYLE_URL_DARK, MAPLIBRE_STYLE_URL_LIGHT } from '@/core/maps/map-config';
import { useAppTheme } from '@/core/theme';

type RegionFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    zoomLevel?: number;
  }
>;

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

const hasMapLibreNativeModule = Boolean(NativeModules?.MLRNModule);
const mapLibreModule: MapLibreModule | null = hasMapLibreNativeModule
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@maplibre/maplibre-react-native') as MapLibreModule)
  : null;

export function EventMapSurface({
  markers,
  initialCenter,
  focusCoordinate,
  searchMarker,
  onMarkerPress,
  onCameraStateChange,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapLibreCameraRef = useRef<any>(null);
  const annotationRefs = useRef<Record<string, { refresh?: () => void } | null>>({});

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
      for (const marker of markers) {
        annotationRefs.current[marker.id]?.refresh?.();
      }
    };

    const timers = [120, 450, 900].map((delayMs) => setTimeout(refreshAll, delayMs));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [markers]);

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
        onRegionDidChange={(feature) => {
          const region = feature as RegionFeature;
          const [longitude, latitude] = region.geometry.coordinates;

          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onCameraStateChange?.({
              center: { latitude, longitude },
              zoomLevel: region.properties?.zoomLevel,
            });
          }
        }}
      >
        <Camera
          ref={mapLibreCameraRef}
          defaultSettings={{
            centerCoordinate: [initialCenter.longitude, initialCenter.latitude],
            zoomLevel: MAP_DEFAULT_ZOOM,
          }}
        />

        {markers.map((marker) => (
          <PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            ref={(ref) => {
              annotationRefs.current[marker.id] = ref;
            }}
            onSelected={() => onMarkerPress(marker.id)}
          >
            <MapMarkerBadge
              selected={marker.isSelected}
              coverImageUri={marker.coverImageUri}
              onImageLoad={() => {
                annotationRefs.current[marker.id]?.refresh?.();
                setTimeout(() => {
                  annotationRefs.current[marker.id]?.refresh?.();
                }, 120);
              }}
            />
          </PointAnnotation>
        ))}

        {searchMarker ? (
          <PointAnnotation id="search-marker" coordinate={[searchMarker.longitude, searchMarker.latitude]} anchor={{ x: 0.5, y: 1 }}>
            <MapMarkerBadge selected kind="search" />
          </PointAnnotation>
        ) : null}
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
});
