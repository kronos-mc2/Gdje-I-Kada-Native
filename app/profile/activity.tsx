import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppInput, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useProfileActivityQuery, useRateOrganizerMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { ProfileEventRow } from '@/features/profile/components/profile-event-row';

export default function ProfileActivityScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: activity, isLoading } = useProfileActivityQuery();
  const joinedEvents = activity?.joinedEvents ?? [];
  const ratingCandidates = activity?.ratingCandidates ?? [];
  const notifications = activity?.notifications ?? [];

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('activityHistory')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title={t('joinedEvents')} subtitle={t('joinedEventsSubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        {isLoading ? (
          <AppText variant="body" color="textMuted">
            {t('loading')}
          </AppText>
        ) : joinedEvents.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noJoinedEvents')}
          </AppText>
        ) : (
          joinedEvents.map((event) => (
            <ProfileEventRow key={event.id} event={event} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })} />
          ))
        )}
      </AppCard>

      <SectionHeader title={t('notifications')} subtitle={t('activityHistorySubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        {notifications.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noNotifications')}
          </AppText>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationRow}>
              <AppText variant="bodyStrong">{notification.title}</AppText>
              <AppText variant="caption" color="textMuted">
                {notification.body}
              </AppText>
            </View>
          ))
        )}
      </AppCard>

      <SectionHeader title={t('rateOrganizers')} subtitle={t('rateOrganizersSubtitle')} />
      <AppCard variant="glass" style={styles.card}>
        {ratingCandidates.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noRatingCandidates')}
          </AppText>
        ) : (
          ratingCandidates.map((event) => <RatingCandidate key={event.id} event={event} />)
        )}
      </AppCard>
    </AppScreen>
  );
}

function RatingCandidate({ event }: { event: AppEvent }) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const rateOrganizerMutation = useRateOrganizerMutation();
  const [organizerRating, setOrganizerRating] = useState(5);
  const [organizerComment, setOrganizerComment] = useState('');

  const submitRating = async () => {
    try {
      await rateOrganizerMutation.mutateAsync({
        eventId: event.id,
        rating: organizerRating,
        comment: organizerComment.trim() || undefined,
      });
      Alert.alert(t('ratingSaved'));
    } catch {
      Alert.alert(t('ratingFailed'));
    }
  };

  return (
    <View style={[styles.ratingBlock, { borderBottomColor: theme.colors.border }]}>
      <ProfileEventRow event={event} onPress={() => undefined} />
      <RatingStars label={t('organizerRating')} rating={organizerRating} onChange={setOrganizerRating} />
      <AppInput
        value={organizerComment}
        onChangeText={setOrganizerComment}
        placeholder={t('organizerCommentPlaceholder')}
        multiline
        style={styles.commentInput}
        containerStyle={styles.commentInputWrap}
      />
      <View style={styles.ratingActions}>
        <AppButton
          title={rateOrganizerMutation.isPending ? t('loading') : t('rateOrganizer')}
          variant="secondary"
          disabled={rateOrganizerMutation.isPending}
          style={styles.rateButton}
          onPress={() => void submitRating()}
        />
      </View>
    </View>
  );
}

function RatingStars({ label, rating, onChange }: { label: string; rating: number; onChange: (rating: number) => void }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.ratingLine}>
      <AppText variant="caption" color="textMuted" style={styles.ratingLabel}>
        {label}
      </AppText>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${value}/5`}
            accessibilityState={{ selected: value === rating }}
            onPress={() => onChange(value)}
            hitSlop={8}
          >
            <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={26} color={value <= rating ? theme.colors.mapAccent : theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    gap: 12,
    marginBottom: 20,
  },
  ratingBlock: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ratingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  ratingLine: {
    gap: 6,
  },
  ratingLabel: {
    marginLeft: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  commentInputWrap: {
    marginBottom: 0,
  },
  commentInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  notificationRow: {
    gap: 4,
  },
  rateButton: {
    minWidth: 118,
  },
});
