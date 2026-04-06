import { AppHeader, AppScreen, AppText, SectionHeader } from '@/components/primitives';
import { useConversationsQuery, useFriendsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { ConversationRow } from '@/features/messages/components/conversation-row';
import { FriendRow } from '@/features/social/components/friend-row';

export default function SocialScreen() {
  const { t, locale } = useI18n();
  const { data: friends = [], isLoading: isFriendsLoading } = useFriendsQuery();
  const { data: conversations = [], isLoading: isConversationsLoading } = useConversationsQuery();
  const isLoading = isFriendsLoading || isConversationsLoading;

  return (
    <AppScreen scroll>
      <AppHeader title={t('social')} subtitle={t('socialHubSubtitle')} />

      {isLoading ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 8 }}>
          {t('loading')}
        </AppText>
      ) : null}

      <SectionHeader title={t('messages')} subtitle={t('chats')} />
      {!isLoading && conversations.length === 0 ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 4, marginBottom: 12 }}>
          {t('noConversations')}
        </AppText>
      ) : null}
      {conversations.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} locale={locale} />
      ))}

      <SectionHeader title={t('friends')} subtitle={t('inviteFriends')} />
      {!isLoading && friends.length === 0 ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 4, marginBottom: 12 }}>
          {t('noFriends')}
        </AppText>
      ) : null}
      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} locale={locale} />
      ))}
    </AppScreen>
  );
}
