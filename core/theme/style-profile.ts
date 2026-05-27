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
      background: '#111114',
      surface: '#191B1E',
      surfaceElevated: '#2A2D33',
      card: '#191B1E',
      border: '#3A3C40',
      textPrimary: '#F0F0F0',
      textSecondary: '#F0F0F0',
      textMuted: '#6F7072',
      accent: '#F0F0F0',
      accentSoft: '#6F7072',
      success: '#F0F0F0',
      warning: '#6F7072',
      danger: '#F0F0F0',
      info: '#F0F0F0',
      mapAccent: '#8B5CF6',
      mapAccentSoft: 'rgba(139, 92, 246, 0.24)',
      friendEventAccent: '#F2C94C',
      friendEventAccentSoft: 'rgba(242, 201, 76, 0.32)',
      todayAccent: '#D97706',
      tomorrowAccent: '#2DD4BF',
      weekAccent: '#8B5CF6',
      floatingTabBackground: 'rgba(17, 17, 20, 0.92)',
      mapOverlay: 'rgba(76, 29, 149, 0.16)',
      overlay: 'rgba(17, 17, 20, 0.70)',
      glassTint: 'rgba(240, 240, 240, 0.10)',
    },
    light: {
      background: '#F0F0F0',
      surface: '#F0F0F0',
      surfaceElevated: '#F0F0F0',
      card: '#F0F0F0',
      border: '#6F7072',
      textPrimary: '#111114',
      textSecondary: '#2A2D33',
      textMuted: '#6F7072',
      accent: '#111114',
      accentSoft: '#3A3C40',
      success: '#2A2D33',
      warning: '#6F7072',
      danger: '#111114',
      info: '#2A2D33',
      mapAccent: '#6D28D9',
      mapAccentSoft: 'rgba(109, 40, 217, 0.16)',
      friendEventAccent: '#B7791F',
      friendEventAccentSoft: 'rgba(183, 121, 31, 0.22)',
      todayAccent: '#B45309',
      tomorrowAccent: '#0F766E',
      weekAccent: '#6D28D9',
      floatingTabBackground: 'rgba(17, 17, 20, 0.90)',
      mapOverlay: 'rgba(109, 40, 217, 0.10)',
      overlay: 'rgba(17, 17, 20, 0.34)',
      glassTint: 'rgba(240, 240, 240, 0.55)',
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
      display: { fontFamily: 'Lexend_800ExtraBold', fontSize: 36, lineHeight: 42, fontWeight: '800' },
      title: { fontFamily: 'Lexend_800ExtraBold', fontSize: 30, lineHeight: 36, fontWeight: '800' },
      headline: { fontFamily: 'Lexend_700Bold', fontSize: 22, lineHeight: 28, fontWeight: '700' },
      body: { fontFamily: 'Lexend_400Regular', fontSize: 16, lineHeight: 24, fontWeight: '400' },
      bodyStrong: { fontFamily: 'Lexend_600SemiBold', fontSize: 16, lineHeight: 24, fontWeight: '600' },
      label: { fontFamily: 'Lexend_600SemiBold', fontSize: 13, lineHeight: 18, fontWeight: '600' },
      caption: { fontFamily: 'Lexend_500Medium', fontSize: 13, lineHeight: 18, fontWeight: '500' },
    },
    shadow: {
      card: {
        shadowColor: '#111114',
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
