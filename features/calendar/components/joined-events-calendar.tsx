import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { PropsWithChildren, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

import { AppText } from '@/components/primitives';
import { formatEventDate } from '@/core/utils/date';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import {
  addMonthsToKey,
  formatCalendarMonth,
  formatSelectedDayLabel,
  monthDateKey,
  todayDateKey,
  toDateKey,
} from '@/features/calendar/utils/calendar-date';
import { createCalendarAccentColors } from '@/features/calendar/styles/calendar-colors';

LocaleConfig.locales.hr = {
  monthNames: [
    'Sijecanj',
    'Veljaca',
    'Ozujak',
    'Travanj',
    'Svibanj',
    'Lipanj',
    'Srpanj',
    'Kolovoz',
    'Rujan',
    'Listopad',
    'Studeni',
    'Prosinac',
  ],
  monthNamesShort: ['Sij', 'Vel', 'Ozu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'],
  dayNames: ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Cetvrtak', 'Petak', 'Subota'],
  dayNamesShort: ['NED', 'PON', 'UTO', 'SRI', 'CET', 'PET', 'SUB'],
  today: 'Danas',
};

LocaleConfig.locales.en = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  today: 'Today',
};
LocaleConfig.defaultLocale = 'hr';

type JoinedEventsCalendarProps = {
  events: AppEvent[];
  onOpenEvent: (eventId: string) => void;
};

