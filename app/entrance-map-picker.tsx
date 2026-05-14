import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventMap } from '@/components/map';
import { AppButton, AppHeader, AppIconButton, AppScreen } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
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
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();

  const setFypEntranceCoordinates = useAppStore((state) => state.setFypEntranceCoordinates);

  const centerLat = parseCoordinateParam(params.centerLat);
  const centerLng = parseCoordinateParam(params.centerLng);

  const initialCenter = useMemo<Coordinates>(() => {
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      return {
        latitude: centerLat,
        longitude: centerLng,
      };
    }

    return DEFAULT_CENTER;
  }, [centerLat, centerLng]);

  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates>(initialCenter);

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
            initialZoomLevel={18.2}
            onSelectEvent={() => undefined}
            onCameraStateChange={(camera) => {
              setSelectedCoordinate(camera.center);
            }}
          />
          <View pointerEvents="none" style={styles.centerPinWrap}>
            <View
              style={[
                styles.centerPin,
                {
                  backgroundColor: theme.colors.mapAccent,
                  borderColor: theme.colors.background,
                },
              ]}
            >
              <Ionicons name="location" size={24} color={theme.colors.background} />
            </View>
            <View style={[styles.centerPinShadow, { backgroundColor: theme.colors.overlay }]} />
          </View>
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
  centerPinWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -44 }],
  },
  centerPin: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  centerPinShadow: {
    borderRadius: 999,
    height: 12,
    marginTop: 4,
    opacity: 0.32,
    width: 28,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
