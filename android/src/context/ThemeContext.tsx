'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light' | 'system';
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
  borderSubtle: '#334155',
  text: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  headerBg: '#090d16',
  tabBarBg: '#070c18',
  tabBarBorder: '#1a2333',
  tabBarActive: '#818cf8',
  tabBarInactive: '#64748b',
  drawerBg: '#090d16',
  inputBg: '#0f172a',
  inputBorder: '#334155',
  primary: '#4f46e5',
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
  inputBorder: '#e2e8f0',
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
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute resolved theme based on current preference and system setting
  const computeResolvedTheme = useCallback((activeTheme: Theme, systemScheme: string | null | undefined): ResolvedTheme => {
    if (activeTheme === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
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
        const loadedTheme = (saved && validThemes.includes(saved)) ? (saved as Theme) : 'dark';

        setThemeState(loadedTheme);
        applyTheme(loadedTheme);
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
        applyTheme('dark');
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
    const themes: Theme[] = ['light', 'dark'];
    const currentIndex = themes.indexOf(theme === 'system' ? resolvedTheme : theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, resolvedTheme, setTheme]);

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, colors, setTheme, toggleTheme }}>
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

