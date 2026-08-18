/**
 * api.ts — Dynamic API Endpoint Config for Android & iOS
 * Correctly resolves Android loopback (10.0.2.2) when running on emulator.
 */

import { Platform } from 'react-native';

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // Android emulator loops back to host machine at 10.0.2.2
    return 'http://10.0.2.2:3001/api/v1';
  }
  // iOS simulator / Web / Default
  return 'http://localhost:3001/api/v1';
};

export const API_BASE = getApiBaseUrl();
