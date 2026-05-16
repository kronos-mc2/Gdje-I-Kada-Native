import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAppStore } from '@/core/store/app-store';
import { Coordinates } from '@/core/types/domain';

const CAPITAL_BY_COUNTRY: Record<string, Coordinates> = {
  HR: { latitude: 45.815, longitude: 15.9819 }, // Zagreb
  BA: { latitude: 43.8563, longitude: 18.4131 }, // Sarajevo
  RS: { latitude: 44.7866, longitude: 20.4489 }, // Belgrade
  SI: { latitude: 46.0569, longitude: 14.5058 }, // Ljubljana
  ME: { latitude: 42.4304, longitude: 19.2594 }, // Podgorica
  MK: { latitude: 41.9981, longitude: 21.4254 }, // Skopje
  AL: { latitude: 41.3275, longitude: 19.8187 }, // Tirana
  AT: { latitude: 48.2082, longitude: 16.3738 }, // Vienna
  DE: { latitude: 52.52, longitude: 13.405 }, // Berlin
  IT: { latitude: 41.9028, longitude: 12.4964 }, // Rome
  FR: { latitude: 48.8566, longitude: 2.3522 }, // Paris
  ES: { latitude: 40.4168, longitude: -3.7038 }, // Madrid
  GB: { latitude: 51.5072, longitude: -0.1276 }, // London
  IE: { latitude: 53.3498, longitude: -6.2603 }, // Dublin
  NL: { latitude: 52.3676, longitude: 4.9041 }, // Amsterdam
  BE: { latitude: 50.8503, longitude: 4.3517 }, // Brussels
  CH: { latitude: 46.948, longitude: 7.4474 }, // Bern
  US: { latitude: 38.9072, longitude: -77.0369 }, // Washington, DC
  CA: { latitude: 45.4215, longitude: -75.6972 }, // Ottawa
  AU: { latitude: -35.2809, longitude: 149.13 }, // Canberra
};

type IpLocationResult = {
  coordinates: Coordinates;
  source: 'capital' | 'ip';
} | null;

type NativePermission = {
  status: string;
  canAskAgain?: boolean;
};

type NativeLocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
};

type ExpoLocationModule = {
  getForegroundPermissionsAsync: () => Promise<NativePermission>;
  requestForegroundPermissionsAsync: () => Promise<NativePermission>;
  getLastKnownPositionAsync: (options?: { maxAge?: number; requiredAccuracy?: number }) => Promise<NativeLocationPosition | null>;
  getCurrentPositionAsync: (options?: { accuracy?: number }) => Promise<NativeLocationPosition>;
  Accuracy: { Balanced: number; High: number };
};

type DeviceLocationResolution = {
  hasPermission: boolean;
  hasLocation: boolean;
};

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const LAST_KNOWN_REQUIRED_ACCURACY_METERS = 1500;
const CURRENT_LOCATION_TIMEOUT_MS = 6500;

const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value));

const toDeviceCoordinates = (position: NativeLocationPosition): Coordinates | null => {
  const latitude = toNumber(position.coords.latitude);
  const longitude = toNumber(position.coords.longitude);
  const accuracyMeters = toNumber(position.coords.accuracy);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : undefined,
  };
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
  });

async function resolveLocationFromIp(): Promise<IpLocationResult> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      country_code?: string;
      latitude?: number | string;
      longitude?: number | string;
    };

    const countryCode = typeof payload.country_code === 'string' ? payload.country_code.toUpperCase() : '';
    const capitalCoordinates = countryCode ? CAPITAL_BY_COUNTRY[countryCode] : undefined;
    if (capitalCoordinates) {
      return {
        coordinates: capitalCoordinates,
        source: 'capital',
      };
    }

    const latitude = toNumber(payload.latitude);
    const longitude = toNumber(payload.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        coordinates: { latitude, longitude },
        source: 'ip',
      };
    }
  } catch {
    // ignore network issues and keep existing default location
  }

  return null;
}

