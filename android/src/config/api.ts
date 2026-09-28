/**
 * api.ts — Dynamic Enterprise Cloud API Endpoint Config for Android & iOS
 * 
 * Multi-Tier Endpoint Resolution:
 * 1. Explicit EXPO_PUBLIC_API_URL environment variable
 * 2. Persisted custom enterprise gateway from AsyncStorage (persisted across app restarts)
 * 3. Dynamic bundler IP in active development mode (__DEV__)
 * 4. High-availability Cloud Production Endpoint (https://dascrm-backend.onrender.com/api/v1)
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

export const CURRENT_LAN_API_URL = 'http://192.168.29.26:3001/api/v1';
export const EMULATOR_API_URL = 'http://10.0.2.2:3001/api/v1';
export const LOCALHOST_API_URL = 'http://localhost:3001/api/v1';
export const PROD_CLOUD_API_URL = process.env.EXPO_PUBLIC_API_URL || CURRENT_LAN_API_URL;

/**
 * Returns prioritized list of production & enterprise backend URLs to probe
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

  // 3. Dynamic host IP from Expo Metro bundler
  const expoIp = getExpoHostIp();
  if (expoIp) {
    candidates.push(`http://${expoIp}:3001/api/v1`);
  }

  // 4. Current host machine Wi-Fi LAN IP (for physical devices over Wi-Fi)
  candidates.push(CURRENT_LAN_API_URL);

  // 5. Android Emulator loopback IP (10.0.2.2 maps to host 127.0.0.1 on Android virtual devices)
  if (Platform.OS === 'android') {
    candidates.push(EMULATOR_API_URL);
  }

  // 6. Localhost & 127.0.0.1 (Web, iOS Simulator, Desktop)
  candidates.push(LOCALHOST_API_URL);
  candidates.push('http://127.0.0.1:3001/api/v1');

  // Deduplicate preserving priority order
  return Array.from(new Set(candidates.filter(Boolean)));
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
    return CURRENT_LAN_API_URL;
  }
  return LOCALHOST_API_URL;
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
