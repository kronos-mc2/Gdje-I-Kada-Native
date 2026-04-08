import { useCallback, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';

import { useI18n } from '@/core/i18n/use-i18n';
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

const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value));

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

async function resolvePreciseDeviceLocation(): Promise<Coordinates | null> {
  try {
    const Location = (await import('expo-location')) as {
      requestForegroundPermissionsAsync: () => Promise<{ status: string }>;
      getCurrentPositionAsync: (options?: { accuracy?: number }) => Promise<{ coords: { latitude: number; longitude: number } }>;
      Accuracy: { High: number; Balanced: number };
    };

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    // Fallback for Android when ExpoLocation native module is missing:
    // use MapLibre's built-in location manager + Android permission request.
    if (Platform.OS !== 'android') {
      return null;
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
        return null;
      }

      const lastKnown = await maplibre.LocationManager.getLastKnownLocation();
      if (lastKnown?.coords) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }

      return await new Promise<Coordinates | null>((resolve) => {
        const timeout = setTimeout(() => {
          maplibre.LocationManager.removeListener(onUpdate);
          maplibre.LocationManager.stop();
          resolve(null);
        }, 7000);

        const onUpdate = (location: { coords: { latitude: number; longitude: number } }) => {
          clearTimeout(timeout);
          maplibre.LocationManager.removeListener(onUpdate);
          maplibre.LocationManager.stop();
          resolve({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        };

        maplibre.LocationManager.addListener(onUpdate);
        maplibre.LocationManager.start(0);
      });
    } catch {
      return null;
    }
  }
}

export function useMapLocationBootstrap() {
  const { t } = useI18n();
  const consent = useAppStore((state) => state.locationConsent);
  const locationSource = useAppStore((state) => state.locationSource);
  const setLocationConsent = useAppStore((state) => state.setLocationConsent);
  const setLocationSource = useAppStore((state) => state.setLocationSource);
  const setUserLocation = useAppStore((state) => state.setUserLocation);

  const hasPromptedRef = useRef(false);
  const isResolvingRef = useRef(false);

  const requestPreciseLocationNow = useCallback(async () => {
    const preciseCoordinates = await resolvePreciseDeviceLocation();

    if (preciseCoordinates) {
      setUserLocation(preciseCoordinates);
      setLocationSource('device');
      setLocationConsent('accepted');
      return true;
    }

    return false;
  }, [setLocationConsent, setLocationSource, setUserLocation]);

  useEffect(() => {
    if (consent !== 'unknown' || hasPromptedRef.current) {
      return;
    }

    hasPromptedRef.current = true;

    Alert.alert(
      t('locationConsentTitle'),
      t('locationConsentBody'),
      [
        {
          text: t('notNow'),
          style: 'cancel',
          onPress: () => setLocationConsent('rejected'),
        },
        {
          text: t('allow'),
          onPress: () => setLocationConsent('accepted'),
        },
      ],
      { cancelable: false },
    );
  }, [consent, setLocationConsent, t]);

  useEffect(() => {
    if (consent === 'unknown' || locationSource !== 'default' || isResolvingRef.current) {
      return;
    }

    let cancelled = false;
    isResolvingRef.current = true;

    const resolve = async () => {
      if (consent === 'accepted') {
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

  return {
    requestPreciseLocationNow,
  };
}
