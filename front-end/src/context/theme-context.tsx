import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ColorTokens } from '@/constants/theme';
import { storage, THEME_KEY } from '@/lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type EffectiveColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: EffectiveColorScheme;
  colors: ColorTokens;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = storage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
      return saved;
    }
    return 'system';
  });

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    storage.setItem(THEME_KEY, mode);
  }, []);

  const colorScheme: EffectiveColorScheme = useMemo(() => {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setThemeMode(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setThemeMode]);

  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const value = useMemo(
    () => ({
      themeMode,
      colorScheme,
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, colorScheme, colors, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeContextProvider');
  }
  return context;
}
