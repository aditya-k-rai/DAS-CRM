/**
 * cacheUtils.ts
 * Provides persistent client-side caching using localStorage to prevent redundant API calls
 * when navigating between dashboard tabs. It also supports cache invalidation and updates.
 *
 * FIX: Added TTL (time-to-live) support — cache entries older than MAX_AGE_MS are
 * automatically treated as stale and discarded on read.
 */

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedData = <T>(key: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): T | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`das_crm_cache_${key}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Reject stale cache entries
      if (parsed.timestamp && Date.now() - parsed.timestamp > maxAgeMs) {
        localStorage.removeItem(`das_crm_cache_${key}`);
        return null;
      }
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
    if (key.startsWith('das_crm_cache_') || key === 'das_crm_all_leads_cache' || key === 'das_crm_lead_directory_cache') {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Clears all stale caches (older than maxAgeMs) without removing fresh entries.
 * Call on page load / login to prevent accumulation of dead data.
 */
export const clearStaleCaches = (maxAgeMs: number = DEFAULT_MAX_AGE_MS): void => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('das_crm_cache_')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed.timestamp && now - parsed.timestamp > maxAgeMs) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
};
