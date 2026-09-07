'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'das_crm_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute resolved theme based on current preference and system setting
  const computeResolvedTheme = useCallback((activeTheme: Theme, systemScheme: string | null): ResolvedTheme => {
    if (activeTheme === 'system') {
      return (systemScheme === 'dark') ? 'dark' : 'light';
    }
    return activeTheme;
  }, []);

  // Apply theme to root styles and update resolved theme
  const applyTheme = useCallback((activeTheme: Theme) => {
    const computed = computeResolvedTheme(activeTheme, systemColorScheme);
    setResolvedTheme(computed);
  }, [computeResolvedTheme, systemColorScheme]);

  // Load saved theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const validThemes = ['light', 'dark', 'system'];
        const loadedTheme = (saved && validThemes.includes(saved)) ? (saved as Theme) : 'system';

        setThemeState(loadedTheme);
        applyTheme(loadedTheme);
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
        applyTheme('system');
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [applyTheme]);

  // React to system color scheme changes when theme is 'system'
  useEffect(() => {
    if (theme === 'system') {
      applyTheme('system');
    }
  }, [systemColorScheme, theme, applyTheme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
      setThemeState(newTheme);
      applyTheme(newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'system', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
