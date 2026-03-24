import { DesignTokens } from '@/core/theme/types';

export const designTokens: DesignTokens = {
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  typography: {
    display: { fontSize: 36, lineHeight: 42, fontWeight: '800' },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
    headline: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  },
  shadow: {
    card: {
      shadowColor: '#020617',
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  },
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  zIndex: {
    base: 0,
    header: 20,
    tabBar: 30,
    modal: 40,
  },
  motion: {
    fast: 120,
    normal: 220,
    slow: 320,
    pressScale: 0.97,
  },
};
