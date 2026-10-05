/**
 * Centralized Authenticated API Client for DAS CRM
 * Handles automatic JWT token attachment, 401 Unauthorized interception,
 * transparent token refresh, and retry of failed requests.
 */

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
    const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!isLocal && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return '/api/v1';
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('das_crm_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('das_crm_refresh_token');
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('das_crm_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('das_crm_refresh_token', refreshToken);
  }
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('das_crm_token');
  localStorage.removeItem('das_crm_refresh_token');
}

async function executeRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('das_crm_session_expired'));
      }
      return null;
    }

    const data = await res.json();
    if (data.accessToken) {
      setAuthTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }
  } catch (err) {
    console.warn('[apiClient] Token refresh failed:', err);
  }
  return null;
}

export async function apiFetch(
  urlOrPath: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiBase = getApiBase();
  const fullUrl = urlOrPath.startsWith('http') ? urlOrPath : `${apiBase}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;

  const currentToken = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, { ...options, headers });
  } catch (netErr) {
    throw netErr;
  }

  // Handle 401 Unauthorized with transparent token refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newAccessToken = await executeRefreshToken();
        isRefreshing = false;
        if (newAccessToken) {
          onRefreshed(newAccessToken);
          // Retry current request with new token
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          return fetch(fullUrl, { ...options, headers });
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        return response;
      }
    } else {
      // Another request is already refreshing; queue this retry
      return new Promise<Response>((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          fetch(fullUrl, { ...options, headers }).then(resolve).catch(reject);
        });
      });
    }
  }

  return response;
}
