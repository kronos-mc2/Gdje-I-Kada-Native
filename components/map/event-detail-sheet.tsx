import BottomSheet, { BottomSheetBackgroundProps, BottomSheetHandleProps, BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { getEventCoverUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type EventDetailSheetProps = {
  event: AppEvent;
  locale: Locale;
  onClose: () => void;
  topInset?: number;
  bottomInset?: number;
};

export function EventDetailSheet({ event, locale, onClose, topInset = 0, bottomInset = 0 }: EventDetailSheetProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const coverUri = useMemo(() => getEventCoverUri(event.id), [event.id]);
  const snapPoints = useMemo(() => ['34%', '72%'], []);

  useEffect(() => {
    setSheetIndex(0);
    sheetRef.current?.snapToIndex(0);
  }, [event.id]);

  const onShare = async () => {
    const message = `${event.title[locale]}\n${event.where[locale]}\n${formatEventDate(event.whenISO, locale)}\n\n${event.about[locale]}`;

    try {
      await Share.share({
        title: event.title[locale],
        message,
      });
    } catch {
      // ignore share cancel/errors from native UI
    }
  };

  const toggleExpanded = useCallback(() => {
    if (sheetIndex <= 0) {
      sheetRef.current?.snapToIndex(1);
      return;
    }

    sheetRef.current?.snapToIndex(0);
  }, [sheetIndex]);

  const renderHandle = useCallback(
    (_: BottomSheetHandleProps) => (
      <View style={styles.handleContainer}>
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [styles.handlePress, { opacity: pressed ? 0.74 : 1 }]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
        </Pressable>
      </View>
    ),
    [theme.colors.border, toggleExpanded],
  );

  const renderBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => (
      <View
        style={[
          style,
          styles.background,
          {
            borderColor: theme.colors.border,
          },
        ]}
      >
        {canUseLiquidGlass ? (
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            colorScheme={theme.isDark ? 'dark' : 'light'}
            tintColor={theme.isDark ? 'rgba(14, 18, 26, 0.20)' : 'rgba(255, 255, 255, 0.24)'}
            isInteractive
          />
        ) : (
          <>
            <BlurView
              style={StyleSheet.absoluteFill}
              tint={theme.isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
              intensity={Platform.OS === 'android' ? 78 : 62}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    Platform.OS === 'android'
                      ? theme.isDark
                        ? 'rgba(12, 16, 24, 0.48)'
                        : 'rgba(252, 253, 255, 0.52)'
                      : theme.isDark
                        ? 'rgba(18, 23, 31, 0.34)'
                        : 'rgba(255, 255, 255, 0.30)',
                },
              ]}
            />
          </>
        )}
      </View>
    ),
    [canUseLiquidGlass, theme.colors.border, theme.isDark],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      detached
      topInset={topInset}
      bottomInset={bottomInset}
      enablePanDownToClose
      onClose={onClose}
      onChange={(index) => setSheetIndex(index)}
      handleComponent={renderHandle}
      backgroundComponent={renderBackground}
      style={styles.sheetContainer}
      handleIndicatorStyle={styles.hidden}
    >
      <BottomSheetView style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.isDark ? 'rgba(17, 22, 30, 0.48)' : 'rgba(255, 255, 255, 0.62)',
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="share-social-outline" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          <AppText variant="headline" numberOfLines={1} style={styles.headerTitle}>
            {event.title[locale]}
          </AppText>

          <Pressable
            onPress={() => sheetRef.current?.close()}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.isDark ? 'rgba(17, 22, 30, 0.48)' : 'rgba(255, 255, 255, 0.62)',
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.coverRow}>
          <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
          <View style={styles.coverMeta}>
            <AppText variant="bodyStrong">{event.where[locale]}</AppText>
            <AppText variant="caption" color="textMuted">
              {formatEventDate(event.whenISO, locale)}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {event.participantCount} {t('participants')}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {t(event.type)}
            </AppText>
          </View>
        </View>

        <AppText variant="body" color="textSecondary" style={styles.aboutText}>
          {event.about[locale]}
        </AppText>

        {sheetIndex >= 1 ? (
          <View style={styles.expandedBlock}>
            <AppText variant="label" color="textMuted">
              {t('details')}
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.expandedText}>
              {event.about[locale]}
            </AppText>
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  sheetContainer: {
    marginHorizontal: 12,
  },
  background: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  handleContainer: {
    alignItems: 'center',
  },
  handlePress: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
  },
  contentWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cover: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverMeta: {
    flex: 1,
    gap: 2,
  },
  aboutText: {
    marginTop: 12,
  },
  expandedBlock: {
    marginTop: 10,
    paddingTop: 10,
  },
  expandedText: {
    marginTop: 6,
  },
});
