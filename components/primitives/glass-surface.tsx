import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useMemo } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/core/theme';

type GlassSurfaceProps = Readonly<{
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function GlassSurface({ interactive = false, style }: GlassSurfaceProps) {
  const { theme } = useAppTheme();
  const canUseLiquidGlass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable(), []);

  if (Platform.OS !== 'ios') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface }, style]} />;
  }

  if (canUseLiquidGlass) {
    return (
      <GlassView
        style={[StyleSheet.absoluteFill, style]}
        glassEffectStyle="regular"
        colorScheme={theme.isDark ? 'dark' : 'light'}
        tintColor={theme.isDark ? 'rgba(17, 17, 20, 0.40)' : 'rgba(255, 255, 255, 0.34)'}
        isInteractive={interactive}
      />
    );
  }

  return (
    <>
      <BlurView style={[StyleSheet.absoluteFill, style]} tint={theme.isDark ? 'dark' : 'light'} intensity={36} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.isDark ? 'rgba(17, 17, 20, 0.68)' : 'rgba(240, 240, 240, 0.72)',
          },
          style,
        ]}
      />
    </>
  );
}
