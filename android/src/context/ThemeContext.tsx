'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemePalette {
  isDark: boolean;
  bg: string;              // Main screen background
  cardBg: string;          // Card container
  cardBgElevated: string;  // Elevated/inner container
  border: string;          // Default border
  borderSubtle: string;    // Secondary/subtle border
  text: string;            // High-contrast primary text
  textSecondary: string;   // Secondary text
  textMuted: string;       // Muted labels
  headerBg: string;        // Top app header background
  tabBarBg: string;        // Bottom tab bar background
  tabBarBorder: string;    // Bottom tab bar border
  tabBarActive: string;    // Active tab text / icon color
  tabBarInactive: string;  // Inactive tab text / icon color
  drawerBg: string;        // Drawer background
  inputBg: string;         // Search/Form inputs background
  inputBorder: string;     // Search/Form inputs border
  primary: string;         // Primary accent (Indigo)
  primaryLight: string;    // Light tint of primary
  danger: string;          // Red alert / logout
  success: string;         // Green status
  warning: string;         // Amber
}

export const DARK_THEME: ThemePalette = {
  isDark: true,
  bg: '#090d16',
  cardBg: '#0f172a',
  cardBgElevated: '#1e293b',
  border: '#1e293b',
  borderSubtle: '#141e33',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  headerBg: '#090d16',
  tabBarBg: '#0b1120',
  tabBarBorder: '#1e293b',
  tabBarActive: '#6366f1',
  tabBarInactive: '#64748b',
  drawerBg: '#0b1120',
  inputBg: '#131d31',
  inputBorder: '#1e293b',
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export const LIGHT_THEME: ThemePalette = {
  isDark: false,
  bg: '#f8fafc',
  cardBg: '#ffffff',
  cardBgElevated: '#f1f5f9',
  border: '#e2e8f0',
  borderSubtle: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e8f0',
  tabBarActive: '#4f46e5',
  tabBarInactive: '#94a3b8',
  drawerBg: '#ffffff',
  inputBg: '#f8fafc',
  inputBorder: '#cbd5e1',
  primary: '#4f46e5',
  primaryLight: 'rgba(79, 70, 229, 0.1)',
  danger: '#dc2626',
  success: '#059669',
  warning: '#d97706',
};

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: ThemePalette;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'das_crm_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const loadedTheme: Theme = saved === 'light' ? 'light' : 'dark';
        setThemeState(loadedTheme);
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      const validated: Theme = newTheme === 'light' ? 'light' : 'dark';
      await AsyncStorage.setItem(STORAGE_KEY, validated);
      setThemeState(validated);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, isDark, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      resolvedTheme: 'dark',
      isDark: true,
      colors: DARK_THEME,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

