/**
 * api.ts — Dynamic Multi-Tier API Endpoint Config for Android, iOS & Physical Devices
 * 
 * Auto-resolves:
 * 1. Explicit EXPO_PUBLIC_API_URL environment variable
 * 2. Dynamic host IP from Expo Metro bundler connection (Constants.expoConfig.hostUri)
 * 3. Developer machine LAN IP (192.168.29.26:3001) for physical test devices
 * 4. Android emulator loopback (10.0.2.2:3001)
 * 5. Localhost / 127.0.0.1 for Web and iOS simulators
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_API_BASE = '@das_crm_active_api_base';

/**
 * Extract host IP from Expo Metro debugger/bundler connection.
 * On physical devices connected via Expo Go or dev builds, Constants.expoConfig?.hostUri
 * or debuggerHost contains "<DEVELOPER_LAN_IP>:<METRO_PORT>" (e.g. "192.168.29.26:8081").
 */
export function getExpoHostIp(): string | null {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).expoGoConfig?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (hostUri && typeof hostUri === 'string') {
      const parts = hostUri.split(':');
      const ip = parts[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Normalizes an API base URL ensuring standard /api/v1 suffix without trailing slashes.
 */
export function normalizeApiUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

/**
 * Returns prioritized list of candidate backend URLs to test
 */
export function getCandidateApiUrls(): string[] {
  const candidates: string[] = [];

  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL));
  }

  // 2. Dynamic host IP from Expo bundler (auto-detected when running on physical device)
  const expoIp = getExpoHostIp();
  if (expoIp) {
    candidates.push(`http://${expoIp}:3001/api/v1`);
  }

  // 3. Known developer machine LAN IP
  candidates.push('http://192.168.29.26:3001/api/v1');

  // 4. Android emulator loopback (10.0.2.2)
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:3001/api/v1');
  }

  // 5. Localhost fallback
  candidates.push('http://localhost:3001/api/v1');
  candidates.push('http://127.0.0.1:3001/api/v1');

  // Deduplicate preserving priority order
  return Array.from(new Set(candidates));
}

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }
  const expoIp = getExpoHostIp();
  if (expoIp) {
    return `http://${expoIp}:3001/api/v1`;
  }
  if (Platform.OS === 'android') {
    // Default to developer LAN IP so physical devices work out-of-the-box
    return 'http://192.168.29.26:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

export let API_BASE: string = getApiBaseUrl();

export function setApiBase(url: string) {
  const normalized = normalizeApiUrl(url);
  API_BASE = normalized;
  try {
    AsyncStorage.setItem(STORAGE_KEY_API_BASE, normalized).catch(() => {});
  } catch (_) {}
}

export function getApiBase(): string {
  return API_BASE;
}

// Hydrate saved working API_BASE on app startup
try {
  AsyncStorage.getItem(STORAGE_KEY_API_BASE).then((saved) => {
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
      API_BASE = normalizeApiUrl(saved);
    }
  }).catch(() => {});
} catch (_) {}
