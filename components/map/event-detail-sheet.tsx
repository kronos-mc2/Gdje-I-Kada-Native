import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ComponentType, ReactNode, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EventDetailsContent } from '@/features/events/components/event-details-content';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { useEventJoinActions } from '@/features/events/hooks/use-event-join-actions';
import { AppText } from '@/components/primitives';
import { useEventQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';

type EventDetailSheetProps = Readonly<{
  event: AppEvent;
  locale: Locale;
  onClose: () => void;
  topInset?: number;
  bottomInset?: number;
}>;

type SheetController = {
  snapToIndex: (index: number) => void;
  close: () => void;
};

type OptionalBottomSheetModule = {
  BottomSheet: ComponentType<Record<string, unknown> & { ref?: Ref<SheetController> }>;
  BottomSheetView: ComponentType<{ style?: object; children?: ReactNode }>;
};

let cachedBottomSheetModule: OptionalBottomSheetModule | null | undefined;
let didWarnMissingBottomSheet = false;

const getBottomSheetModule = (): OptionalBottomSheetModule | null => {
  if (cachedBottomSheetModule !== undefined) {
    return cachedBottomSheetModule;
  }

  try {
    const bottomSheetModule = require('@gorhom/bottom-sheet');
    cachedBottomSheetModule = {
      BottomSheet: bottomSheetModule.default,
      BottomSheetView: bottomSheetModule.BottomSheetView,
    };
  } catch (error) {
    if (!didWarnMissingBottomSheet) {
      didWarnMissingBottomSheet = true;
      const errorMessage = error instanceof Error && error.message ? error.message : 'Unknown bottom sheet error';
      console.warn(`BottomSheet native module is unavailable, using modal fallback. ${errorMessage}`);
    }

    cachedBottomSheetModule = null;
  }

  return cachedBottomSheetModule;
};

export function EventDetailSheet({ event, locale, onClose, topInset = 0, bottomInset = 0 }: EventDetailSheetProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const bottomSheetModule = useMemo(() => getBottomSheetModule(), []);
  const sheetRef = useRef<SheetController | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const snapPoints = useMemo(() => ['22%', '76%'], []);
  const { data: resolvedEvent } = useEventQuery(event.id, event);
  const detailEvent = resolvedEvent ?? event;
  const { isJoined, isJoinDisabled, joinButtonTitle, onToggleJoin } = useEventJoinActions(detailEvent);

  useEffect(() => {
    setSheetIndex(0);
    setIsShareOpen(false);
    sheetRef.current?.snapToIndex(0);
  }, [event.id]);

  const toggleExpanded = useCallback(() => {
    if (sheetIndex <= 0) {
      sheetRef.current?.snapToIndex(1);
      return;
    }

    sheetRef.current?.snapToIndex(0);
  }, [sheetIndex]);

  const renderHandle = useCallback(
    () => (
      <View style={styles.handleContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('details')}
          onPress={toggleExpanded}
          style={({ pressed }) => [styles.handlePress, { opacity: pressed ? 0.74 : 1 }]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
        </Pressable>
      </View>
    ),
    [t, theme.colors.border, toggleExpanded],
  );

  const renderBackground = useCallback(
    ({ style }: { style?: object }) => (
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

  if (!bottomSheetModule) {
    return (
      <>
        <Modal animationType="slide" transparent visible onRequestClose={onClose}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View
              style={[
                styles.modalSheet,
                styles.background,
                {
                  marginTop: topInset + 12,
                  paddingBottom: bottomInset + 12,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.isDark ? 'rgba(12, 16, 24, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                },
              ]}
            >
              {renderHandle()}
              <ScrollView contentContainerStyle={styles.contentWrap} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('shareEvent')}
                    onPress={() => setIsShareOpen(true)}
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
                    {detailEvent.title[locale]}
                  </AppText>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('cancel')}
                    onPress={onClose}
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

                <View style={styles.contentTopSpacing}>
                  <EventDetailsContent
                    event={detailEvent}
                    locale={locale}
                    isJoined={isJoined}
                    isJoinDisabled={isJoinDisabled}
                    joinButtonTitle={joinButtonTitle}
                    onToggleJoin={onToggleJoin}
                    expanded
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
        <EventShareModal event={detailEvent} visible={isShareOpen} locale={locale} onClose={() => setIsShareOpen(false)} />
      </>
    );
  }

  const { BottomSheet, BottomSheetView } = bottomSheetModule;

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
      onChange={(index: number) => setSheetIndex(index)}
      handleComponent={renderHandle}
      backgroundComponent={renderBackground}
      style={styles.sheetContainer}
      handleIndicatorStyle={styles.hidden}
    >
      <BottomSheetView style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shareEvent')}
            onPress={() => setIsShareOpen(true)}
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
            {detailEvent.title[locale]}
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('cancel')}
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

        <View style={styles.contentTopSpacing}>
          <EventDetailsContent
            event={detailEvent}
            locale={locale}
            isJoined={isJoined}
            isJoinDisabled={isJoinDisabled}
            joinButtonTitle={joinButtonTitle}
            onToggleJoin={onToggleJoin}
            expanded={sheetIndex >= 1}
          />
        </View>
      </BottomSheetView>
      <EventShareModal event={detailEvent} visible={isShareOpen} locale={locale} onClose={() => setIsShareOpen(false)} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalSheet: {
    marginHorizontal: 12,
    maxHeight: '86%',
  },
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
  contentTopSpacing: {
    marginTop: 12,
  },
});
