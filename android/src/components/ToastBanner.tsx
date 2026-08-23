/**
 * ToastBanner.tsx — DAS CRM Android
 * Premium Dark Glassmorphism Floating Toast Feedback Notification Banner.
 * Replaces plain OS system alerts with animated, glowing feedback popups.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';

export interface ToastConfig {
  id: string;
  title: string;
  message: string;
  type?: 'SUCCESS' | 'INFO' | 'WARNING' | 'COPY';
}

interface Props {
  toast: ToastConfig | null;
  onDismiss: () => void;
}

export default function ToastBanner({ toast, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const getTypeStyle = () => {
    switch (toast.type) {
      case 'SUCCESS':
        return { border: '#34d399', bg: 'rgba(52,211,153,0.18)', badgeText: '#34d399', defaultIcon: '✅' };
      case 'WARNING':
        return { border: '#fbbf24', bg: 'rgba(251,191,36,0.18)', badgeText: '#fbbf24', defaultIcon: '⚠️' };
      case 'COPY':
        return { border: '#38bdf8', bg: 'rgba(56,189,248,0.18)', badgeText: '#38bdf8', defaultIcon: '📋' };
      default:
        return { border: '#818cf8', bg: 'rgba(99,102,241,0.18)', badgeText: '#818cf8', defaultIcon: '⚡' };
    }
  };

  const style = getTypeStyle();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity,
          borderColor: style.border,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handleClose} style={styles.toastCard}>
        <View style={[styles.iconBadge, { backgroundColor: style.bg, borderColor: style.border }]}>
          <Text style={{ fontSize: 16 }}>{style.defaultIcon}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.titleText, { color: style.badgeText }]}>{toast.title}</Text>
          <Text style={styles.messageText}>{toast.message}</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 1,
  },
  messageText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '900',
  },
});
