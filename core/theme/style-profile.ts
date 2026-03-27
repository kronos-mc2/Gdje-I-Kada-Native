import { DesignTokens, ThemeColors } from '@/core/theme/types';

type ThemeStyleProfile = {
  colors: {
    dark: ThemeColors;
    light: ThemeColors;
  };
  tokens: DesignTokens;
};

// Master place for app styling.
// Edit this file to change colors, spacing, radius, typography, shadow, etc. globally.
export const appStyleProfile: ThemeStyleProfile = {
  colors: {
    dark: {
      background: '#05070A',
      surface: '#101318',
      surfaceElevated: '#171B22',
      card: '#141920',
      border: '#232A34',
      textPrimary: '#EDF1F8',
      textSecondary: '#BFC7D4',
      textMuted: '#8B94A6',
      accent: '#EEF2F9',
      accentSoft: '#CCD4E0',
      success: '#8FA58A',
      warning: '#C4B298',
      danger: '#D39B9B',
      info: '#B6C0D1',
      mapAccent: '#8B5CF6',
      mapAccentSoft: 'rgba(139, 92, 246, 0.24)',
      mapOverlay: 'rgba(76, 29, 149, 0.16)',
      overlay: 'rgba(5, 8, 12, 0.64)',
      glassTint: 'rgba(255, 255, 255, 0.13)',
    },
    light: {
      background: '#ECEFF4',
      surface: '#FFFFFF',
      surfaceElevated: '#F4F6FA',
      card: '#FFFFFF',
      border: '#D0D7E2',
      textPrimary: '#1A202B',
      textSecondary: '#3B4558',
      textMuted: '#697384',
      accent: '#202938',
      accentSoft: '#4E586A',
      success: '#4A6A4A',
      warning: '#7A6551',
      danger: '#885555',
      info: '#4C5E7A',
      mapAccent: '#6D28D9',
      mapAccentSoft: 'rgba(109, 40, 217, 0.16)',
      mapOverlay: 'rgba(109, 40, 217, 0.10)',
      overlay: 'rgba(26, 32, 43, 0.30)',
      glassTint: 'rgba(255, 255, 255, 0.44)',
    },
  },
  tokens: {
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
  },
};
