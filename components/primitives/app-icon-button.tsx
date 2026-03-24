import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useAppTheme } from '@/core/theme';

type AppIconButtonProps = Omit<PressableProps, 'style'> & {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIconButton({ icon, size = 18, style, ...props }: AppIconButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        {
          width: 36,
          height: 36,
          borderRadius: theme.tokens.radius.pill,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
