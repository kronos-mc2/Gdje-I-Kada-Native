import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

type FypReelActionsProps = Readonly<{
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onOpenShare: () => void;
  onNotInterested: () => void;
}>;

type ActionButtonProps = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  active?: boolean;
  onPress: () => void;
}>;

export function FypReelActions({ liked, likeCount, onToggleLike, onOpenShare, onNotInterested }: FypReelActionsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.actions}>
      <ActionButton
        icon={liked ? 'heart' : 'heart-outline'}
        label={liked ? t('unlike') : t('like')}
        value={formatCompactCount(likeCount)}
        active={liked}
        onPress={onToggleLike}
      />
      <ActionButton icon="paper-plane-outline" label={t('shareEvent')} onPress={onOpenShare} />
      <ActionButton icon="remove-circle-outline" label={t('notInterested')} onPress={onNotInterested} />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  value,
  active = false,
  onPress,
}: ActionButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.actionWrap, { opacity: pressed ? 0.76 : 1 }]} onPress={onPress}>
      <View style={[styles.actionIconWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
        <Ionicons name={icon} size={25} color={active ? theme.colors.mapAccent : theme.colors.textPrimary} />
      </View>
      {value ? (
        <AppText variant="caption" style={styles.actionValue}>
          {value}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function formatCompactCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }

  return String(value);
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 8,
  },
  actionWrap: {
    alignItems: 'center',
    gap: 6,
    minWidth: 54,
  },
  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionValue: {
    textAlign: 'center',
  },
});
