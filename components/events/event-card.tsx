import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type EventCardProps = Readonly<{
  event: AppEvent;
  locale: Locale;
  distanceKm?: number;
  onPress: () => void;
}>;

export function EventCard({ event, locale, distanceKm, onPress }: EventCardProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <AppCard variant="glass" style={[styles.card, theme.tokens.shadow.card]}>
        <View style={styles.row}>
          <AppText variant="bodyStrong" style={styles.title}>
            {event.title[locale]}
          </AppText>

          <View style={[styles.countBadge, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
            <AppText variant="label" style={{ color: theme.colors.textSecondary }}>
              {event.participantCount}
            </AppText>
          </View>
        </View>

        <AppText variant="body" color="textSecondary" style={styles.meta}>
          {event.where[locale]}
        </AppText>
        <AppText variant="body" color="textMuted">
          {formatEventDate(event.whenISO, locale)}
        </AppText>

        {typeof distanceKm === 'number' ? (
          <AppText variant="caption" style={[styles.distance, { color: theme.colors.textMuted }]}>
            {distanceKm.toFixed(1)} km
          </AppText>
        ) : null}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  countBadge: {
    minWidth: 30,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  meta: {
    marginBottom: 2,
  },
  distance: {
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
