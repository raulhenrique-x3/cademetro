import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const saved = storage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
      setThemeModeState(saved);
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    storage.setItem(THEME_KEY, mode);
  };

  const toggleTheme = () => {
    const next: ThemeMode = colorScheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const colorScheme: EffectiveColorScheme = useMemo(() => {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const value = useMemo(
    () => ({
      themeMode,
      colorScheme,
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, colorScheme, colors],
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
