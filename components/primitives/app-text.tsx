import { memo } from 'react';
import { Text, TextProps } from 'react-native';

import { useAppTheme } from '@/core/theme';
import { ThemeColors, TypographyScale } from '@/core/theme/types';

type TextVariant = keyof TypographyScale;

type AppTextProps = TextProps & {
  color?: keyof ThemeColors;
  variant?: TextVariant;
};

function AppTextComponent({ color = 'textPrimary', variant = 'body', style, ...props }: AppTextProps) {
  const { theme } = useAppTheme();

  return <Text {...props} style={[theme.tokens.typography[variant], { color: theme.colors[color] }, style]} />;
}

export const AppText = memo(AppTextComponent);
