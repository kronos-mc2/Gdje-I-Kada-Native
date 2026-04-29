import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';
import { ChatRoom } from '@/core/types/domain';

type ChatRoomRowProps = {
  room: ChatRoom;
  onPress: () => void;
};

export function ChatRoomRow({ room, onPress }: ChatRoomRowProps) {
  const { theme } = useAppTheme();
  const initials = room.title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: room.type === 'event' ? theme.colors.mapAccentSoft : theme.colors.surfaceElevated }]}>
        {room.type === 'event' ? (
          <Ionicons name="calendar-outline" size={20} color={theme.colors.textPrimary} />
        ) : (
          <AppText variant="label">{initials || 'GI'}</AppText>
        )}
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {room.title}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {room.timeLabel}
          </AppText>
        </View>
        <View style={styles.subtitleRow}>
          <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.subtitle}>
            {room.lastMessage || room.subtitle}
          </AppText>
          {room.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <AppText variant="caption">{room.unreadCount}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
