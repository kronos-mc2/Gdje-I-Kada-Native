import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/primitives/glass-surface';
import { useAppTheme } from '@/core/theme';
import type { ThemeColors } from '@/core/theme/types';

type AppCardProps = Readonly<PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'glass';
}>>;

export function AppCard({ children, style, variant = 'default' }: AppCardProps) {
  const { theme } = useAppTheme();
  const isIOSGlass = Platform.OS === 'ios' && variant === 'glass';

  return (
    <View
      style={[
        styles.base,
        {
          borderRadius: theme.tokens.radius.lg,
          borderColor: theme.colors.border,
          padding: theme.tokens.spacing.md,
          backgroundColor: getBackgroundColor(variant, theme.colors),
        },
        variant === 'elevated' ? theme.tokens.shadow.card : undefined,
        style,
      ]}
    >
      {isIOSGlass ? <GlassSurface /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});

function getBackgroundColor(variant: NonNullable<AppCardProps['variant']>, colors: ThemeColors) {
  if (variant === 'elevated') {
    return colors.surfaceElevated;
  }
  if (variant === 'glass' && Platform.OS !== 'ios') {
    return colors.surface;
  }
  return colors.card;
}
