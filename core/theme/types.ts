export type ThemeMode = 'light' | 'dark';

export type ThemePreference = 'system' | ThemeMode;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  mapAccent: string;
  mapAccentSoft: string;
  friendEventAccent: string;
  friendEventAccentSoft: string;
  mapOverlay: string;
  overlay: string;
  glassTint: string;
};

export type TypographyScale = {
  display: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '700' | '800' };
  title: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '700' | '800' };
  headline: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '600' | '700' };
  body: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '400' | '500' };
  bodyStrong: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '600' };
  label: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '600' };
  caption: { fontFamily?: string; fontSize: number; lineHeight: number; fontWeight: '400' | '500' };
};

export type DesignTokens = {
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: TypographyScale;
  shadow: {
    card: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
  iconSize: {
    sm: number;
    md: number;
    lg: number;
  };
  zIndex: {
    base: number;
    header: number;
    tabBar: number;
    modal: number;
  };
  motion: {
    fast: number;
    normal: number;
    slow: number;
    pressScale: number;
  };
};

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  tokens: DesignTokens;
};
