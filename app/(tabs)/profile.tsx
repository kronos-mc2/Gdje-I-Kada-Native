import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/primitives';
import { useProfileActivityQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';
import { useAppTheme } from '@/core/theme';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { ProfileEventRow } from '@/features/profile/components/profile-event-row';
import { ProfileMenuRow } from '@/features/profile/components/profile-menu-row';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const userProfile = useAuthStore((state) => state.user);
  const { data: activity } = useProfileActivityQuery();
  const recentJoined = activity?.joinedEvents.slice(0, 2) ?? [];

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/profile/edit')} style={styles.avatarWrap}>
          <ProfileAvatar name={userProfile?.name} avatarUrl={userProfile?.avatarUrl} size={104} />
          <View style={[styles.editBadge, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
          </View>
        </Pressable>
        <AppText variant="title" style={styles.name} numberOfLines={2}>
          {userProfile?.name ?? t('notSignedIn')}
        </AppText>
        {userProfile?.bio ? (
          <AppText variant="body" color="textSecondary" style={styles.bio}>
            {userProfile.bio}
          </AppText>
        ) : (
          <AppText variant="body" color="textMuted" style={styles.bio}>
            {userProfile?.email}
          </AppText>
        )}
        <AppButton title={t('editProfile')} variant="glass" style={styles.editButton} onPress={() => router.push('/profile/edit')} />
      </View>

      <AppCard variant="glass" style={styles.menuCard}>
        <ProfileMenuRow icon="settings-outline" title={t('settings')} onPress={() => router.push('/profile/settings')} />
        <ProfileMenuRow
          icon="time-outline"
          title={t('activityHistory')}
          subtitle={t('activityHistorySubtitle')}
          onPress={() => router.push('/profile/activity')}
        />
        <ProfileMenuRow
          icon="receipt-outline"
          title={t('transactionHistory')}
          subtitle={t('transactionHistorySubtitle')}
          onPress={() => router.push('/profile/transactions')}
        />
        <ProfileMenuRow icon="heart-outline" title={t('likedEvents')} subtitle={t('likedEventsSubtitle')} onPress={() => router.push('/profile/liked')} />
      </AppCard>

      <View style={styles.sectionHeader}>
        <AppText variant="headline">{t('recentActivity')}</AppText>
        <Pressable onPress={() => router.push('/profile/activity')}>
          <AppText variant="caption" style={{ color: theme.colors.mapAccent }}>
            {t('seeAll')}
          </AppText>
        </Pressable>
      </View>

      <AppCard variant="glass" style={styles.activityCard}>
        {recentJoined.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noProfileActivity')}
          </AppText>
        ) : (
          recentJoined.map((event) => (
            <ProfileEventRow key={event.id} event={event} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })} />
          ))
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 18,
  },
  avatarWrap: {
    marginBottom: 14,
  },
  editBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
  },
  bio: {
    marginTop: 8,
    textAlign: 'center',
  },
  editButton: {
    marginTop: 16,
    minWidth: 150,
  },
  menuCard: {
    paddingVertical: 2,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityCard: {
    gap: 10,
  },
});
