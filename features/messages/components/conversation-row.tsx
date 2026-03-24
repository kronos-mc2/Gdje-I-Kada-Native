import { AppListRow, AppText } from '@/components/primitives';
import { Conversation, Locale } from '@/core/types/domain';

type ConversationRowProps = {
  conversation: Conversation;
  locale: Locale;
};

export function ConversationRow({ conversation, locale }: ConversationRowProps) {
  return (
    <AppListRow
      title={conversation.contact}
      subtitle={conversation.lastMessage[locale]}
      cardVariant="glass"
      right={
        <AppText variant="caption" color="textMuted">
          {conversation.timeLabel}
        </AppText>
      }
    />
  );
}
