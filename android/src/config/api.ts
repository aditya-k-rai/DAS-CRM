/**
 * api.ts — Dynamic Multi-Tier API Endpoint Config for Android, iOS & Physical Devices
 * 
 * Auto-resolves and probes:
 * 1. Previously saved working API base from AsyncStorage (persisted across restarts)
 * 2. Explicit EXPO_PUBLIC_API_URL environment variable
 * 3. Dynamic host IP from Expo Metro bundler connection (Constants.expoConfig.hostUri)
 * 4. Active local LAN IP (192.168.29.26:3001) for physical test devices on Wi-Fi
 * 5. Android emulator loopback (10.0.2.2:3001)
 * 6. Localhost / 127.0.0.1 for Web and iOS simulators
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_API_BASE = '@das_crm_active_api_base';

/**
 * Extract host IP from Expo Metro debugger/bundler connection.
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

export const PROD_CLOUD_API_URL = 'https://dascrm-backend.onrender.com/api/v1';
export const ALT_PROD_CLOUD_API_URL = 'https://nexcrm-backend.onrender.com/api/v1';

/**
 * Returns prioritized list of candidate backend URLs to test
 */
export function getCandidateApiUrls(): string[] {
  const candidates: string[] = [];

  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL));
  }

  // 2. Previously saved working API base from AsyncStorage
  if (API_BASE && typeof API_BASE === 'string' && API_BASE.startsWith('http')) {
    candidates.push(normalizeApiUrl(API_BASE));
  }

  // 3. Live Cloud Production Endpoints (works everywhere: LTE, 4G, 5G, Wi-Fi)
  candidates.push(PROD_CLOUD_API_URL);
  candidates.push(ALT_PROD_CLOUD_API_URL);

  // 4. Dynamic host IP from Expo bundler (auto-detected when running via Expo Metro)
  const expoIp = getExpoHostIp();
  if (expoIp) {
    candidates.push(`http://${expoIp}:3001/api/v1`);
  }

  // 5. Active local LAN IP for physical device on Wi-Fi (Developer PC)
  candidates.push('http://192.168.1.38:3001/api/v1');
  candidates.push('http://192.168.29.26:3001/api/v1');

  // 6. Android emulator loopback (10.0.2.2)
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:3001/api/v1');
  }

  // 7. Localhost fallback
  candidates.push('http://localhost:3001/api/v1');
  candidates.push('http://127.0.0.1:3001/api/v1');

  // Deduplicate preserving priority order
  return Array.from(new Set(candidates));
}

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }
  // In production standalone builds, default to the live cloud production server
  if (!__DEV__) {
    return PROD_CLOUD_API_URL;
  }
  const expoIp = getExpoHostIp();
  if (expoIp) {
    return `http://${expoIp}:3001/api/v1`;
  }
  return 'http://192.168.1.38:3001/api/v1';
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

/**
 * Ping an endpoint to check reachability and measure latency in milliseconds
 */
export async function testApiEndpoint(url: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const normalized = normalizeApiUrl(url);
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // 1. Try /api/v1/health
    let res = await fetch(`${normalized}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).catch(() => null);

    // 2. Try /health at root
    if (!res || !res.ok) {
      const rootUrl = normalized.replace(/\/api\/v1$/, '');
      res = await fetch(`${rootUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).catch(() => null);
    }

    // 3. Fallback check: public auth endpoint /api/v1/auth/plan-definitions
    if (!res || !res.ok) {
      res = await fetch(`${normalized}/auth/plan-definitions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    // Any response from the server (even 401 for auth routes) indicates network reachability
    if (res && (res.ok || res.status === 401 || res.status === 403)) {
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    }
    return { success: false, latencyMs: Date.now() - start, error: `HTTP ${res?.status || 'No Response'}` };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, error: err?.message || 'Connection Timed Out' };
  }
}

/**
 * Automatically probe all candidate URLs and select the first working one
 */
export async function probeAndSetWorkingApiBase(): Promise<string | null> {
  const candidates = getCandidateApiUrls();
  for (const candidate of candidates) {
    const test = await testApiEndpoint(candidate);
    if (test.success) {
      setApiBase(candidate);
      return candidate;
    }
  }
  return null;
}

// Hydrate saved working API_BASE on app startup
try {
  AsyncStorage.getItem(STORAGE_KEY_API_BASE).then((saved) => {
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
      API_BASE = normalizeApiUrl(saved);
    }
  }).catch(() => {});
} catch (_) {}
