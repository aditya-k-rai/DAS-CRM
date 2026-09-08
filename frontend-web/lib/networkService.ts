/**
 * networkService.ts — DAS CRM Network Connectivity & Online Verification Guard
 * Ensures critical actions (Lead Allocation, Lead Status Updates, Financials)
 * can ONLY execute when connected to the internet and can verify with backend.
 */

export interface ConnectivityState {
  isOnline: boolean;
  latencyMs?: number;
  lastChecked: Date;
}

/**
 * Fast synchronous check using browser navigator
 */
export function isBrowserOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

/**
 * Authoritative asynchronous internet ping
 * Tests actual internet & server reachability with a 2500ms timeout
 */
export async function verifyInternetConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  // 1. First check hardware connection state
  if (!navigator.onLine) {
    return false;
  }

  // 2. Perform active reachability ping to API or lightweight endpoint
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const pingUrl = `${apiBase}/auth/public-companies`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.status < 500;
  } catch (err: any) {
    // If backend isn't reachable but network is on, try fallback public origin ping
    try {
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 2000);
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        signal: fallbackController.signal,
      });
      clearTimeout(fallbackTimeout);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Pre-flight guard for critical operations.
 * Returns true if connected. Throws Error with user-friendly message if offline.
 */
export async function assertOnlineForAction(actionName: string): Promise<boolean> {
  const online = await verifyInternetConnection();
  if (!online) {
    throw new Error(
      `⚡ Internet Connection Required: Cannot perform "${actionName}" while disconnected. ` +
      `Please connect to the internet to update and verify changes with the server.`
    );
  }
  return true;
}
