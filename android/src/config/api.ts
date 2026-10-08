/**
 * api.ts — Dynamic Enterprise Cloud & Local API Endpoint Config for Android & iOS
 * 
 * Multi-Tier Endpoint Resolution & Fast-Race Discovery:
 * 1. Persisted custom enterprise gateway from AsyncStorage (@das_crm_active_api_base)
 * 2. Explicit EXPO_PUBLIC_API_URL environment variable
 * 3. Dynamic Expo Metro Bundler host IP (http://${expoHostIp}:3001/api/v1)
 * 4. Android Studio Emulator loopback (http://10.0.2.2:3001/api/v1)
 * 5. Localhost & 127.0.0.1 (http://localhost:3001/api/v1)
 * 6. Local Wi-Fi Network LAN IP (http://192.168.29.26:3001/api/v1)
 * 7. High-availability Cloud Production Endpoint (https://dascrm-backend.onrender.com/api/v1)
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
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_CLOUD_API_URL;
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

export const DEFAULT_CLOUD_API_URL = 'https://dascrm-backend.onrender.com/api/v1';
export const CURRENT_LAN_API_URL = 'http://192.168.29.26:3001/api/v1';
export const EMULATOR_API_URL = 'http://10.0.2.2:3001/api/v1';
export const LOCALHOST_API_URL = 'http://localhost:3001/api/v1';
export const PROD_CLOUD_API_URL = process.env.EXPO_PUBLIC_API_URL ? normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) : DEFAULT_CLOUD_API_URL;

/**
 * Returns prioritized list of backend URLs to probe
 */
export function getCandidateApiUrls(): string[] {
  const candidates: string[] = [];

  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL));
  }

  // 2. Previously saved active API base from AsyncStorage
  if (API_BASE && typeof API_BASE === 'string' && API_BASE.startsWith('http')) {
    candidates.push(normalizeApiUrl(API_BASE));
  }

  // 3. Dynamic host IP from Expo Metro bundler
  const expoIp = getExpoHostIp();
  if (expoIp) {
    candidates.push(`http://${expoIp}:3001/api/v1`);
  }

  // 4. Current host machine Wi-Fi LAN IP (Primary for real physical devices on local network)
  candidates.push(CURRENT_LAN_API_URL);

  // 5. Android Emulator loopback IP (10.0.2.2 maps to host 127.0.0.1 on Android virtual devices)
  if (Platform.OS === 'android') {
    candidates.push(EMULATOR_API_URL);
  }

  // 6. Localhost & 127.0.0.1 (Web, iOS Simulator, Desktop)
  candidates.push(LOCALHOST_API_URL);
  candidates.push('http://127.0.0.1:3001/api/v1');

  // 7. Enterprise Cloud Production Endpoints
  candidates.push(DEFAULT_CLOUD_API_URL);

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
  if (!url || typeof url !== 'string') return;
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
export async function testApiEndpoint(
  url: string,
  timeoutMs = 2500
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const normalized = normalizeApiUrl(url);
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // 1. Try /health
    let res = await fetch(`${normalized}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).catch(() => null);

    // 2. Fallback check: public auth endpoint /auth/public-companies
    if (!res || !res.ok) {
      res = await fetch(`${normalized}/auth/public-companies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    // Any HTTP response (including 200, 401, 403, 404) indicates that the server is reachable
    if (res && (res.ok || res.status < 500)) {
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    }
    return { success: false, latencyMs: Date.now() - start, error: `HTTP ${res?.status || 'No Response'}` };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, error: err?.message || 'Connection Timed Out' };
  }
}

/**
 * Fast-race concurrent probe across all candidate endpoints.
 * Resolves as soon as the FIRST active backend responds in parallel (< 200ms).
 */
export async function findFastestReachableEndpoint(timeoutMs = 2500): Promise<string | null> {
  const candidates = getCandidateApiUrls();
  if (!candidates || candidates.length === 0) return null;

  // 1. First test currently active API_BASE with very short timeout
  const currentActiveTest = await testApiEndpoint(API_BASE, 1200);
  if (currentActiveTest.success) {
    return API_BASE;
  }

  // 2. Race remaining candidate endpoints concurrently in parallel
  const racePromises = candidates.map(async (candidateUrl) => {
    const result = await testApiEndpoint(candidateUrl, timeoutMs);
    if (result.success) {
      return candidateUrl;
    }
    throw new Error(`Unreachable: ${candidateUrl}`);
  });

  try {
    const fastest = await Promise.any(racePromises);
    if (fastest) {
      setApiBase(fastest);
      return fastest;
    }
  } catch (_) {
    // All candidates failed reachability test
  }
  return null;
}

/**
 * Automatically probe candidate URLs and select the working one
 */
export async function probeAndSetWorkingApiBase(): Promise<string | null> {
  return findFastestReachableEndpoint(2500);
}

// Hydrate saved working API_BASE on app startup
try {
  AsyncStorage.getItem(STORAGE_KEY_API_BASE).then((saved) => {
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
      API_BASE = normalizeApiUrl(saved);
    }
  }).catch(() => {});
} catch (_) {}
