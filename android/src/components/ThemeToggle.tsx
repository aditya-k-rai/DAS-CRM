import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  style?: object;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'system', label: 'System', icon: '⚙️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
  ];

  const isDarkMode = theme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(30, 33, 48, 0.8)' : 'rgba(241, 245, 249, 0.8)',
          borderColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.6)',
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        const activeColor = isDarkMode ? '#6366f1' : '#4f46e5';
        const inactiveColor = isDarkMode ? 'rgba(100, 116, 139, 0.7)' : 'rgba(71, 85, 105, 0.7)';

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setTheme(opt.value)}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? activeColor : 'transparent',
              },
            ]}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? '#ffffff' : inactiveColor,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
