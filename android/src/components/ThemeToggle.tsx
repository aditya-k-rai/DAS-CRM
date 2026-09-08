import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  style?: object;
  compact?: boolean;
}

export function ThemeToggle({ style, compact = false }: ThemeToggleProps) {
  const { theme, setTheme, colors, isDark } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System sync', icon: '⚙️' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBgElevated,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        const activeColor = colors.primary;
        const inactiveColor = colors.textSecondary;

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setTheme(opt.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Theme option: ${opt.label}`}
            style={[
              styles.button,
              compact && styles.buttonCompact,
              {
                backgroundColor: isActive ? activeColor : 'transparent',
              },
            ]}
          >
            <Text style={[styles.icon, compact && styles.iconCompact]}>{opt.icon}</Text>
            {!compact && (
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? '#ffffff' : inactiveColor,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {opt.label}
              </Text>
            )}
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
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    minHeight: 38,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 9,
    gap: 5,
  },
  buttonCompact: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 0,
  },
  icon: {
    fontSize: 13,
  },
  iconCompact: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
