import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { FYP_REEL_TEXT_MAX_FONT_MULTIPLIER } from '@/features/events/components/fyp/fyp-layout';

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
  showValue?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}>;

export function FypReelActions({ liked, likeCount, onToggleLike, onOpenShare, onNotInterested }: FypReelActionsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.actions}>
      <ActionButton
        icon={liked ? 'heart' : 'heart-outline'}
        label={liked ? t('unfavorite') : t('favorite')}
        value={formatCompactCount(likeCount)}
        showValue
        active={liked}
        onPress={onToggleLike}
      />
      <ActionButton icon="paper-plane-outline" label={t('shareEvent')} style={styles.shareAction} onPress={onOpenShare} />
      <ActionButton icon="remove-circle-outline" label={t('notInterested')} onPress={onNotInterested} />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  value,
  showValue = false,
  active = false,
  style,
  onPress,
}: ActionButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionWrap, style, { opacity: pressed ? 0.76 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
        <Ionicons name={icon} size={25} color={active ? theme.colors.mapAccent : theme.colors.textPrimary} />
      </View>
      {showValue && value ? (
        <AppText variant="caption" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} numberOfLines={1} style={styles.actionValue}>
          {value}
        </AppText>
      ) : (
        <View style={styles.actionValueSpacer} />
      )}
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
    gap: 0,
    paddingBottom: 8,
  },
  actionWrap: {
    alignItems: 'center',
    gap: 4,
    minWidth: 54,
  },
  shareAction: {
    marginTop: 19,
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionValueSpacer: {
    height: 18,
  },
});
