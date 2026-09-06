/**
 * ModernAlertModal.tsx — DAS CRM Android
 * High-performance, 60fps hardware-accelerated animated glassmorphic popup.
 * Replaces standard Android native Alert dialogs with modern, thumb-friendly
 * cyber-enterprise cards, contextual glowing icons, and smart telemetry chips.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { ModernAlert, ModernAlertConfig } from '../services/modernAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MAX_WIDTH = Math.min(SCREEN_WIDTH - 36, 400);

export const ModernAlertModal: React.FC = () => {
  const [config, setConfig] = useState<ModernAlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  // 60fps Hardware-Accelerated Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const translateYAnim = useRef(new Animated.Value(18)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.88);
    translateYAnim.setValue(18);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6.5,
        tension: 75,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  const animateOut = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.93,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      if (onComplete) onComplete();
    });
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    const unsubscribe = ModernAlert.registerListener((newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
        setVisible(true);
        animateIn();
      } else {
        animateOut();
      }
    });

    return unsubscribe;
  }, [animateIn, animateOut]);

  if (!visible || !config) return null;

  const handleButtonPress = (btnPress?: () => void) => {
    animateOut(() => {
      if (btnPress) btnPress();
    });
  };

  const handleBackdropPress = () => {
    // If options specify cancelable: false, do not dismiss on backdrop tap
    if (config.options?.cancelable === false) return;

    // Trigger cancel callback if available
    const cancelBtn = config.buttons.find(b => b.style === 'cancel');
    animateOut(() => {
      if (cancelBtn?.onPress) {
        cancelBtn.onPress();
      } else if (config.options?.onDismiss) {
        config.options.onDismiss();
      }
    });
  };

  const accentColor = config.accentColor || '#6366f1';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlayContainer}>
        {/* Animated Dark Frosted Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        {/* Animated Dialog Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              borderColor: accentColor,
              shadowColor: accentColor,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          {/* Top Ambient Glow Pill */}
          <View style={[styles.topGlowPill, { backgroundColor: accentColor }]} />

          {/* Header Row with Icon Badge and Category */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: `${accentColor}18`,
                  borderColor: `${accentColor}40`,
                },
              ]}
            >
              <Text style={styles.iconText}>{config.icon || '⚡'}</Text>
            </View>

            <View style={{ flex: 1 }}>
              {config.badgeText && (
                <View
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: `${accentColor}14`,
                      borderColor: `${accentColor}35`,
                    },
                  ]}
                >
                  <Text style={[styles.categoryPillText, { color: accentColor }]}>
                    {config.badgeText}
                  </Text>
                </View>
              )}
              <Text style={styles.titleText} numberOfLines={2}>
                {config.title}
              </Text>
            </View>
          </View>

          {/* Body Message */}
          {!!config.message && (
            <Text style={styles.messageText}>{config.message}</Text>
          )}

          {/* Quota Progress Bar Widget (For Quota Exceeded alerts) */}
          {config.quotaInfo && (
            <View style={styles.quotaBox}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaLabel}>Plan Allocation Limit</Text>
                <Text style={[styles.quotaValue, { color: accentColor }]}>
                  {config.quotaInfo.used} / {config.quotaInfo.total} Seats (100% Used)
                </Text>
              </View>
              <View style={styles.quotaTrack}>
                <View
                  style={[
                    styles.quotaFill,
                    { width: '100%', backgroundColor: accentColor },
                  ]}
                />
              </View>
              <Text style={styles.quotaHint}>
                ⚡ All organization seats currently occupied. Upgrade to unlock seats.
              </Text>
            </View>
          )}

          {/* Structured Telemetry Chips (For Webhooks, API and Sync alerts) */}
          {config.telemetryItems && config.telemetryItems.length > 0 && (
            <View style={styles.telemetryBox}>
              {config.telemetryItems.map((item) => (
                <View key={item.id} style={styles.telemetryRow}>
                  <View
                    style={[
                      styles.telemetryDot,
                      { backgroundColor: item.statusDotColor || '#38bdf8' },
                    ]}
                  />
                  <Text style={styles.telemetryLabel}>{item.label}</Text>
                  {item.value ? (
                    <Text
                      style={[
                        styles.telemetryValue,
                        { color: item.statusDotColor || '#38bdf8' },
                      ]}
                    >
                      {item.value}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={[styles.buttonsRow, config.buttons.length > 2 && styles.buttonsColumn]}>
            {config.buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive;

              let btnBg = accentColor;
              let btnBorder = `${accentColor}80`;
              let btnTextColor = '#ffffff';

              if (isCancel) {
                btnBg = '#162032';
                btnBorder = '#25344d';
                btnTextColor = '#cbd5e1';
              } else if (isDestructive) {
                btnBg = '#dc2626';
                btnBorder = '#ef4444';
                btnTextColor = '#ffffff';
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                    },
                    config.buttons.length === 2 && { flex: 1 },
                    isPrimary && styles.primaryButtonShadow,
                  ]}
                  onPress={() => handleButtonPress(btn.onPress)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: btnTextColor },
                      (isPrimary || isDestructive) && { fontWeight: '900' },
                    ]}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: '#0c1322',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  topGlowPill: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  messageText: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Quota Visualization
  quotaBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  quotaValue: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  quotaTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  quotaFill: {
    height: '100%',
    borderRadius: 3,
  },
  quotaHint: {
    fontSize: 9.5,
    color: '#fbbf24',
    fontWeight: '600',
  },

  // Telemetry Visualization
  telemetryBox: {
    backgroundColor: '#070d18',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  telemetryLabel: {
    flex: 1,
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  telemetryValue: {
    fontSize: 11.5,
    fontWeight: '900',
  },

  // Action Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
