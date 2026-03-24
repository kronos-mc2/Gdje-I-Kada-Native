import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/core/theme';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'glass';
}>;

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
          backgroundColor:
            variant === 'elevated'
              ? theme.colors.surfaceElevated
              : variant === 'glass' && Platform.OS !== 'ios'
                ? theme.colors.surface
                : theme.colors.card,
        },
        variant === 'elevated' ? theme.tokens.shadow.card : undefined,
        style,
      ]}
    >
      {isIOSGlass ? (
        <>
          <BlurView style={StyleSheet.absoluteFillObject} tint={theme.isDark ? 'systemMaterialDark' : 'systemMaterialLight'} intensity={55} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
        </>
      ) : null}
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
