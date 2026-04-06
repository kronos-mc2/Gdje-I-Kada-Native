import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventMap } from '@/components/map';
import { AppButton, AppHeader, AppIconButton, AppScreen } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { Coordinates } from '@/core/types/domain';

const DEFAULT_CENTER: Coordinates = {
  latitude: 45.815,
  longitude: 15.9819,
};

const parseCoordinateParam = (value: string | string[] | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
};

export default function EntranceMapPickerScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const params = useLocalSearchParams();

  const setFypEntranceCoordinates = useAppStore((state) => state.setFypEntranceCoordinates);

  const centerLat = parseCoordinateParam(params.centerLat);
  const centerLng = parseCoordinateParam(params.centerLng);
  const pinLat = parseCoordinateParam(params.pinLat);
  const pinLng = parseCoordinateParam(params.pinLng);

  const initialCenter = useMemo<Coordinates>(() => {
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      return {
        latitude: centerLat,
        longitude: centerLng,
      };
    }

    return DEFAULT_CENTER;
  }, [centerLat, centerLng]);

  const initialPin = useMemo<Coordinates>(() => {
    if (typeof pinLat === 'number' && typeof pinLng === 'number') {
      return {
        latitude: pinLat,
        longitude: pinLng,
      };
    }

    return initialCenter;
  }, [initialCenter, pinLat, pinLng]);

  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates>(initialPin);

  const onConfirm = () => {
    setFypEntranceCoordinates(selectedCoordinate);
    router.back();
  };

  return (
    <AppScreen edges={['top', 'left', 'right', 'bottom']} contentHorizontalPadding={false}>
      <View style={styles.content}>
        <View style={styles.headerWrap}>
          <AppHeader
            title={t('dragDropEntrance')}
            subtitle={t('dragDropHelp')}
            left={<AppIconButton icon="chevron-back" onPress={() => router.back()} />}
            floating={false}
          />
        </View>

        <View style={styles.mapWrap}>
          <EventMap
            events={[]}
            locale={locale}
            userLocation={initialCenter}
            selectedEventId={null}
            searchMarker={selectedCoordinate}
            onSelectEvent={() => undefined}
            onCameraStateChange={(camera) => {
              setSelectedCoordinate(camera.center);
            }}
          />
        </View>

        <View style={styles.footerWrap}>
          <AppButton title={t('confirmPin')} variant="glass" onPress={onConfirm} />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
