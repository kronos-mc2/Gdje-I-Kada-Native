import { darkColors, lightColors } from '@/core/theme/palette';
import { designTokens } from '@/core/theme/tokens';
import { AppTheme, ThemeMode } from '@/core/theme/types';

export const createAppTheme = (mode: ThemeMode): AppTheme => ({
  mode,
  isDark: mode === 'dark',
  colors: mode === 'dark' ? darkColors : lightColors,
  tokens: designTokens,
});
