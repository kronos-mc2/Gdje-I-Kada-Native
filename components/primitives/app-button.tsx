import { BlurView } from 'expo-blur';
import { PropsWithChildren } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/core/theme';
import { AppText } from '@/components/primitives/app-text';

type AppButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    title?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    style?: StyleProp<ViewStyle>;
  }
>;

export function AppButton({ title, children, variant = 'primary', style, ...props }: AppButtonProps) {
  const { theme } = useAppTheme();
  const isGlass = Platform.OS === 'ios' && variant === 'glass';

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.surfaceElevated
      : variant === 'secondary'
        ? theme.colors.surface
        : variant === 'ghost'
          ? 'transparent'
          : theme.colors.surface;

  const textColor =
    variant === 'primary'
      ? theme.colors.textPrimary
      : variant === 'secondary'
        ? theme.colors.textSecondary
        : variant === 'ghost'
          ? theme.colors.textSecondary
          : theme.colors.textPrimary;

  return (
    <Pressable
      {...props}
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
      {isGlass ? (
        <>
          <BlurView style={StyleSheet.absoluteFillObject} tint={theme.isDark ? 'systemMaterialDark' : 'systemMaterialLight'} intensity={52} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
        </>
      ) : null}
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
