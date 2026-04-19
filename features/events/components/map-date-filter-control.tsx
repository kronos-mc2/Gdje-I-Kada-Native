import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { Locale } from '@/core/types/domain';
import { dateKeyToLocalDate, MapDateFilter, toDateKey } from '@/features/events/hooks/use-events-map-screen-model';

type MapDateFilterControlProps = {
  dateFilter: MapDateFilter;
  locale: Locale;
  canUseLiquidGlass: boolean;
  onDateFilterChange: (dateFilter: MapDateFilter) => void;
};

type DraftMode = 'all' | 'day' | 'range';

export function MapDateFilterControl({ dateFilter, locale, canUseLiquidGlass, onDateFilterChange }: MapDateFilterControlProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const defaultCalendarStyles = useDefaultStyles(theme.isDark ? 'dark' : 'light');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [draftMode, setDraftMode] = useState<DraftMode>('day');
  const [draftFromISO, setDraftFromISO] = useState(() => toDateKey(new Date()));
  const [draftToISO, setDraftToISO] = useState(() => toDateKey(new Date()));

  const label = useMemo(() => getFilterLabel(dateFilter, locale, t), [dateFilter, locale, t]);
  const isAllDates = dateFilter.mode === 'all';
  const calendarStyles = useMemo(
    () => ({
      ...defaultCalendarStyles,
      header: {
        ...defaultCalendarStyles.header,
        marginBottom: 8,
      },
      month_selector_label: {
        ...defaultCalendarStyles.month_selector_label,
        color: theme.colors.textPrimary,
        fontWeight: '700' as const,
      },
      year_selector_label: {
        ...defaultCalendarStyles.year_selector_label,
        color: theme.colors.textPrimary,
        fontWeight: '700' as const,
      },
      weekday_label: {
        ...defaultCalendarStyles.weekday_label,
        color: theme.colors.textMuted,
        fontWeight: '700' as const,
      },
      day: {
        ...defaultCalendarStyles.day,
        borderRadius: 8,
      },
      day_label: {
        ...defaultCalendarStyles.day_label,
        color: theme.colors.textPrimary,
      },
      outside_label: {
        ...defaultCalendarStyles.outside_label,
        color: theme.colors.textMuted,
        opacity: 0.46,
      },
      today: {
        ...defaultCalendarStyles.today,
        borderColor: theme.colors.mapAccent,
        borderWidth: 1,
      },
      today_label: {
        ...defaultCalendarStyles.today_label,
        color: theme.colors.mapAccent,
      },
      selected: {
        ...defaultCalendarStyles.selected,
        backgroundColor: theme.colors.mapAccent,
        borderRadius: 8,
      },
      selected_label: {
        ...defaultCalendarStyles.selected_label,
        color: '#FFFFFF',
        fontWeight: '700' as const,
      },
      range_fill: {
        ...defaultCalendarStyles.range_fill,
        backgroundColor: theme.colors.mapAccentSoft,
      },
      range_start: {
        ...defaultCalendarStyles.range_start,
        backgroundColor: theme.colors.mapAccent,
        borderRadius: 8,
      },
      range_start_label: {
        ...defaultCalendarStyles.range_start_label,
        color: '#FFFFFF',
        fontWeight: '700' as const,
      },
      range_end: {
        ...defaultCalendarStyles.range_end,
        backgroundColor: theme.colors.mapAccent,
        borderRadius: 8,
      },
      range_end_label: {
        ...defaultCalendarStyles.range_end_label,
        color: '#FFFFFF',
        fontWeight: '700' as const,
      },
      range_middle_label: {
        ...defaultCalendarStyles.range_middle_label,
        color: theme.colors.textPrimary,
        fontWeight: '600' as const,
      },
      button_prev_image: {
        ...defaultCalendarStyles.button_prev_image,
        tintColor: theme.colors.mapAccent,
      },
      button_next_image: {
        ...defaultCalendarStyles.button_next_image,
        tintColor: theme.colors.mapAccent,
      },
    }),
    [defaultCalendarStyles, theme.colors.mapAccent, theme.colors.mapAccentSoft, theme.colors.textMuted, theme.colors.textPrimary],
  );

  const openPicker = () => {
    if (dateFilter.mode === 'all') {
      const todayISO = toDateKey(new Date());
      setDraftMode('all');
      setDraftFromISO(todayISO);
      setDraftToISO(todayISO);
    } else if (dateFilter.mode === 'range') {
      setDraftMode('range');
      setDraftFromISO(dateFilter.fromISO);
      setDraftToISO(dateFilter.toISO);
    } else {
      const selectedDay = dateFilter.mode === 'day' ? dateFilter.dateISO : toDateKey(new Date());
      setDraftMode('day');
      setDraftFromISO(selectedDay);
      setDraftToISO(selectedDay);
    }

    setIsPickerVisible(true);
  };

  const applyDraft = () => {
    if (draftMode === 'all') {
      onDateFilterChange({ mode: 'all' });
      setIsPickerVisible(false);
      return;
    }

    if (draftMode === 'day') {
      onDateFilterChange({ mode: 'day', dateISO: draftFromISO });
      setIsPickerVisible(false);
      return;
    }

    const fromDate = dateKeyToLocalDate(draftFromISO);
    const toDate = dateKeyToLocalDate(draftToISO);
    const [fromISO, toISO] = fromDate.getTime() <= toDate.getTime() ? [draftFromISO, draftToISO] : [draftToISO, draftFromISO];

    onDateFilterChange({ mode: 'range', fromISO, toISO });
    setIsPickerVisible(false);
  };

  const shiftActiveFilter = (days: number) => {
    if (dateFilter.mode === 'all') {
      onDateFilterChange({ mode: 'day', dateISO: toDateKey(addDays(new Date(), days)) });
      return;
    }

    if (dateFilter.mode === 'day') {
      onDateFilterChange({ mode: 'day', dateISO: toDateKey(addDays(dateKeyToLocalDate(dateFilter.dateISO), days)) });
      return;
    }

    onDateFilterChange({
      mode: 'range',
      fromISO: toDateKey(addDays(dateKeyToLocalDate(dateFilter.fromISO), days)),
      toISO: toDateKey(addDays(dateKeyToLocalDate(dateFilter.toISO), days)),
    });
  };

  const setDraftDay = (nextDate: DateType) => {
    const parsedDate = dateTypeToDate(nextDate);
    if (!parsedDate) {
      return;
    }

    const nextISO = toDateKey(parsedDate);
    setDraftFromISO(nextISO);
    setDraftToISO(nextISO);
  };

  const setDraftRange = (nextStartDate: DateType, nextEndDate: DateType) => {
    const parsedStartDate = dateTypeToDate(nextStartDate);
    const parsedEndDate = dateTypeToDate(nextEndDate);

    if (!parsedStartDate) {
      return;
    }

    const nextFromISO = toDateKey(parsedStartDate);
    const nextToISO = toDateKey(parsedEndDate ?? parsedStartDate);
    setDraftFromISO(nextFromISO);
    setDraftToISO(nextToISO);
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.control,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.isDark ? 'rgba(14, 18, 26, 0.54)' : 'rgba(255, 255, 255, 0.62)',
          },
        ]}
      >
        {canUseLiquidGlass ? (
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            colorScheme={theme.isDark ? 'dark' : 'light'}
            tintColor={theme.isDark ? 'rgba(14, 18, 26, 0.12)' : 'rgba(255, 255, 255, 0.16)'}
            isInteractive
          />
        ) : (
          <>
            <BlurView
              style={StyleSheet.absoluteFill}
              tint={theme.isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
              intensity={Platform.OS === 'android' ? 64 : 52}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.isDark ? 'rgba(12, 16, 24, 0.18)' : 'rgba(255, 255, 255, 0.18)' },
              ]}
            />
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('previousDate')}
          onPress={() => shiftActiveFilter(-1)}
          disabled={isAllDates}
          style={({ pressed }) => [styles.arrowButton, { opacity: pressed ? 0.68 : 1 }]}
        >
          <Ionicons name="chevron-back" size={18} color={isAllDates ? theme.colors.textMuted : theme.colors.textPrimary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chooseDate')}
          onPress={openPicker}
          style={({ pressed }) => [styles.currentButton, { opacity: pressed ? 0.72 : 1 }]}
        >
          <Ionicons name={isAllDates ? 'calendar-outline' : 'calendar'} size={17} color={theme.colors.mapAccent} />
          <AppText variant="label" color="textPrimary" numberOfLines={1} style={styles.currentLabel}>
            {label}
          </AppText>
          <Ionicons name="chevron-down" size={15} color={theme.colors.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nextDate')}
          onPress={() => shiftActiveFilter(1)}
          disabled={isAllDates}
          style={({ pressed }) => [styles.arrowButton, { opacity: pressed ? 0.68 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={isAllDates ? theme.colors.textMuted : theme.colors.textPrimary} />
        </Pressable>
      </View>

      <Modal visible={isPickerVisible} animationType="fade" transparent onRequestClose={() => setIsPickerVisible(false)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setIsPickerVisible(false)}>
          <Pressable
            style={[
              styles.modalPanel,
              {
                backgroundColor: theme.isDark ? 'rgba(17, 21, 29, 0.74)' : 'rgba(255, 255, 255, 0.70)',
                borderColor: theme.colors.border,
              },
            ]}
          >
            {canUseLiquidGlass ? (
              <GlassView
                style={StyleSheet.absoluteFill}
                glassEffectStyle="regular"
                colorScheme={theme.isDark ? 'dark' : 'light'}
                tintColor={theme.isDark ? 'rgba(14, 18, 26, 0.18)' : 'rgba(255, 255, 255, 0.22)'}
                isInteractive
              />
            ) : (
              <>
                <BlurView
                  style={StyleSheet.absoluteFill}
                  tint={theme.isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
                  intensity={Platform.OS === 'android' ? 72 : 58}
                />
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: theme.isDark ? 'rgba(12, 16, 24, 0.30)' : 'rgba(255, 255, 255, 0.22)',
                    },
                  ]}
                />
              </>
            )}

            <View style={styles.modalHeader}>
              <AppText variant="bodyStrong">{t('chooseDate')}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('allDates')}
                onPress={() => setDraftMode('all')}
                style={[
                  styles.allDatesButton,
                  {
                    backgroundColor: draftMode === 'all' ? theme.colors.mapAccentSoft : 'transparent',
                    borderColor: draftMode === 'all' ? theme.colors.mapAccent : theme.colors.border,
                  },
                ]}
              >
                <AppText variant="label" color={draftMode === 'all' ? 'mapAccent' : 'textSecondary'}>
                  {t('allDates')}
                </AppText>
              </Pressable>
            </View>

            <View style={[styles.modeRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <PickerModeButton active={draftMode === 'day'} label={t('singleDay')} onPress={() => setDraftMode('day')} />
              <PickerModeButton active={draftMode === 'range'} label={t('dateRange')} onPress={() => setDraftMode('range')} />
            </View>

            {draftMode !== 'all' ? (
              <View style={styles.pickerSection}>
                <AppText variant="caption" color="textMuted" style={styles.pickerLabel}>
                  {draftMode === 'range' ? `${formatDateKey(draftFromISO, locale)} - ${formatDateKey(draftToISO, locale)}` : t('singleDay')}
                </AppText>
                {draftMode === 'day' ? (
                  <DateTimePicker
                    mode="single"
                    date={dateKeyToLocalDate(draftFromISO)}
                    calendar="gregory"
                    locale={locale === 'hr' ? 'hr' : 'en'}
                    firstDayOfWeek={locale === 'hr' ? 1 : 0}
                    showOutsideDays
                    navigationPosition="around"
                    styles={calendarStyles}
                    onChange={({ date }) => setDraftDay(date)}
                  />
                ) : (
                  <DateTimePicker
                    mode="range"
                    startDate={dateKeyToLocalDate(draftFromISO)}
                    endDate={dateKeyToLocalDate(draftToISO)}
                    calendar="gregory"
                    locale={locale === 'hr' ? 'hr' : 'en'}
                    firstDayOfWeek={locale === 'hr' ? 1 : 0}
                    showOutsideDays
                    navigationPosition="around"
                    styles={calendarStyles}
                    onChange={({ startDate, endDate }) => setDraftRange(startDate, endDate)}
                  />
                )}
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionButton, { borderColor: theme.colors.border }]} onPress={() => setIsPickerVisible(false)}>
                <AppText variant="label" color="textSecondary">
                  {t('cancel')}
                </AppText>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.primaryAction, { backgroundColor: theme.colors.mapAccent }]} onPress={applyDraft}>
                <AppText variant="label" style={styles.primaryActionText}>
                  {t('done')}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PickerModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.modeButton,
        {
          backgroundColor: active ? theme.colors.mapAccentSoft : 'transparent',
          borderColor: active ? theme.colors.mapAccent : 'transparent',
        },
      ]}
    >
      <AppText variant="label" color={active ? 'mapAccent' : 'textSecondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function getFilterLabel(dateFilter: MapDateFilter, locale: Locale, t: ReturnType<typeof useI18n>['t']) {
  if (dateFilter.mode === 'all') {
    return t('allDates');
  }

  if (dateFilter.mode === 'day') {
    return formatDateKey(dateFilter.dateISO, locale);
  }

  return `${formatDateKey(dateFilter.fromISO, locale)} - ${formatDateKey(dateFilter.toISO, locale)}`;
}

function formatDateKey(dateISO: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(dateKeyToLocalDate(dateISO));
}

function dateTypeToDate(date: DateType): Date | null {
  if (!date) {
    return null;
  }

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    const parsedDate = date.toDate();
    return parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  }

  return null;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  control: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  arrowButton: {
    width: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentButton: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  currentLabel: {
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalPanel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  allDatesButton: {
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSection: {
    marginTop: 14,
  },
  pickerLabel: {
    marginBottom: 4,
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 0,
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
});