async function resolvePreciseDeviceLocation(onLocation: (coordinates: Coordinates) => void): Promise<DeviceLocationResolution> {
  try {
    const Location = (await import('expo-location')) as ExpoLocationModule;

    const existingPermission = await Location.getForegroundPermissionsAsync();
    const permission =
      existingPermission.status === 'granted' || existingPermission.canAskAgain === false
        ? existingPermission
        : await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return {
        hasPermission: false,
        hasLocation: false,
      };
    }

    const lastKnownPosition = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_METERS,
    }).catch(() => null);

    const lastKnownCoordinates = lastKnownPosition ? toDeviceCoordinates(lastKnownPosition) : null;
    if (lastKnownCoordinates) {
      onLocation(lastKnownCoordinates);
      void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((position) => {
          const coordinates = toDeviceCoordinates(position);
          if (coordinates) {
            onLocation(coordinates);
          }
        })
        .catch(() => undefined);

      return {
        hasPermission: true,
        hasLocation: true,
      };
    }

    const currentPosition = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      CURRENT_LOCATION_TIMEOUT_MS,
    );
    const currentCoordinates = currentPosition ? toDeviceCoordinates(currentPosition) : null;

    if (currentCoordinates) {
      onLocation(currentCoordinates);
      return {
        hasPermission: true,
        hasLocation: true,
      };
    }

    return {
      hasPermission: true,
      hasLocation: false,
    };
  } catch {
    // Fallback for Android when ExpoLocation native module is missing:
    // use MapLibre's built-in location manager + Android permission request.
    if (Platform.OS !== 'android') {
      return {
        hasPermission: false,
        hasLocation: false,
      };
    }

    try {
      const maplibre = (await import('@maplibre/maplibre-react-native')) as {
        requestAndroidLocationPermissions: () => Promise<boolean>;
        LocationManager: {
          start: (displacement?: number) => void;
          stop: () => void;
          addListener: (listener: (location: { coords: { latitude: number; longitude: number } }) => void) => void;
          removeListener: (listener: (location: { coords: { latitude: number; longitude: number } }) => void) => void;
          getLastKnownLocation: () => Promise<{ coords: { latitude: number; longitude: number } } | null>;
        };
      };

      const granted = await maplibre.requestAndroidLocationPermissions();
      if (!granted) {
        return {
          hasPermission: false,
          hasLocation: false,
        };
      }

      const lastKnown = await maplibre.LocationManager.getLastKnownLocation().catch(() => null);
      if (lastKnown?.coords) {
        const coordinates = toDeviceCoordinates(lastKnown);
        if (coordinates) {
          onLocation(coordinates);
          return {
            hasPermission: true,
            hasLocation: true,
          };
        }
      }

      const nextLocation = await withTimeout(
        new Promise<NativeLocationPosition | null>((resolve) => {
          const timeout = setTimeout(() => {
            maplibre.LocationManager.removeListener(onUpdate);
            maplibre.LocationManager.stop();
            resolve(null);
          }, CURRENT_LOCATION_TIMEOUT_MS);

          const onUpdate = (location: NativeLocationPosition) => {
            clearTimeout(timeout);
            maplibre.LocationManager.removeListener(onUpdate);
            maplibre.LocationManager.stop();
            resolve(location);
          };

          maplibre.LocationManager.addListener(onUpdate);
          maplibre.LocationManager.start(0);
        }),
        CURRENT_LOCATION_TIMEOUT_MS + 500,
      );
      const coordinates = nextLocation ? toDeviceCoordinates(nextLocation) : null;

      if (coordinates) {
        onLocation(coordinates);
        return {
          hasPermission: true,
          hasLocation: true,
        };
      }

      return {
        hasPermission: true,
        hasLocation: false,
      };
    } catch {
      return {
        hasPermission: false,
        hasLocation: false,
      };
    }
  }
}

export function useMapLocationBootstrap() {
  const consent = useAppStore((state) => state.locationConsent);
  const locationSource = useAppStore((state) => state.locationSource);
  const setLocationConsent = useAppStore((state) => state.setLocationConsent);
  const setLocationSource = useAppStore((state) => state.setLocationSource);
  const setUserLocation = useAppStore((state) => state.setUserLocation);

  const isResolvingRef = useRef(false);
  const hasAttemptedAutoPreciseRef = useRef(false);
  const preciseRequestRef = useRef<Promise<boolean> | null>(null);

  const requestPreciseLocationNow = useCallback(async () => {
    if (preciseRequestRef.current) {
      return preciseRequestRef.current;
    }

    preciseRequestRef.current = resolvePreciseDeviceLocation((coordinates) => {
      setUserLocation(coordinates);
      setLocationSource('device');
    })
      .then((resolution) => {
        setLocationConsent(resolution.hasPermission ? 'accepted' : 'rejected');
        return resolution.hasLocation;
      })
      .finally(() => {
        preciseRequestRef.current = null;
      });

    return preciseRequestRef.current;
  }, [setLocationConsent, setLocationSource, setUserLocation]);

  useEffect(() => {
    if (locationSource !== 'default' || isResolvingRef.current) {
      return;
    }

    let cancelled = false;
    isResolvingRef.current = true;

    const resolve = async () => {
      if (consent !== 'rejected') {
        const hasPreciseLocation = await requestPreciseLocationNow();

        if (hasPreciseLocation && !cancelled) {
          isResolvingRef.current = false;
          return;
        }
      }

      const fallbackCoordinates = await resolveLocationFromIp();

      if (!cancelled && fallbackCoordinates) {
        setUserLocation(fallbackCoordinates.coordinates);
        setLocationSource(fallbackCoordinates.source);
      } else if (!cancelled) {
        // Keep current default coordinates and mark bootstrap as resolved.
        setLocationSource('capital');
      }

      isResolvingRef.current = false;
    };

    void resolve();

    return () => {
      cancelled = true;
      isResolvingRef.current = false;
    };
  }, [consent, locationSource, requestPreciseLocationNow, setLocationSource, setUserLocation]);

  useEffect(() => {
    if (consent !== 'accepted') {
      hasAttemptedAutoPreciseRef.current = false;
      return;
    }

    if (locationSource === 'default' || isResolvingRef.current || hasAttemptedAutoPreciseRef.current) {
      return;
    }

    let cancelled = false;
    isResolvingRef.current = true;
    hasAttemptedAutoPreciseRef.current = true;

    const resolve = async () => {
      await requestPreciseLocationNow();

      if (!cancelled) {
        isResolvingRef.current = false;
      }
    };

    void resolve();

    return () => {
      cancelled = true;
      isResolvingRef.current = false;
    };
  }, [consent, locationSource, requestPreciseLocationNow]);

  return {
    requestPreciseLocationNow,
  };
}
