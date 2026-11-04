import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  style?: object;
  compact?: boolean;
}

export function ThemeToggle({ style, compact = false }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme, colors, isDark } = useTheme();

  // 0 = Light (☀️), 1 = Dark (🌙)
  const thumbAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: isDark ? 1 : 0,
      tension: 70,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isDark, thumbAnim]);

  if (compact) {
    // Smooth sliding pill switch with prominent Sun (☀️) and Moon (🌙)
    const translateX = thumbAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 34],
    });

    const sunScale = thumbAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1.15, 0.82],
    });

    const sunOpacity = thumbAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.42],
    });

    const moonScale = thumbAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.82, 1.15],
    });

    const moonOpacity = thumbAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.42, 1],
    });

    return (
      <View
        style={[
          styles.compactTrack,
          {
            backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
            borderColor: isDark ? '#334155' : '#cbd5e1',
          },
          style,
        ]}
      >
        {/* Animated Sliding Thumb */}
        <Animated.View
          style={[
            styles.compactThumb,
            {
              backgroundColor: isDark ? '#4f46e5' : '#ffffff',
              borderColor: isDark ? '#6366f1' : '#cbd5e1',
              transform: [{ translateX }],
            },
          ]}
        />

        {/* Sun (Light) Touchable Zone */}
        <TouchableOpacity
          onPress={() => setTheme('light')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Switch to Light mode (☀️)"
          style={styles.compactSlot}
        >
          <Animated.View style={{ transform: [{ scale: sunScale }], opacity: sunOpacity }}>
            <Text style={styles.compactIcon}>☀️</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Moon (Dark) Touchable Zone */}
        <TouchableOpacity
          onPress={() => setTheme('dark')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Switch to Dark mode (🌙)"
          style={styles.compactSlot}
        >
          <Animated.View style={{ transform: [{ scale: moonScale }], opacity: moonOpacity }}>
            <Text style={styles.compactIcon}>🌙</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }

  // Expanded segment mode for full-width cards or settings panels
  return (
    <View
      style={[
        styles.expandedContainer,
        {
          backgroundColor: colors.cardBgElevated,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={() => setTheme('light')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Theme option: Light Mode"
        style={[
          styles.expandedButton,
          {
            backgroundColor: !isDark ? colors.primary : 'transparent',
            borderColor: !isDark ? colors.primary : 'transparent',
          },
        ]}
      >
        <Text style={styles.expandedIcon}>☀️</Text>
        <Text
          style={[
            styles.expandedLabel,
            {
              color: !isDark ? '#ffffff' : colors.textSecondary,
              fontWeight: !isDark ? '800' : '600',
            },
          ]}
        >
          Light
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setTheme('dark')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Theme option: Dark Mode"
        style={[
          styles.expandedButton,
          {
            backgroundColor: isDark ? colors.primary : 'transparent',
            borderColor: isDark ? colors.primary : 'transparent',
          },
        ]}
      >
        <Text style={styles.expandedIcon}>🌙</Text>
        <Text
          style={[
            styles.expandedLabel,
            {
              color: isDark ? '#ffffff' : colors.textSecondary,
              fontWeight: isDark ? '800' : '600',
            },
          ]}
        >
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact switch styles (Header & quick toggles)
  compactTrack: {
    width: 72,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  compactThumb: {
    position: 'absolute',
    top: 1.5,
    left: 2,
    width: 32,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 3,
  },
  compactSlot: {
    width: 33,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  compactIcon: {
    fontSize: 15,
  },

  // Expanded segmented control styles
  expandedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 40,
  },
  expandedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    gap: 6,
  },
  expandedIcon: {
    fontSize: 15,
  },
  expandedLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
