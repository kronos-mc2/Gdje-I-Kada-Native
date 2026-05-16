import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDay, formatEventTime } from '@/core/utils/date';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type FypReelSummaryCardProps = {
  event: AppEvent;
  locale: Locale;
  onOpenDetails: () => void;
};

export function FypReelSummaryCard({ event, locale, onOpenDetails }: FypReelSummaryCardProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const organizerName = event.creatorName ?? t('organizerFallback');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('details')} onPress={onOpenDetails} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <AppCard variant="glass" style={styles.card}>
        <View style={styles.handleWrap}>
          <View style={[styles.chevronBadge, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
            <Ionicons name="chevron-up" size={16} color={theme.colors.textSecondary} />
          </View>
        </View>

        <View style={styles.headerRow}>
          <ProfileAvatar name={organizerName} avatarUrl={event.creatorAvatarUrl} size={34} />
          <View style={styles.titleBlock}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {event.title[locale]}
            </AppText>
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {event.where[locale]}
            </AppText>
          </View>
        </View>

        <AppText variant="caption" color="textSecondary" numberOfLines={2} style={styles.about}>
          {event.about[locale]}
        </AppText>

        <View style={styles.metaRow}>
          <MetaItem icon="calendar-outline" label={formatEventDay(event.whenISO, locale)} />
          <MetaItem icon="time-outline" label={formatEventTime(event.whenISO, locale)} />
          <MetaItem icon="people-outline" label={`${event.participantCount} ${t('participants')}`} />
        </View>
      </AppCard>
    </Pressable>
  );
}

function MetaItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.metaItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
      <Ionicons name={icon} size={13} color={theme.colors.textSecondary} />
      <AppText variant="caption" numberOfLines={1} style={styles.metaText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 9,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 7,
  },
  chevronBadge: {
    width: 32,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  about: {
    marginTop: 9,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 11,
  },
  metaItem: {
    maxWidth: '100%',
    minHeight: 30,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    flexShrink: 1,
  },
});
