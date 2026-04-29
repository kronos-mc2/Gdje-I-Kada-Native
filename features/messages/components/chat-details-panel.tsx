import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppCard, AppText } from '@/components/primitives';
import { useUpdateChatRoomMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { ChatRoom } from '@/core/types/domain';

type ChatDetailsPanelProps = {
  room: ChatRoom;
};

export function ChatDetailsPanel({ room }: ChatDetailsPanelProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const updateRoomMutation = useUpdateChatRoomMutation();
  const canAdmin = room.myRole === 'owner' || room.myRole === 'admin';

  return (
    <ScrollView style={[styles.panel, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <AppCard variant="glass" style={styles.card}>
        <AppText variant="headline">{room.title}</AppText>
        <AppText variant="body" color="textMuted">
          {room.type === 'event' ? t('eventChat') : room.type === 'group' ? t('groupChat') : t('directChat')}
        </AppText>
      </AppCard>

      <AppCard variant="glass" style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <AppText variant="bodyStrong">{t('adminOnlyMode')}</AppText>
            <AppText variant="caption" color="textMuted">
              {t('adminOnlyHint')}
            </AppText>
          </View>
          <Switch
            value={room.adminOnly}
            disabled={!canAdmin || updateRoomMutation.isPending}
            onValueChange={(adminOnly) => updateRoomMutation.mutate({ roomId: room.id, adminOnly })}
          />
        </View>
      </AppCard>

      <AppCard variant="glass" style={styles.card}>
        <AppText variant="bodyStrong">{t('chatMembers')}</AppText>
        {room.members?.length ? (
          room.members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <AppText variant="body">{member.name}</AppText>
              <AppText variant="caption" color="textMuted">
                {member.role}
              </AppText>
            </View>
          ))
        ) : (
          <AppText variant="body" color="textMuted">
            {t('friendEventsTodo')}
          </AppText>
        )}
      </AppCard>

      {room.type === 'direct' ? (
        <AppCard variant="glass" style={styles.card}>
          <AppText variant="bodyStrong">{t('events')}</AppText>
          <AppText variant="body" color="textMuted">
            {t('friendEventsTodo')}
          </AppText>
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
});
