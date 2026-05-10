import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppIconButton, AppScreen, AppText } from '@/components/primitives';
import { useLikedEventsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { ProfileEventRow } from '@/features/profile/components/profile-event-row';

export default function LikedEventsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: likedEvents = [], isLoading } = useLikedEventsQuery();

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('likedEvents')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.card}>
        {isLoading ? (
          <AppText variant="body" color="textMuted">
            {t('loading')}
          </AppText>
        ) : likedEvents.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noLikedEvents')}
          </AppText>
        ) : (
          likedEvents.map((event) => (
            <ProfileEventRow key={event.id} event={event} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })} />
          ))
        )}
      </AppCard>
    </AppScreen>
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
  },
});
