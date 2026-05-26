import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ComponentType, ReactNode, Ref } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppText } from '@/components/primitives';
import { useEventQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { EventDetailsContent } from '@/features/events/components/event-details-content';
import { useEventJoinActions } from '@/features/events/hooks/use-event-join-actions';

type FypEventDetailsSheetProps = Readonly<{
  event: AppEvent;
  locale: Locale;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onOpenShare: (event: AppEvent) => void;
}>;

type SheetController = {
  close: () => void;
};

type OptionalBottomSheetModule = {
  BottomSheet: ComponentType<Record<string, unknown> & { ref?: Ref<SheetController> }>;
  BottomSheetScrollView: ComponentType<{
    contentContainerStyle?: StyleProp<ViewStyle>;
    showsVerticalScrollIndicator?: boolean;
    children?: ReactNode;
  }>;
};

let cachedBottomSheetModule: OptionalBottomSheetModule | null | undefined;
let didWarnMissingBottomSheet = false;
const OPEN_SHEET_BOTTOM_SPACER = 104;

const getBottomSheetModule = (): OptionalBottomSheetModule | null => {
  if (cachedBottomSheetModule !== undefined) {
    return cachedBottomSheetModule;
  }

  try {
    const bottomSheetModule = require('@gorhom/bottom-sheet');
    cachedBottomSheetModule = {
      BottomSheet: bottomSheetModule.default,
      BottomSheetScrollView: bottomSheetModule.BottomSheetScrollView,
    };
  } catch (error) {
    if (!didWarnMissingBottomSheet) {
      didWarnMissingBottomSheet = true;
      const message = error instanceof Error && error.message ? error.message : 'Unknown bottom sheet error';
      console.warn(`BottomSheet native module is unavailable, using FYP details modal fallback. ${message}`);
    }

    cachedBottomSheetModule = null;
  }

  return cachedBottomSheetModule;
};

export function FypEventDetailsSheet({ event, locale, topInset, bottomInset, onClose, onOpenShare }: FypEventDetailsSheetProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const bottomSheetModule = useMemo(() => getBottomSheetModule(), []);
  const sheetRef = useRef<SheetController | null>(null);
  const snapPoints = useMemo(() => ['94%'], []);
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const { data: resolvedEvent } = useEventQuery(event.id, event);
  const detailEvent = resolvedEvent ?? event;
  const { isJoined, isJoinDisabled, joinButtonTitle, onToggleJoin } = useEventJoinActions(detailEvent);
  const closeSheet = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.close();
      return;
    }

    onClose();
  }, [onClose]);

  const renderBackground = useCallback(
    ({ style }: { style?: object }) => (
      <View style={[style, styles.sheetBackground, { borderColor: theme.colors.border }]}>
        {Platform.OS === 'android' ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.isDark ? 'rgba(17, 17, 20, 0.97)' : 'rgba(240, 240, 240, 0.97)' },
            ]}
          />
        ) : canUseLiquidGlass ? (
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            colorScheme={theme.isDark ? 'dark' : 'light'}
            tintColor={theme.isDark ? 'rgba(14, 18, 26, 0.62)' : 'rgba(255, 255, 255, 0.72)'}
            isInteractive
          />
        ) : (
          <>
            <BlurView
              style={StyleSheet.absoluteFill}
              tint={theme.isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
              intensity={66}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.isDark ? 'rgba(17, 17, 20, 0.70)' : 'rgba(240, 240, 240, 0.66)' },
              ]}
            />
          </>
        )}
      </View>
    ),
    [canUseLiquidGlass, theme.colors.border, theme.isDark],
  );

  const header = (
    <View style={styles.headerRow}>
      <AppText variant="bodyStrong" color="textSecondary">
        {t('detailsShort')}
      </AppText>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('shareEvent')}
          onPress={() => onOpenShare(detailEvent)}
          style={({ pressed }) => [styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay, opacity: pressed ? 0.78 : 1 }]}
        >
          <Ionicons name="paper-plane-outline" size={18} color={theme.colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          onPress={closeSheet}
          style={({ pressed }) => [styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay, opacity: pressed ? 0.78 : 1 }]}
        >
          <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );

  const content = (
    <>
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
      </View>
      {header}
      <View style={styles.detailsWrap}>
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
    </>
  );
  const BottomSheet = bottomSheetModule?.BottomSheet;
  const BottomSheetScrollView = bottomSheetModule?.BottomSheetScrollView;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.modalRoot}>
        {BottomSheet && BottomSheetScrollView ? (
          <BottomSheet
            ref={sheetRef}
            index={0}
            snapPoints={snapPoints}
            topInset={topInset + 8}
            bottomInset={bottomInset}
            enablePanDownToClose
            onClose={onClose}
            handleComponent={null}
            backgroundComponent={renderBackground}
          >
            <BottomSheetScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + OPEN_SHEET_BOTTOM_SPACER }]}
              showsVerticalScrollIndicator={false}
            >
              {content}
            </BottomSheetScrollView>
          </BottomSheet>
        ) : (
          <View
            style={[
              styles.modalSheet,
              {
                marginTop: topInset + 8,
                paddingBottom: bottomInset,
                borderColor: theme.colors.border,
                backgroundColor: theme.isDark ? 'rgba(17, 17, 20, 0.97)' : 'rgba(240, 240, 240, 0.97)',
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + OPEN_SHEET_BOTTOM_SPACER }]}
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsWrap: {
    marginTop: 16,
  },
});
