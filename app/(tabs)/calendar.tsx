import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard, AppScreen, AppText } from '@/components/primitives';
import { useEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type CalendarFilter = 'all' | 'joined' | 'created';

const dateKey = (input: string) => {
  const value = new Date(input);
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${value.getFullYear()}-${month}-${day}`;
};

const todayKey = () => dateKey(new Date().toISOString());

export default function CalendarScreen() {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { data: fetchedEvents = [] } = useEventsQuery();

  const createdEvents = useAppStore((state) => state.createdEvents);
  const joinedEventIds = useAppStore((state) => state.joinedEventIds);

  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('all');
  const [selectedDay, setSelectedDay] = useState<string>(todayKey());

  const allEvents = useMemo(
    () => [...createdEvents, ...fetchedEvents].sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime()),
    [createdEvents, fetchedEvents],
  );

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'created') {
      return allEvents.filter((event) => event.type === 'created');
    }

    if (activeFilter === 'joined') {
      return allEvents.filter((event) => joinedEventIds.includes(event.id));
    }

    return allEvents;
  }, [activeFilter, allEvents, joinedEventIds]);

  const availableDays = useMemo(() => {
    const days = new Set<string>([todayKey()]);
    for (const event of filteredEvents) {
      days.add(dateKey(event.whenISO));
    }

    return [...days].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [filteredEvents]);

  const eventsForSelectedDay = useMemo(
    () => filteredEvents.filter((event) => dateKey(event.whenISO) === selectedDay),
    [filteredEvents, selectedDay],
  );

  const formatDay = (key: string) => {
    const asDate = new Date(`${key}T00:00:00`);
    const isToday = key === todayKey();

    if (isToday) {
      return t('today');
    }

    return asDate.toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderDayEvents = () => {
    if (eventsForSelectedDay.length === 0) {
      return (
        <AppCard variant="glass">
          <AppText color="textMuted">{t('noEventsForDay')}</AppText>
        </AppCard>
      );
    }

    return eventsForSelectedDay.map((event) => <DayEventCard key={event.id} event={event} locale={locale} />);
  };

  return (
    <AppScreen scroll>
      <View style={styles.segmentRow}>
        <SegmentButton active={activeFilter === 'all'} label={t('allEvents')} onPress={() => setActiveFilter('all')} />
        <SegmentButton active={activeFilter === 'joined'} label={t('joined')} onPress={() => setActiveFilter('joined')} />
        <SegmentButton active={activeFilter === 'created'} label={t('created')} onPress={() => setActiveFilter('created')} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.daysRow, { borderColor: theme.colors.border }]}
      >
        {availableDays.map((day) => {
          const selected = day === selectedDay;

          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={({ pressed }) => [
                styles.dayChip,
                {
                  borderColor: selected ? theme.colors.mapAccent : theme.colors.border,
                  backgroundColor: selected ? theme.colors.mapAccentSoft : theme.colors.surface,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <AppText variant="caption">{formatDay(day)}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listWrap}>{renderDayEvents()}</View>
    </AppScreen>
  );
}

type SegmentButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function SegmentButton({ label, active, onPress }: SegmentButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        {
          borderColor: active ? theme.colors.mapAccent : theme.colors.border,
          backgroundColor: active ? theme.colors.mapAccentSoft : theme.colors.surface,
          opacity: pressed ? 0.84 : 1,
        },
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

type DayEventCardProps = {
  event: AppEvent;
  locale: 'hr' | 'en';
};

function DayEventCard({ event, locale }: DayEventCardProps) {
  const { t } = useI18n();

  return (
    <AppCard variant="glass" style={styles.eventCard}>
      <AppText variant="bodyStrong">{event.title[locale]}</AppText>
      <AppText variant="caption" color="textSecondary" style={styles.eventMeta}>
        {event.where[locale]}
      </AppText>
      <AppText variant="caption" color="textMuted" style={styles.eventMeta}>
        {formatEventDate(event.whenISO, locale)}
      </AppText>
      <View style={styles.badgesRow}>
        <AppText variant="caption" color="textSecondary">
          {event.type === 'created' ? t('created') : t('joined')}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  daysRow: {
    gap: 8,
    marginTop: 14,
    paddingBottom: 4,
  },
  dayChip: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    marginTop: 14,
    gap: 10,
  },
  eventCard: {
    marginBottom: 10,
  },
  eventMeta: {
    marginTop: 3,
  },
  badgesRow: {
    marginTop: 10,
  },
});
