import { AppTheme } from '@/core/theme';

export const createCalendarAccentColors = (theme: AppTheme) => ({
  primary: theme.colors.mapAccent,
  soft: theme.colors.mapAccentSoft,
  onPrimary: theme.isDark ? '#F8F4FF' : '#FFFFFF',
});
