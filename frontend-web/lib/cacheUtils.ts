/**
 * cacheUtils.ts
 * Provides persistent client-side caching using localStorage to prevent redundant API calls
 * when navigating between dashboard tabs. It also supports cache invalidation and updates.
 */

export const getCachedData = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`das_crm_cache_${key}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return parsed.data as T;
    } catch {
      return null;
    }
  }
  return null;
};

export const setCachedData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `das_crm_cache_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.warn(`Failed to set cache for ${key}:`, error);
  }
};

export const invalidateCache = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`das_crm_cache_${key}`);
};

export const clearAllDashboardCaches = (): void => {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('das_crm_cache_')) {
      localStorage.removeItem(key);
    }
  });
};
