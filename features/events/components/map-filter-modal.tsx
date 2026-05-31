import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker, { useDefaultStyles, type DateType } from 'react-native-ui-datepicker';

import { AppButton, AppText } from '@/components/primitives';
import { EVENT_TAG_CATEGORIES, filterEventTags } from '@/core/events/event-tags';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import type { Locale } from '@/core/types/domain';
import { dateKeyToLocalDate, toDateKey } from '@/features/events/hooks/use-events-map-screen-model';
import type { MapDateFilter } from '@/features/events/hooks/use-events-map-screen-model';

type MapFilterModalProps = Readonly<{
  visible: boolean;
  locale: Locale;
  dateFilter: MapDateFilter;
  selectedTags: string[];
  onDateFilterChange: (dateFilter: MapDateFilter) => void;
  onSelectedTagsChange: (tags: string[]) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>;

type FilterTab = 'date' | 'tags';
type DatePickerMode = 'day' | 'range';

export function MapFilterModal({
  visible,
  locale,
  dateFilter,
  selectedTags,
  onDateFilterChange,
  onSelectedTagsChange,
  onClearFilters,
  onClose,
}: MapFilterModalProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const defaultCalendarStyles = useDefaultStyles(theme.isDark ? 'dark' : 'light');
  const bodyFontFamily = theme.tokens.typography.body.fontFamily;
  const captionFontFamily = theme.tokens.typography.caption.fontFamily;
  const labelFontFamily = theme.tokens.typography.label.fontFamily;
  const [tab, setTab] = useState<FilterTab>('date');
  const [tagQuery, setTagQuery] = useState('');
  const [datePickerMode, setDatePickerMode] = useState<DatePickerMode>('day');
  const [draftFromISO, setDraftFromISO] = useState(() => toDateKey(new Date()));
  const [draftToISO, setDraftToISO] = useState(() => toDateKey(new Date()));
  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags]);
  const calendarStyles = useMemo(
    () => ({
      ...defaultCalendarStyles,
      header: { ...defaultCalendarStyles.header, marginBottom: 8 },
      month_selector_label: {
        ...defaultCalendarStyles.month_selector_label,
        color: theme.colors.textPrimary,
        fontFamily: labelFontFamily,
        fontWeight: '700' as const,
      },
      year_selector_label: {
        ...defaultCalendarStyles.year_selector_label,
        color: theme.colors.textPrimary,
        fontFamily: labelFontFamily,
        fontWeight: '700' as const,
      },
      month_label: { ...defaultCalendarStyles.month_label, fontFamily: bodyFontFamily },
      year_label: { ...defaultCalendarStyles.year_label, fontFamily: bodyFontFamily },
      time_selector_label: { ...defaultCalendarStyles.time_selector_label, fontFamily: labelFontFamily },
      time_label: { ...defaultCalendarStyles.time_label, fontFamily: labelFontFamily },
      weekday_label: {
        ...defaultCalendarStyles.weekday_label,
        color: theme.colors.textMuted,
        fontFamily: captionFontFamily,
        fontWeight: '700' as const,
      },
      day: { ...defaultCalendarStyles.day, borderRadius: 8 },
      day_label: { ...defaultCalendarStyles.day_label, color: theme.colors.textPrimary, fontFamily: bodyFontFamily },
      outside_label: { ...defaultCalendarStyles.outside_label, color: theme.colors.textMuted, fontFamily: bodyFontFamily, opacity: 0.46 },
      today: { ...defaultCalendarStyles.today, borderColor: theme.colors.mapAccent, borderWidth: 1 },
      today_label: { ...defaultCalendarStyles.today_label, color: theme.colors.mapAccent, fontFamily: labelFontFamily },
      selected: { ...defaultCalendarStyles.selected, backgroundColor: theme.colors.mapAccent, borderRadius: 8 },
      selected_label: { ...defaultCalendarStyles.selected_label, color: '#FFFFFF', fontFamily: labelFontFamily, fontWeight: '700' as const },
      range_fill: { ...defaultCalendarStyles.range_fill, backgroundColor: theme.colors.mapAccentSoft },
      range_start: { ...defaultCalendarStyles.range_start, backgroundColor: theme.colors.mapAccent, borderRadius: 8 },
      range_start_label: { ...defaultCalendarStyles.range_start_label, color: '#FFFFFF', fontFamily: labelFontFamily, fontWeight: '700' as const },
      range_end: { ...defaultCalendarStyles.range_end, backgroundColor: theme.colors.mapAccent, borderRadius: 8 },
      range_end_label: { ...defaultCalendarStyles.range_end_label, color: '#FFFFFF', fontFamily: labelFontFamily, fontWeight: '700' as const },
      range_middle_label: {
        ...defaultCalendarStyles.range_middle_label,
        color: theme.colors.textPrimary,
        fontFamily: labelFontFamily,
        fontWeight: '600' as const,
      },
      button_prev_image: { ...defaultCalendarStyles.button_prev_image, tintColor: theme.colors.mapAccent },
      button_next_image: { ...defaultCalendarStyles.button_next_image, tintColor: theme.colors.mapAccent },
    }),
    [
      bodyFontFamily,
      captionFontFamily,
      defaultCalendarStyles,
      labelFontFamily,
      theme.colors.mapAccent,
      theme.colors.mapAccentSoft,
      theme.colors.textMuted,
      theme.colors.textPrimary,
    ],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (dateFilter.mode === 'range') {
      setDatePickerMode('range');
      setDraftFromISO(dateFilter.fromISO);
      setDraftToISO(dateFilter.toISO);
      return;
    }

    const selectedDay = dateFilter.mode === 'day' ? dateFilter.dateISO : toDateKey(new Date());
    setDatePickerMode('day');
    setDraftFromISO(selectedDay);
    setDraftToISO(selectedDay);
  }, [dateFilter, visible]);

  const toggleTag = (tag: string) => {
    if (selectedTagSet.has(tag)) {
      onSelectedTagsChange(selectedTags.filter((selectedTag) => selectedTag !== tag));
      return;
    }

    onSelectedTagsChange([...selectedTags, tag]);
  };

  const setDraftDay = (nextDate: DateType) => {
    const parsedDate = dateTypeToDate(nextDate);
    if (!parsedDate) {
      return;
    }

    const nextISO = toDateKey(parsedDate);
    setDraftFromISO(nextISO);
    setDraftToISO(nextISO);
    onDateFilterChange({ mode: 'day', dateISO: nextISO });
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
    onDateFilterChange(normalizeRange(nextFromISO, nextToISO));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.panel,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.isDark ? 'rgba(17, 17, 20, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            },
          ]}
          onPress={() => undefined}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="headline">{t('filters')}</AppText>
              <AppText variant="caption" color="textMuted">
                {t('filtersSubtitle')}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.segment, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <FilterTabButton active={tab === 'date'} label={t('dateFilter')} onPress={() => setTab('date')} />
            <FilterTabButton active={tab === 'tags'} label={t('eventTags')} onPress={() => setTab('tags')} />
          </View>

          {tab === 'date' ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateContent}>
              <View style={styles.dateOptions}>
                <DateOption label={t('allDates')} selected={dateFilter.mode === 'all'} onPress={() => onDateFilterChange({ mode: 'all' })} />
                <DateOption
                  label={t('today')}
                  selected={isSameDayFilter(dateFilter, 0)}
                  onPress={() => onDateFilterChange({ mode: 'day', dateISO: toDateKey(new Date()) })}
                />
                <DateOption
                  label={t('tomorrow')}
                  selected={isSameDayFilter(dateFilter, 1)}
                  onPress={() => onDateFilterChange({ mode: 'day', dateISO: toDateKey(addDays(new Date(), 1)) })}
                />
                <DateOption
                  label={t('thisWeek')}
                  selected={isThisWeekFilter(dateFilter)}
                  onPress={() =>
                    onDateFilterChange({
                      mode: 'range',
                      fromISO: toDateKey(new Date()),
                      toISO: toDateKey(addDays(new Date(), 6)),
                    })
                  }
                />
              </View>

              <View style={styles.customDateBlock}>
                <View style={styles.customDateHeader}>
                  <AppText variant="label" color="textSecondary">
                    {t('chooseDate')}
                  </AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {datePickerMode === 'range'
                      ? `${formatDateKey(draftFromISO, locale)} - ${formatDateKey(draftToISO, locale)}`
                      : formatDateKey(draftFromISO, locale)}
                  </AppText>
                </View>

                <View style={[styles.dateModeRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <DateModeButton active={datePickerMode === 'day'} label={t('singleDay')} onPress={() => setDatePickerMode('day')} />
                  <DateModeButton active={datePickerMode === 'range'} label={t('dateRange')} onPress={() => setDatePickerMode('range')} />
                </View>

                {datePickerMode === 'day' ? (
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
            </ScrollView>
          ) : (
            <View style={styles.tagsContent}>
              <View style={[styles.searchRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                  value={tagQuery}
                  onChangeText={setTagQuery}
                  placeholder={t('searchTags')}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.searchInput, { color: theme.colors.textPrimary, fontFamily: theme.tokens.typography.body.fontFamily }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.tagScroll}>
                {EVENT_TAG_CATEGORIES.map((category) => {
                  const visibleTags = filterEventTags(tagQuery, category.tags);
                  if (visibleTags.length === 0) {
                    return null;
                  }

                  return (
                    <View key={category.id} style={styles.categoryBlock}>
                      <AppText variant="label" color="textSecondary">
                        {category.title[locale]}
                      </AppText>
                      <View style={styles.tagWrap}>
                        {visibleTags.map((tag) => {
                          const selected = selectedTagSet.has(tag);
                          return (
                            <Pressable
                              key={`${category.id}-${tag}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              onPress={() => toggleTag(tag)}
                              style={({ pressed }) => [
                                styles.tagChip,
                                {
                                  borderColor: selected ? theme.colors.mapAccent : theme.colors.border,
                                  backgroundColor: selected ? theme.colors.mapAccentSoft : theme.colors.surface,
                                  opacity: pressed ? 0.8 : 1,
                                },
                              ]}
                            >
                              <AppText variant="caption" style={{ color: selected ? theme.colors.mapAccent : theme.colors.textSecondary }}>
                                {tag}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.actions}>
            <AppButton title={t('clearFilters')} variant="ghost" onPress={onClearFilters} />
            <AppButton title={t('done')} variant="glass" onPress={onClose} style={styles.doneButton} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DateModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.dateModeButton,
        {
          backgroundColor: active ? theme.colors.mapAccentSoft : 'transparent',
          borderColor: active ? theme.colors.mapAccent : 'transparent',
        },
      ]}
    >
      <AppText variant="caption" style={{ color: active ? theme.colors.mapAccent : theme.colors.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FilterTabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          backgroundColor: active ? theme.colors.mapAccentSoft : 'transparent',
        },
      ]}
    >
      <AppText variant="caption" style={{ color: active ? theme.colors.mapAccent : theme.colors.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function DateOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateOption,
        {
          borderColor: selected ? theme.colors.mapAccent : theme.colors.border,
          backgroundColor: selected ? theme.colors.mapAccentSoft : theme.colors.surface,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: selected ? theme.colors.mapAccent : theme.colors.textPrimary }}>
        {label}
      </AppText>
      {selected ? <Ionicons name="checkmark" size={18} color={theme.colors.mapAccent} /> : null}
    </Pressable>
  );
}

function isSameDayFilter(dateFilter: MapDateFilter, daysFromToday: number) {
  return dateFilter.mode === 'day' && dateFilter.dateISO === toDateKey(addDays(new Date(), daysFromToday));
}

function isThisWeekFilter(dateFilter: MapDateFilter) {
  if (dateFilter.mode !== 'range') {
    return false;
  }

  return (
    dateKeyToLocalDate(dateFilter.fromISO).toDateString() === new Date().toDateString() &&
    dateKeyToLocalDate(dateFilter.toISO).toDateString() === addDays(new Date(), 6).toDateString()
  );
}

function normalizeRange(fromISO: string, toISO: string): MapDateFilter {
  const fromDate = dateKeyToLocalDate(fromISO);
  const toDate = dateKeyToLocalDate(toISO);
  const [from, to] = fromDate.getTime() <= toDate.getTime() ? [fromISO, toISO] : [toISO, fromISO];
  return { mode: 'range', fromISO: from, toISO: to };
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
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    maxHeight: '82%',
    padding: 16,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  segment: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  dateOptions: {
    gap: 9,
  },
  dateScroll: {
    maxHeight: 470,
  },
  dateContent: {
    gap: 14,
    paddingBottom: 2,
  },
  dateOption: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: 13,
  },
  tagsContent: {
    gap: 12,
  },
  customDateBlock: {
    gap: 10,
  },
  customDateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  dateModeRow: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  dateModeButton: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  searchRow: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
  },
  tagScroll: {
    maxHeight: 330,
  },
  categoryBlock: {
    gap: 8,
    paddingBottom: 15,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  doneButton: {
    minWidth: 116,
  },
});
