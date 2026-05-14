import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/primitives/glass-surface';
import { useAppTheme } from '@/core/theme';

type AppIconButtonProps = Omit<PressableProps, 'style'> & {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  variant?: 'default' | 'glass';
  style?: StyleProp<ViewStyle>;
};

export function AppIconButton({ icon, size = 18, variant = 'default', style, ...props }: AppIconButtonProps) {
  const { theme } = useAppTheme();
  const isGlass = Platform.OS === 'ios' && variant === 'glass';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? icon}
      style={({ pressed }) => [
        styles.base,
        {
          width: 36,
          height: 36,
          borderRadius: theme.tokens.radius.pill,
          backgroundColor: isGlass ? 'transparent' : theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {isGlass ? <GlassSurface interactive /> : null}
      <Ionicons name={icon} size={size} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