export function JoinedEventsCalendar({ events, onOpenEvent }: JoinedEventsCalendarProps) {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const [selectedDay, setSelectedDay] = useState(todayDateKey());
  const [visibleMonth, setVisibleMonth] = useState(monthDateKey(new Date()));
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.startAt || a.whenISO).getTime() - new Date(b.startAt || b.whenISO).getTime()),
    [events],
  );

  const visibleEvents = useMemo(() => {
    if (!deferredSearchQuery) {
      return sortedEvents;
    }

    return sortedEvents.filter((event) => {
      const searchBody = [
        event.title.hr,
        event.title.en,
        event.where.hr,
        event.where.en,
        event.address,
        event.about.hr,
        event.about.en,
      ]
        .join(' ')
        .toLowerCase();

      return searchBody.includes(deferredSearchQuery);
    });
  }, [deferredSearchQuery, sortedEvents]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, AppEvent[]>();

    for (const event of visibleEvents) {
      const key = toDateKey(event.startAt || event.whenISO);
      const dayEvents = grouped.get(key) ?? [];
      dayEvents.push(event);
      grouped.set(key, dayEvents);
    }

    return grouped;
  }, [visibleEvents]);

  const selectedDayEvents = eventsByDay.get(selectedDay) ?? [];
  const hasSearch = searchQuery.trim().length > 0;
  const today = todayDateKey();
  const accentColors = useMemo(() => createCalendarAccentColors(theme), [theme]);
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent',
      calendarBackground: 'transparent',
      textSectionTitleColor: theme.colors.textMuted,
      textDisabledColor: theme.colors.textMuted,
      textInactiveColor: theme.colors.textMuted,
      monthTextColor: theme.colors.textPrimary,
      dayTextColor: theme.colors.textPrimary,
      selectedDayBackgroundColor: accentColors.primary,
      todayTextColor: accentColors.primary,
      'stylesheet.calendar.header': {
        header: {
          height: 18,
          paddingLeft: 0,
          paddingRight: 0,
          marginTop: -10,
        },
        week: {
          marginTop: 0,
          marginBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-around',
        },
      },
    }),
    [accentColors.primary, theme.colors.textMuted, theme.colors.textPrimary],
  );

  useEffect(() => {
    LocaleConfig.defaultLocale = locale;
  }, [locale]);

  useEffect(() => {
    if (!hasSearch || visibleEvents.length === 0) {
      return;
    }

    const firstResultDay = toDateKey(visibleEvents[0].startAt || visibleEvents[0].whenISO);
    setSelectedDay(firstResultDay);
    setVisibleMonth(monthDateKey(firstResultDay));
  }, [hasSearch, visibleEvents]);

  const moveMonth = (amount: number) => {
    const nextMonth = addMonthsToKey(visibleMonth, amount);
    setVisibleMonth(nextMonth);
    setSelectedDay(nextMonth);
  };

  const returnToToday = () => {
    const nextToday = todayDateKey();
    setVisibleMonth(monthDateKey(nextToday));
    setSelectedDay(nextToday);
  };

  const toggleSearch = () => {
    if (searchVisible) {
      setSearchQuery('');
      setSearchVisible(false);
      return;
    }

    setSearchVisible(true);
  };

  const handleDayPress = (date: DateData) => {
    setSelectedDay(date.dateString);
    setVisibleMonth(monthDateKey(date.dateString));
  };

  const renderSelectedDayEvents = () => {
    if (hasSearch && visibleEvents.length === 0) {
      return (
        <CalendarSurface style={styles.emptyCard}>
          <AppText color="textMuted">{t('calendarSearchEmpty')}</AppText>
        </CalendarSurface>
      );
    }

    if (selectedDayEvents.length === 0) {
      return (
        <CalendarSurface style={styles.emptyCard}>
          <AppText color="textMuted">{events.length === 0 ? t('noJoinedEvents') : t('noEventsForDay')}</AppText>
        </CalendarSurface>
      );
    }

    return selectedDayEvents.map((event) => (
      <CalendarEventRow key={event.id} event={event} onPress={() => onOpenEvent(event.id)} />
    ));
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.monthPill}>
          <AppText variant="headline" style={styles.monthText}>
            {formatCalendarMonth(visibleMonth, locale)}
          </AppText>
        </View>

        <View style={styles.rightActions}>
          <Pressable
            accessibilityLabel={t('previousMonth')}
            onPress={() => moveMonth(-1)}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityLabel={t('nextMonth')}
            onPress={() => moveMonth(1)}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityLabel={t('searchCalendar')}
            onPress={toggleSearch}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Ionicons name={searchVisible ? 'close' : 'search'} size={18} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityLabel={t('goToToday')}
            onPress={returnToToday}
            style={({ pressed }) => [
              styles.todayButton,
              {
                backgroundColor: selectedDay === today ? accentColors.soft : theme.colors.surface,
                borderColor: selectedDay === today ? accentColors.primary : theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={[styles.todayText, { color: selectedDay === today ? accentColors.primary : theme.colors.textSecondary }]}
            >
              {new Date(`${today}T00:00:00`).getDate()}
            </AppText>
          </Pressable>
        </View>
      </View>

      {searchVisible ? (
        <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={17} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('calendarSearchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
        </View>
      ) : null}

      <CalendarSurface style={styles.calendarCard}>
        <Calendar
          key={visibleMonth}
          current={visibleMonth}
          firstDay={1}
          hideArrows
          hideExtraDays={false}
          showSixWeeks
          enableSwipeMonths
          renderHeader={() => null}
          onMonthChange={(date) => setVisibleMonth(monthDateKey(date.dateString))}
          onDayPress={handleDayPress}
          dayComponent={({ date, state }) => (
            <CalendarDayCell
              date={date}
              state={state}
              selected={date?.dateString === selectedDay}
              today={date?.dateString === today}
              events={date ? eventsByDay.get(date.dateString) ?? [] : []}
              accentColors={accentColors}
              onPress={handleDayPress}
            />
          )}
          theme={calendarTheme}
        />
      </CalendarSurface>

      <View style={styles.selectedHeader}>
        <AppText variant="caption" color="textMuted">
          {formatSelectedDayLabel(selectedDay, locale)}
        </AppText>
        {hasSearch ? (
          <AppText variant="caption" color="textMuted">
            {visibleEvents.length} {t('calendarSearchResults')}
          </AppText>
        ) : null}
      </View>

      <View style={styles.eventsList}>{renderSelectedDayEvents()}</View>
    </View>
  );
}

type CalendarDayCellProps = {
  date?: DateData;
  state?: string;
  selected: boolean;
  today: boolean;
  events: AppEvent[];
  accentColors: ReturnType<typeof createCalendarAccentColors>;
  onPress: (date: DateData) => void;
};

function CalendarDayCell({ date, state, selected, today, events, accentColors, onPress }: CalendarDayCellProps) {
  const { theme } = useAppTheme();
  const inactive = state === 'disabled';
  const eventPreview = events.slice(0, 3);

  if (!date) {
    return <View style={styles.dayCell} />;
  }

  return (
    <Pressable
      onPress={() => onPress(date)}
      style={({ pressed }) => [
        styles.dayCell,
        {
          borderColor: selected ? accentColors.primary : 'transparent',
          backgroundColor: selected ? accentColors.soft : 'transparent',
          opacity: pressed ? 0.72 : inactive ? 0.32 : 1,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={[
          styles.dayNumber,
          {
            color: today ? accentColors.primary : inactive ? theme.colors.textMuted : theme.colors.textPrimary,
            backgroundColor: today ? accentColors.soft : 'transparent',
          },
        ]}
      >
        {date.day}
      </AppText>

      <View style={styles.eventMarks}>
        {eventPreview.map((event, index) => (
          <View
            key={event.id}
            style={[styles.eventMark, { opacity: index === 0 ? 1 : 0.72, backgroundColor: accentColors.primary }]}
          />
        ))}
      </View>
    </Pressable>
  );
}

type CalendarEventRowProps = {
  event: AppEvent;
  onPress: () => void;
};

function CalendarEventRow({ event, onPress }: CalendarEventRowProps) {
  const { locale, t } = useI18n();
  const { theme } = useAppTheme();
  const accentColors = useMemo(() => createCalendarAccentColors(theme), [theme]);
  const attendanceLabel = getAttendanceLabel(event.attendanceStatus, t);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <CalendarSurface style={styles.eventRow}>
        <View style={styles.eventIconWrap}>
          <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.eventContent}>
          <View style={styles.eventTitleLine}>
            <View style={[styles.eventAccent, { backgroundColor: accentColors.primary }]} />
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.eventTitle}>
              {event.title[locale]}
            </AppText>
            {event.participantCount > 1 ? (
              <View style={[styles.countBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
                <AppText variant="caption" color="textSecondary">
                  {event.participantCount}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {event.where[locale]}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {formatEventDate(event.startAt || event.whenISO, locale)}
          </AppText>
          {attendanceLabel ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {attendanceLabel}
            </AppText>
          ) : null}
        </View>
      </CalendarSurface>
    </Pressable>
  );
}

function getAttendanceLabel(status: AppEvent['attendanceStatus'], t: ReturnType<typeof useI18n>['t']) {
  if (status === 'waitlisted') {
    return t('attendanceWaitlisted');
  }
  if (status === 'approved') {
    return t('attendanceApproved');
  }
  if (status === 'rejected') {
    return t('attendanceRemoved');
  }
  if (status === 'blocked') {
    return t('attendanceBlocked');
  }
  return null;
}

type CalendarSurfaceProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

function CalendarSurface({ children, style }: CalendarSurfaceProps) {
  const { theme } = useAppTheme();
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);
  const isIOS = Platform.OS === 'ios';

  return (
    <View
      style={[
        styles.surfaceBase,
        {
          borderRadius: theme.tokens.radius.lg,
          borderWidth: isIOS ? 0 : 1,
          borderColor: theme.colors.border,
          padding: theme.tokens.spacing.md,
          backgroundColor: isIOS ? 'transparent' : theme.colors.surface,
        },
        style,
      ]}
    >
      {isIOS ? (
        canUseLiquidGlass ? (
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            colorScheme={theme.isDark ? 'dark' : 'light'}
            tintColor={theme.isDark ? 'rgba(6, 7, 10, 0.36)' : 'rgba(255, 255, 255, 0.24)'}
            isInteractive
          />
        ) : (
          <>
            <BlurView
              style={StyleSheet.absoluteFill}
              tint={theme.isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
              intensity={theme.isDark ? 70 : 54}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: theme.isDark ? 'rgba(5, 7, 11, 0.68)' : 'rgba(255, 255, 255, 0.30)',
                },
              ]}
            />
          </>
        )
      ) : null}
      <View style={styles.surfaceContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  surfaceBase: {
    overflow: 'hidden',
  },
  surfaceContent: {
    flex: 1,
    overflow: 'hidden',
  },
  root: {
    gap: 14,
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    flex: 1,
    minHeight: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  monthText: {
    letterSpacing: 0,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  todayButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    fontWeight: '800',
  },
  searchWrap: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    fontSize: 15,
  },
  calendarCard: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  dayCell: {
    width: 45,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    paddingTop: 3,
    paddingHorizontal: 2,
  },
  dayNumber: {
    minWidth: 22,
    minHeight: 22,
    borderRadius: 7,
    overflow: 'hidden',
    textAlign: 'center',
    fontWeight: '800',
  },
  eventMarks: {
    marginTop: 4,
    minHeight: 12,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMark: {
    width: 5,
    height: 5,
    borderRadius: 999,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventsList: {
    gap: 10,
  },
  emptyCard: {
    minHeight: 82,
    justifyContent: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  eventIconWrap: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  eventContent: {
    flex: 1,
    gap: 2,
  },
  eventTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventAccent: {
    width: 4,
    height: 18,
    borderRadius: 999,
  },
  eventTitle: {
    flex: 1,
  },
  countBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
