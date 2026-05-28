import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { getEventPosterSource } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { formatEventTime } from '@/core/utils/date';
import { formatSavedDayParts, formatStartsIn } from '@/features/saved/utils/saved-events';

type SavedEventRowProps = {
  event: AppEvent;
  onPress: () => void;
  compact?: boolean;
};

export function SavedEventRow({ event, onPress, compact = false }: SavedEventRowProps) {
  const { locale, t } = useI18n();
  const { theme } = useAppTheme();
  const posterSource = getEventPosterSource(event);
  const dayParts = formatSavedDayParts(event, locale);
  const startsIn = formatStartsIn(event, locale);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        compact ? styles.compactRow : null,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View style={styles.dateBlock}>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {dayParts.weekday}
        </AppText>
        <AppText variant="headline" numberOfLines={1}>
          {dayParts.day}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {dayParts.month}
        </AppText>
      </View>
      {posterSource ? (
        <Image source={posterSource} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.colors.surfaceElevated }]} />
      )}
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {event.title[locale]}
        </AppText>
        <View style={styles.metaLine}>
          <Ionicons name="time-outline" size={15} color={theme.colors.textMuted} />
          <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
            {formatEventTime(event.startAt || event.whenISO, locale)}
            {startsIn ? ` · ${startsIn}` : ''}
          </AppText>
        </View>
        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={15} color={theme.colors.textMuted} />
          <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.metaText}>
            {event.where[locale]}
          </AppText>
        </View>
      </View>
      {event.joinedByMe ? (
        <View style={[styles.goingPill, { borderColor: theme.colors.mapAccent }]}>
          <Ionicons name="checkmark" size={16} color={theme.colors.mapAccent} />
          <AppText variant="caption" style={{ color: theme.colors.mapAccent }} numberOfLines={1}>
            {t('goingStatus')}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={19} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 112,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  compactRow: {
    minHeight: 96,
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 66,
    height: 66,
    borderRadius: 14,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  metaLine: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    flex: 1,
  },
  goingPill: {
    minWidth: 78,
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
});
