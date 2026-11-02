import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { getApiBase } from '../config/api';

export default function BackendActiveToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Backend Refreshed & Active');
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const lastTimestampRef = useRef<number>(0);
  const hideTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: Platform.OS === 'ios' ? 44 : 20,
      useNativeDriver: true,
      bounciness: 6,
      speed: 12,
    }).start();

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3800);
  };

  useEffect(() => {
    const checkBackendRefresh = async () => {
      try {
        const base = getApiBase();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${base}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => null);
          const currentTimestamp = data?.lastRefreshedAt || Date.now();

          // If the backend timestamp has updated since our last check, show toast
          if (lastTimestampRef.current !== 0 && currentTimestamp > lastTimestampRef.current) {
            showToast(data?.message || 'Backend Refreshed & Active');
          }
          lastTimestampRef.current = currentTimestamp;
        }
      } catch (_) {}
    };

    // Initial check after 4s
    const initTimer = setTimeout(checkBackendRefresh, 4000);
    // Recurring check every 30s
    const interval = setInterval(checkBackendRefresh, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <View style={styles.dotContainer}>
          <View style={styles.dotPing} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.messageText}>{message}</Text>
        <TouchableOpacity
          onPress={() => {
            Animated.timing(slideAnim, {
              toValue: -80,
              duration: 200,
              useNativeDriver: true,
            }).start(() => setVisible(false));
          }}
          activeOpacity={0.7}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  dotContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotPing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    paddingLeft: 4,
    paddingRight: 2,
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
});

