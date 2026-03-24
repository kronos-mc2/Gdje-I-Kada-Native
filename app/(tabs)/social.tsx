import { AppHeader, AppScreen, AppText } from '@/components/primitives';
import { useFriendsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { FriendRow } from '@/features/social/components/friend-row';

export default function SocialScreen() {
  const { t, locale } = useI18n();
  const { data: friends = [], isLoading } = useFriendsQuery();

  return (
    <AppScreen scroll>
      <AppHeader title={t('social')} subtitle={t('inviteFriends')} />

      {isLoading ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 8 }}>
          {t('loading')}
        </AppText>
      ) : null}

      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} locale={locale} />
      ))}
    </AppScreen>
  );
}
