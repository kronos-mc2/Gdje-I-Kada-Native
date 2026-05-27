import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { MapMarkerBadge } from '@/components/map/map-marker-badge';
import { EventMapSurfaceProps } from '@/components/map/types';
import { createAccuracyCircleFeature, getLocationAccuracyRadiusMeters } from '@/core/maps/location-accuracy';
import { MAP_DEFAULT_ZOOM, MAP_FOCUS_ZOOM, MAPLIBRE_STYLE_URL_DARK, MAPLIBRE_STYLE_URL_LIGHT } from '@/core/maps/map-config';
import { useAppTheme } from '@/core/theme';

type RegionFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    zoomLevel?: number;
    visibleBounds?: [GeoJSON.Position, GeoJSON.Position];
    isUserInteraction?: boolean;
  }
>;

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');
type CameraCommand = {
  key: string;
  centerCoordinate: [number, number];
  zoomLevel: number;
  animationDuration: number;
};
const isValidCoordinate = (latitude: unknown, longitude: unknown) =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;

const hasMapLibreNativeModule = Boolean(NativeModules?.MLRNModule);
const mapLibreModule: MapLibreModule | null = hasMapLibreNativeModule
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@maplibre/maplibre-react-native') as MapLibreModule)
  : null;

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
  onUserLocationUpdate,
}: EventMapSurfaceProps) {
  const { theme } = useAppTheme();
  const mapLibreCameraRef = useRef<any>(null);
  const initialCameraSettingsRef = useRef({
    centerCoordinate: [initialCenter.longitude, initialCenter.latitude] as [number, number],
    zoomLevel: initialZoomLevel ?? MAP_DEFAULT_ZOOM,
  });
  const annotationRefs = useRef<Record<string, { refresh?: () => void } | null>>({});
  const cameraCommandResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const disableUserFollowMode = useCallback(() => {
    mapLibreCameraRef.current?.setNativeProps?.({
      followUserLocation: false,
      followUserMode: null,
    });
  }, []);
  const queueCameraCommand = useCallback((centerCoordinate: [number, number], zoomLevel: number, animationDuration: number) => {
    disableUserFollowMode();

    setCameraCommand({
      key: `${centerCoordinate[0]}:${centerCoordinate[1]}:${zoomLevel}:${Date.now()}`,
      centerCoordinate,
      zoomLevel,
      animationDuration,
    });
  }, [disableUserFollowMode]);

  const validMarkers = useMemo(
    () => markers.filter((marker) => isValidCoordinate(marker.coordinate.latitude, marker.coordinate.longitude)),
    [markers],
  );
  const indexedMarkers = useMemo(
    () => validMarkers.map((marker, index) => ({ marker, markerKey: `${marker.id}:${index}` })),
    [validMarkers],
  );
  const userLocationAccuracyRadius = showsUserLocation ? getLocationAccuracyRadiusMeters(userLocation) : null;
  const userLocationAccuracyShape = useMemo(() => {
    if (!userLocationAccuracyRadius || !isValidCoordinate(userLocation.latitude, userLocation.longitude)) {
      return null;
    }

    return createAccuracyCircleFeature(userLocation, userLocationAccuracyRadius);
  }, [userLocation.latitude, userLocation.longitude, userLocationAccuracyRadius]);

  useEffect(() => {
    if (!focusCoordinate || !mapLibreModule) {
      return;
    }

    queueCameraCommand([focusCoordinate.longitude, focusCoordinate.latitude], focusZoomLevel ?? MAP_FOCUS_ZOOM, 560);
  }, [focusCoordinate, focusZoomLevel, queueCameraCommand]);

  useEffect(() => {
    if (!cameraCommand) {
      if (cameraCommandResetTimerRef.current) {
        clearTimeout(cameraCommandResetTimerRef.current);
        cameraCommandResetTimerRef.current = null;
      }
      return;
    }

    cameraCommandResetTimerRef.current = setTimeout(() => {
      disableUserFollowMode();
      setCameraCommand((current) => (current?.key === cameraCommand.key ? null : current));
      cameraCommandResetTimerRef.current = null;
    }, cameraCommand.animationDuration + 220);

    return () => {
      if (cameraCommandResetTimerRef.current) {
        clearTimeout(cameraCommandResetTimerRef.current);
        cameraCommandResetTimerRef.current = null;
      }
    };
  }, [cameraCommand, disableUserFollowMode]);

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

  useEffect(() => {
    disableUserFollowMode();

    const timers = [120, 450, 900, 1500].map((delayMs) =>
      setTimeout(() => {
        disableUserFollowMode();
      }, delayMs),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      if (cameraCommandResetTimerRef.current) {
        clearTimeout(cameraCommandResetTimerRef.current);
      }
    };
  }, [disableUserFollowMode]);

  if (!mapLibreModule) {
    return (
      <View style={[styles.container, styles.missingModuleWrap, { backgroundColor: theme.colors.background }]}>
        <AppText variant="caption" color="textMuted">
          MapLibre native module nije dostupan u ovom buildu.
        </AppText>
      </View>
    );
  }

  const { Camera, CircleLayer, FillLayer, LineLayer, MapView, PointAnnotation, ShapeSource, UserLocation } = mapLibreModule;

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
          disableUserFollowMode();

          const region = feature as RegionFeature;
          const [longitude, latitude] = region.geometry.coordinates;
          const zoomLevel = region.properties?.zoomLevel;

          if (typeof latitude === 'number' && typeof longitude === 'number') {
            onCameraStateChange?.({
              center: { latitude, longitude },
              zoomLevel,
              isUserInteraction: region.properties?.isUserInteraction,
            });
          }
        }}
      >
        <Camera
          ref={mapLibreCameraRef}
          defaultSettings={initialCameraSettingsRef.current}
          followUserLocation={false}
          onUserTrackingModeChange={(event: { nativeEvent?: { payload?: { followUserLocation?: boolean } } }) => {
            if (event.nativeEvent?.payload?.followUserLocation) {
              disableUserFollowMode();
            }
          }}
        />

        {cameraCommand ? (
          <Camera
            key={cameraCommand.key}
            centerCoordinate={cameraCommand.centerCoordinate}
            zoomLevel={cameraCommand.zoomLevel}
            animationDuration={cameraCommand.animationDuration}
            animationMode="easeTo"
            followUserLocation={false}
          />
        ) : null}

        {userLocationAccuracyShape ? (
          <ShapeSource id="user-location-accuracy-source" shape={userLocationAccuracyShape}>
            <FillLayer
              id="user-location-accuracy-fill"
              style={{
                fillColor: theme.colors.mapAccent,
                fillOpacity: 0.18,
              }}
            />
            <LineLayer
              id="user-location-accuracy-line"
              style={{
                lineColor: theme.colors.mapAccent,
                lineOpacity: 0.42,
                lineWidth: 1,
              }}
            />
          </ShapeSource>
        ) : null}

        {showsUserLocation ? (
          <UserLocation
            visible
            animated
            renderMode="normal"
            minDisplacement={4}
            onUpdate={(location) => {
              const latitude = location.coords?.latitude;
              const longitude = location.coords?.longitude;

              if (!isValidCoordinate(latitude, longitude)) {
                return;
              }

              onUserLocationUpdate?.({
                latitude,
                longitude,
                accuracyMeters: location.coords.accuracy,
              });
            }}
          >
            <CircleLayer
              id="user-location-puck-soft"
              sourceID="mlrn-user-location"
              style={{
                circleRadius: 16,
                circleColor: theme.colors.mapAccent,
                circleOpacity: 0.24,
                circlePitchAlignment: 'map',
              }}
            />
            <CircleLayer
              id="user-location-puck-outer"
              sourceID="mlrn-user-location"
              style={{
                circleRadius: 9,
                circleColor: theme.colors.background,
                circlePitchAlignment: 'map',
              }}
            />
            <CircleLayer
              id="user-location-puck-inner"
              sourceID="mlrn-user-location"
              style={{
                circleRadius: 6,
                circleColor: theme.colors.mapAccent,
                circlePitchAlignment: 'map',
              }}
            />
          </UserLocation>
        ) : null}

        {indexedMarkers.map(({ marker, markerKey }) => {
          return (
            <PointAnnotation
              key={`marker-${markerKey}`}
              id={`marker-${markerKey}`}
              coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
              anchor={{ x: 0.5, y: 1 }}
              ref={(ref) => {
                annotationRefs.current[markerKey] = ref;
              }}
              onSelected={() => onMarkerPress(marker.id)}
            >
              <MapMarkerBadge
                selected={marker.isSelected}
                coverImageSource={marker.coverImageSource}
                coverImageSources={marker.coverImageSources}
                count={marker.count}
                dateBadge={marker.dateBadge}
                isFriendsOnly={marker.isFriendsOnly}
                onImageLoad={() => {
                  annotationRefs.current[markerKey]?.refresh?.();
                  setTimeout(() => {
                    annotationRefs.current[markerKey]?.refresh?.();
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
