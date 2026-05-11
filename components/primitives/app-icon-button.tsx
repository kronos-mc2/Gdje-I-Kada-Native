import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
      {isGlass ? (
        <>
          <BlurView style={StyleSheet.absoluteFillObject} tint={theme.isDark ? 'systemMaterialDark' : 'systemMaterialLight'} intensity={58} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
        </>
      ) : null}
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
