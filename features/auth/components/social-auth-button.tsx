import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/primitives';
import { useAppTheme } from '@/core/theme';

type SocialAuthButtonProps = {
  provider: 'google' | 'apple';
  title: string;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SocialAuthButton({ provider, title, disabled = false, onPress, style }: SocialAuthButtonProps) {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const backgroundColor = isDark ? '#FFFFFF' : '#111114';
  const borderColor = isDark ? '#FFFFFF' : '#111114';
  const textColor = isDark ? '#111114' : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? theme.tokens.motion.pressScale : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.stateLayer} />
      <View style={styles.content}>
        <Ionicons name={provider === 'google' ? 'logo-google' : 'logo-apple'} size={22} color={textColor} style={styles.providerIcon} />
        <AppText variant="label" numberOfLines={1} style={[styles.title, { color: textColor }]}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  stateLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  title: {
    flexShrink: 1,
    textAlign: 'center',
  },
  providerIcon: {
    width: 22,
  },
  disabled: {
    opacity: 0.45,
  },
});
