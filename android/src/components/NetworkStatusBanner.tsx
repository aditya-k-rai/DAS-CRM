/**
 * NetworkStatusBanner.tsx — DAS CRM Android
 * A non-intrusive, production-grade network & sync status indicator.
 * Displays subtle online/offline/syncing states without overwhelming the UI.
 * Auto-hides when fully connected and synced; slides in only when needed.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { offlineSyncEngine, SyncEngineState } from '../services/offlineSyncEngine';

interface Props {
  token?: string | null;
}

export default function NetworkStatusBanner({ token }: Props) {
  const [syncState, setSyncState] = useState<SyncEngineState>(offlineSyncEngine.getState());
  const slideY = useRef(new Animated.Value(-52)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const isVisible = useRef(false);
  const dotAnim = useRef<any>(null);

  // Subscribe to sync engine state changes
  useEffect(() => {
    const unsub = offlineSyncEngine.subscribe((state) => {
      setSyncState({ ...state });
    });
    return unsub;
  }, []);

  // Keep engine aware of auth token for queue draining
  useEffect(() => {
    offlineSyncEngine.setAuthToken(token ?? null);
  }, [token]);

  // Drive banner slide in/out based on current state
  useEffect(() => {
    const shouldShow =
      !syncState.isOnline ||
      !syncState.isBackendConnected ||
      syncState.syncStatus === 'SYNCING' ||
      (syncState.pendingCount > 0 && syncState.isBackendConnected) ||
      syncState.syncStatus === 'SYNCED';

    if (shouldShow && !isVisible.current) {
      isVisible.current = true;
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    } else if (!shouldShow && isVisible.current) {
      isVisible.current = false;
      Animated.timing(slideY, {
        toValue: -52,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [syncState]);

  // Pulse dot animation when offline or syncing
  useEffect(() => {
    if (dotAnim.current) {
      dotAnim.current.stop();
    }
    if (!syncState.isOnline || syncState.syncStatus === 'SYNCING') {
      dotAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      dotAnim.current.start();
    } else {
      Animated.timing(dotOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [syncState.isOnline, syncState.syncStatus]);

  const handleManualSync = () => {
    if (syncState.isBackendConnected && syncState.pendingCount > 0) {
      offlineSyncEngine.flushQueue();
    }
  };

  const { dotColor, label, subLabel } = getBannerContent(syncState);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideY }] }]}
      pointerEvents={syncState.pendingCount > 0 && syncState.isBackendConnected ? 'box-none' : 'none'}
    >
      <View style={styles.inner}>
        <Animated.View style={[styles.dot, { backgroundColor: dotColor, opacity: dotOpacity }]} />
        <View style={styles.textBlock}>
          <Text style={styles.label}>{label}</Text>
          {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
        </View>
        {syncState.pendingCount > 0 && syncState.isBackendConnected ? (
          <TouchableOpacity style={styles.syncBtn} onPress={handleManualSync} activeOpacity={0.75}>
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

function getBannerContent(state: SyncEngineState): {
  dotColor: string;
  label: string;
  subLabel?: string;
} {
  if (!state.isOnline) {
    return {
      dotColor: '#ef4444',
      label: '📶 No Internet Connection',
      subLabel: 'Working offline — changes will sync automatically when reconnected',
    };
  }
  if (state.isOnline && !state.isBackendConnected) {
    return {
      dotColor: '#f59e0b',
      label: '⚠️ Server Unreachable',
      subLabel: `${state.pendingCount > 0 ? `${state.pendingCount} change${state.pendingCount !== 1 ? 's' : ''} queued · ` : ''}Working in offline mode`,
    };
  }
  if (state.syncStatus === 'SYNCING') {
    return {
      dotColor: '#6366f1',
      label: '🔄 Syncing changes…',
      subLabel: state.pendingCount > 0 ? `${state.pendingCount} item${state.pendingCount !== 1 ? 's' : ''} remaining` : undefined,
    };
  }
  if (state.pendingCount > 0 && state.isBackendConnected) {
    return {
      dotColor: '#f59e0b',
      label: `${state.pendingCount} unsynced change${state.pendingCount !== 1 ? 's' : ''}`,
      subLabel: 'Tap "Sync Now" to push to server',
    };
  }
  if (state.syncStatus === 'SYNCED') {
    return {
      dotColor: '#10b981',
      label: '✓ All changes synced',
    };
  }
  return { dotColor: '#10b981', label: '🟢 Connected' };
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99,102,241,0.25)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  syncBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
