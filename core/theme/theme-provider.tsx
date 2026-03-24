import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAppStore } from '@/core/store/app-store';
import { createAppTheme } from '@/core/theme/create-theme';
import { AppTheme, ThemeMode, ThemePreference } from '@/core/theme/types';

type ThemeContextValue = {
  theme: AppTheme;
  preference: ThemePreference;
  resolvedMode: ThemeMode;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolveMode = (preference: ThemePreference, systemScheme: 'light' | 'dark' | null | undefined): ThemeMode => {
  if (preference === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }

  return preference;
};

export function AppThemeProvider({ children }: PropsWithChildren) {
  const preference = useAppStore((state) => state.themePreference);
  const setPreference = useAppStore((state) => state.setThemePreference);
  const systemScheme = useColorScheme();

  const resolvedMode = resolveMode(preference, systemScheme);
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      resolvedMode,
      setPreference,
    }),
    [theme, preference, resolvedMode, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
};
