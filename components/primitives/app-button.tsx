import { PropsWithChildren } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/primitives/glass-surface';
import { useAppTheme } from '@/core/theme';
import type { ThemeColors } from '@/core/theme/types';
import { AppText } from '@/components/primitives/app-text';

type AppButtonProps = Readonly<PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    title?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    style?: StyleProp<ViewStyle>;
  }
>>;

export function AppButton({ title, children, variant = 'primary', style, ...props }: AppButtonProps) {
  const { theme } = useAppTheme();
  const isGlass = Platform.OS === 'ios' && variant === 'glass';
  const backgroundColor = getBackgroundColor(variant, theme.colors);
  const textColor = getTextColor(variant, theme.colors);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: 46,
          paddingHorizontal: theme.tokens.spacing.md,
          borderRadius: theme.tokens.radius.md,
          borderColor: variant === 'ghost' ? 'transparent' : theme.colors.border,
          backgroundColor,
          transform: [{ scale: pressed ? theme.tokens.motion.pressScale : 1 }],
          opacity: props.disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {isGlass ? <GlassSurface interactive /> : null}
      {title ? (
        <AppText variant="bodyStrong" style={{ color: textColor }}>
          {title}
        </AppText>
      ) : (
        children
      )}
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

function getBackgroundColor(variant: NonNullable<AppButtonProps['variant']>, colors: ThemeColors) {
  if (variant === 'primary') {
    return colors.surfaceElevated;
  }
  if (variant === 'ghost') {
    return 'transparent';
  }
  return colors.surface;
}

function getTextColor(variant: NonNullable<AppButtonProps['variant']>, colors: ThemeColors) {
  return variant === 'primary' || variant === 'glass' ? colors.textPrimary : colors.textSecondary;
}
