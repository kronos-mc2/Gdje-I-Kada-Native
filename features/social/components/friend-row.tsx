import { AppListRow } from '@/components/primitives';
import { Friend, Locale } from '@/core/types/domain';

type FriendRowProps = Readonly<{
  friend: Friend;
  locale: Locale;
}>;

export function FriendRow({ friend, locale }: FriendRowProps) {
  return <AppListRow title={friend.name} subtitle={friend.status[locale]} cardVariant="glass" />;
}
