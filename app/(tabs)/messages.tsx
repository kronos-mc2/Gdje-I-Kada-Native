import { AppHeader, AppScreen, AppText } from '@/components/primitives';
import { useConversationsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { ConversationRow } from '@/features/messages/components/conversation-row';

export default function MessagesScreen() {
  const { t, locale } = useI18n();
  const { data: conversations = [], isLoading } = useConversationsQuery();

  return (
    <AppScreen scroll>
      <AppHeader title={t('messages')} subtitle={t('chats')} />

      {isLoading ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 8 }}>
          {t('loading')}
        </AppText>
      ) : null}

      {conversations.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} locale={locale} />
      ))}
    </AppScreen>
  );
}
