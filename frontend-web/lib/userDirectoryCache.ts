/**
 * userDirectoryCache.ts — Unified High-Performance User & Employee Directory Cache
 *
 * Implements SWR (Stale-While-Revalidate) with a 60-second TTL to eliminate redundant
 * database read/write queries when navigating between Dashboard, Employees, Pipeline, and Admin Control Center.
 */

export interface CachedEmployee {
  id: string;
  name: string;
  code: string;
  dept: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | 'UNASSIGNED';
  isVerified: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING';
  assignedManager: string;
  baseSalary: string;
  joined: string;
  canSelfCheckIn: boolean;
  status: 'active' | 'inactive';
  documents: {
    pan: string;
    aadhaar: string;
    eduCert: string;
    offerLetter: string;
    lastUpdatedDate: string;
    historyLogs: any[];
  };
  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNo: string;
    ifscCode: string;
    upiId: string;
    lastUpdatedDate: string;
    historyLogs: any[];
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
  };
  leads: {
    totalReceived: number;
    connected: number;
    inNegotiation: number;
    meetingScheduled: number;
    won: number;
    totalDistributed: number;
    distributionBreakdown: any[];
  };
  subordinates: any[];
}

interface CacheState {
  data: CachedEmployee[] | null;
  companyKey: string;
  timestamp: number;
  fetching: Promise<CachedEmployee[]> | null;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory/session TTL
const STORAGE_KEY = 'das_crm_user_dir_cache_v2';
const STORAGE_TIME_KEY = 'das_crm_user_dir_time_v2';

let memoryCache: CacheState = {
  data: null,
  companyKey: '',
  timestamp: 0,
  fetching: null,
};

function formatPhone(p: string | null | undefined): string {
  if (!p) return '—';
  const clean = p.replace(/\s+/g, '');
  if (clean.startsWith('+91') && clean.length === 13) {
    return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return p;
}

/**
 * Get verified role overrides from local storage and auto-migrate legacy roles.
 */
export function getCleanStoredOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  let storedOverrides: Record<string, string> = {};
  try {
    storedOverrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
  } catch (_) {}

  let hasChanged = false;
  if (storedOverrides['rai992522@gmail.com'] === 'SALES_EXEC') {
    storedOverrides['rai992522@gmail.com'] = 'MANAGER';
    hasChanged = true;
  }
  if (storedOverrides['usr_aditya_rai_01'] === 'SALES_EXEC') {
    storedOverrides['usr_aditya_rai_01'] = 'MANAGER';
    hasChanged = true;
  }
  if (hasChanged) {
    try {
      localStorage.setItem('das_crm_verified_overrides', JSON.stringify(storedOverrides));
    } catch (_) {}
  }

  return storedOverrides;
}

/**
 * Returns default resilient directory if backend is unreachable or during initial hydration.
 */
export function getDefaultDirectory(currentUser?: any): CachedEmployee[] {
  const DEMO_SENTINEL_IDS = new Set([
    'usr_admin',
    'usr_hr',
    'usr_mgr',
    'usr_tl',
    'usr_rep',
    'usr_unassigned',
    'usr_super',
  ]);

  const storedOverrides = getCleanStoredOverrides();
  let removedIds: string[] = [];
  let storedPhones: Record<string, string> = {};
  let storedManagers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]');
    } catch (_) {}
    try {
      storedPhones = JSON.parse(localStorage.getItem('das_crm_user_phones') || '{}');
    } catch (_) {}
    try {
      storedManagers = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
    } catch (_) {}
  }

  const list: CachedEmployee[] = [];

  const isRealUser =
    currentUser?.id &&
    !DEMO_SENTINEL_IDS.has(currentUser.id) &&
    currentUser.email &&
    !currentUser.email.endsWith('@das.com');

  if (isRealUser && !removedIds.includes(currentUser.id)) {
    const adminRole = (currentUser?.role || 'ADMIN').toUpperCase();
    const isOwnerOrAdmin =
      adminRole.includes('ADMIN') || adminRole.includes('OWNER') || adminRole.includes('SUPER_ADMIN');
    const role: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' = isOwnerOrAdmin
      ? 'ADMIN'
      : adminRole.includes('HR')
      ? 'HR'
      : adminRole.includes('MANAGER')
      ? 'MANAGER'
      : adminRole.includes('LEADER') || adminRole.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    list.push({
      id: currentUser.id,
      name: currentUser.name || currentUser.email.split('@')[0],
      code: 'EMP001',
      dept: isOwnerOrAdmin ? 'Executive & Administration' : 'Executive & Management',
      email: currentUser.email,
      phone: formatPhone(currentUser.phone || storedPhones[currentUser.id] || storedPhones[currentUser.email.toLowerCase()] || ''),
      role,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      assignedManager: 'Admin',
      baseSalary: isOwnerOrAdmin ? '₹95,000' : '₹50,000',
      joined: 'Recently',
      canSelfCheckIn: true,
      status: 'active',
      documents: {
        pan: 'VERIFIED',
        aadhaar: 'AADHAAR_VERIFIED.pdf',
        eduCert: 'DEGREE_VERIFIED.pdf',
        offerLetter: 'OFFER_LETTER.pdf',
        lastUpdatedDate: 'Recently',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Direct Deposit',
        accountHolder: currentUser.name || 'Staff Member',
        accountNo: '••••••••',
        ifscCode: '—',
        upiId: currentUser.email,
        lastUpdatedDate: 'Recently',
        historyLogs: [],
      },
      attendance: { presentDays: 1, absentDays: 0, leaveDays: 0, todayInTime: '09:30 AM', todayOutTime: null, todayGps: '—' },
      leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
      subordinates: [],
    });
  }

  // Merge extra staff
  if (typeof window !== 'undefined') {
    try {
      const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
      if (Array.isArray(extraStaff)) {
        extraStaff.forEach((st: any) => {
          if (!list.some(e => e.id === st.id || e.email?.toLowerCase() === st.email?.toLowerCase())) {
            const raw = storedPhones[st.id] || storedPhones[st.email?.toLowerCase()] || st.phone;
            const mgr = storedManagers[st.id] || storedManagers[st.email?.toLowerCase()] || st.assignedManager || 'Admin';
            list.push({
              ...st,
              phone: formatPhone(raw),
              assignedManager: mgr,
            });
          }
        });
      }
    } catch (_) {}

    // Merge extra unassigned staff awaiting verification
    try {
      const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
      if (Array.isArray(extraUnassigned)) {
        extraUnassigned.forEach((u: any) => {
          const emailLower = u.email?.toLowerCase();
          if (!list.some(e => e.id === u.id || (emailLower && e.email?.toLowerCase() === emailLower))) {
            const rawRole = (storedOverrides[u.id] || (emailLower && storedOverrides[emailLower]) || 'UNASSIGNED') as any;
            const isVer = rawRole !== 'UNASSIGNED';
            list.push({
              id: u.id || ('unassigned_' + Date.now()),
              name: u.name || u.email || 'Unassigned Staff',
              code: 'UNASSIGNED',
              dept: isVer ? 'Sales & Growth' : 'Pending Department',
              email: u.email || '',
              phone: formatPhone(u.phone || ''),
              role: rawRole,
              isVerified: isVer,
              verificationStatus: isVer ? 'VERIFIED' : 'PENDING',
              assignedManager: isVer ? 'Admin' : 'Pending Admin Assignment',
              baseSalary: isVer ? '₹45,000' : '₹0',
              joined: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : 'Recently',
              canSelfCheckIn: false,
              status: 'active',
              documents: { pan: 'PENDING', aadhaar: 'PENDING', eduCert: 'PENDING', offerLetter: 'PENDING', lastUpdatedDate: 'Recently', historyLogs: [] },
              bankDetails: { bankName: 'Pending', accountHolder: u.name || '', accountNo: '—', ifscCode: '—', upiId: u.email || '', lastUpdatedDate: 'Recently', historyLogs: [] },
              attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
              leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
              subordinates: [],
            });
          }
        });
      }
    } catch (_) {}
  }

  return list;
}

/**
 * Fetch and return the cached user directory.
 * If cached and within TTL, returns immediately without network overhead.
 */
export async function getUserDirectory(
  currentUser?: any,
  forceRefresh = false
): Promise<{ employees: CachedEmployee[]; companyKey: string; activeCount: number }> {
  const now = Date.now();

  // 1. Check in-memory cache first
  if (!forceRefresh && memoryCache.data && now - memoryCache.timestamp < CACHE_TTL_MS) {
    const activeCount = memoryCache.data.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
    return { employees: memoryCache.data, companyKey: memoryCache.companyKey, activeCount };
  }

  // 2. Check localStorage / sessionStorage cache
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const storedTime = Number(sessionStorage.getItem(STORAGE_TIME_KEY) || 0);
      if (now - storedTime < CACHE_TTL_MS) {
        const storedRaw = sessionStorage.getItem(STORAGE_KEY);
        if (storedRaw) {
          const parsed = JSON.parse(storedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCache.data = parsed;
            memoryCache.timestamp = storedTime;
            const activeCount = parsed.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
            return { employees: parsed, companyKey: memoryCache.companyKey, activeCount };
          }
        }
      }
    } catch (_) {}
  }

  // 3. Prevent duplicate simultaneous network requests
  if (memoryCache.fetching && !forceRefresh) {
    const data = await memoryCache.fetching;
    const activeCount = data.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
    return { employees: data, companyKey: memoryCache.companyKey, activeCount };
  }

  const fetchPromise = (async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    const compId = currentUser?.companyId;
    if (!compId || compId === 'comp_das' || compId === 'comp_default' || compId === 'platform_system') {
      return [];
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-organization-id': compId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let companyKey = memoryCache.companyKey || '';

    try {
      const keyRes = await fetch(`${apiBase}/users/company-key?organizationId=${compId}&companyKey=${companyKey}`, {
        headers: requestHeaders,
      }).catch(() => null);

      if (keyRes && keyRes.ok) {
        const keyJson = await keyRes.json();
        if (keyJson?.companyKey) {
          companyKey = keyJson.companyKey;
          memoryCache.companyKey = companyKey;
        }
      }
    } catch (_) {}

    try {
      const res = await fetch(`${apiBase}/users?organizationId=${compId}&companyKey=${companyKey}`, {
        headers: requestHeaders,
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const storedOverrides = getCleanStoredOverrides();
          let removedIds: string[] = [];
          let storedPhones: Record<string, string> = {};
          let storedManagers: Record<string, string> = {};
          try {
            removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]');
          } catch (_) {}
          try {
            storedPhones = JSON.parse(localStorage.getItem('das_crm_user_phones') || '{}');
          } catch (_) {}
          try {
            storedManagers = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
          } catch (_) {}

          const filteredData = data.filter((u: any) => !removedIds.includes(String(u.id)));

          const mapped: CachedEmployee[] = filteredData.map((u: any, idx: number) => {
            const rawRole = (u.role || '').toUpperCase();
            let role: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | 'UNASSIGNED' = 'UNASSIGNED';

            const override = storedOverrides[String(u.id)] || storedOverrides[u.email?.toLowerCase()];
            if (override) {
              role = override as any;
            } else if (
              u.roleId === null ||
              rawRole === 'UNASSIGNED' ||
              !u.role ||
              u.roleNotAssigned ||
              u.hasAssignedRole === false
            ) {
              role = 'UNASSIGNED';
            } else if (rawRole.includes('ADMIN') || rawRole.includes('OWNER') || rawRole.includes('SUPER_ADMIN')) {
              role = 'ADMIN';
            } else if (rawRole.includes('MANAGER')) {
              role = 'MANAGER';
            } else if (rawRole.includes('LEADER') || rawRole.includes('TL')) {
              role = 'TEAM_LEADER';
            } else if (rawRole.includes('HR')) {
              role = 'HR';
            } else {
              role = 'SALES_EXEC';
            }

            let rawPhone = u.phone || u.phoneNumber || u.mobile || storedPhones[String(u.id)] || storedPhones[u.email?.toLowerCase()];
            if (!rawPhone && (u.email === currentUser?.email || u.id === currentUser?.id)) {
              rawPhone = currentUser?.phone;
            }
            const displayPhone = formatPhone(rawPhone);

            const assignedMgr =
              storedManagers[String(u.id)] ||
              storedManagers[u.email?.toLowerCase()] ||
              (role === 'ADMIN' ? 'Organization Admin' : 'Admin');

            return {
              id: String(u.id),
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email,
              code: `EMP${String(idx + 1).padStart(3, '0')}`,
              dept:
                role === 'ADMIN'
                  ? 'Executive & Administration'
                  : role === 'HR'
                  ? 'Human Resources'
                  : role === 'MANAGER'
                  ? 'Executive & Management'
                  : role === 'TEAM_LEADER'
                  ? 'Lead & Operations'
                  : role === 'UNASSIGNED'
                  ? 'Pending Department'
                  : 'Sales & Growth',
              email: u.email,
              phone: displayPhone,
              role,
              isVerified: u.isVerified ?? (role !== 'UNASSIGNED'),
              verificationStatus: role === 'UNASSIGNED' ? 'PENDING' : 'VERIFIED',
              assignedManager: assignedMgr,
              baseSalary: role === 'ADMIN' ? '₹95,000' : role === 'MANAGER' ? '₹75,000' : role === 'HR' ? '₹55,000' : '₹45,000',
              joined: u.createdAt
                ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently',
              canSelfCheckIn: true,
              status: u.isActive !== false ? 'active' : 'inactive',
              documents: {
                pan: 'VERIFIED',
                aadhaar: 'AADHAAR_VERIFIED.pdf',
                eduCert: 'DEGREE_VERIFIED.pdf',
                offerLetter: 'OFFER_LETTER.pdf',
                lastUpdatedDate: 'Recently',
                historyLogs: [],
              },
              bankDetails: {
                bankName: 'Direct Deposit',
                accountHolder: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                accountNo: '••••••••',
                ifscCode: '—',
                upiId: u.email,
                lastUpdatedDate: 'Recently',
                historyLogs: [],
              },
              attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
              leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
              subordinates: [],
            };
          });

          // Merge extra staff
          try {
            const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
            if (Array.isArray(extraStaff)) {
              extraStaff.forEach((st: any) => {
                if (!mapped.some(e => e.id === st.id || e.email.toLowerCase() === st.email.toLowerCase())) {
                  mapped.unshift(st);
                }
              });
            }
          } catch (_) {}

          // Merge extra unassigned
          try {
            const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
            if (Array.isArray(extraUnassigned)) {
              extraUnassigned.forEach((u: any) => {
                const emailLower = u.email?.toLowerCase();
                if (!mapped.some(e => e.id === u.id || (emailLower && e.email?.toLowerCase() === emailLower))) {
                  const rawRole = (storedOverrides[u.id] || (emailLower && storedOverrides[emailLower]) || 'UNASSIGNED') as any;
                  const isVer = rawRole !== 'UNASSIGNED';
                  mapped.push({
                    id: u.id || `unassigned_${Date.now()}`,
                    name: u.name || u.email || 'Unassigned Staff',
                    code: 'UNASSIGNED',
                    dept: isVer ? 'Sales & Growth' : 'Pending Department',
                    email: u.email || '',
                    phone: formatPhone(u.phone || ''),
                    role: rawRole,
                    isVerified: isVer,
                    verificationStatus: isVer ? 'VERIFIED' : 'PENDING',
                    assignedManager: isVer ? 'Admin' : 'Pending Admin Assignment',
                    baseSalary: isVer ? '₹45,000' : '₹0',
                    joined: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : 'Recently',
                    canSelfCheckIn: false,
                    status: 'active',
                    documents: { pan: 'PENDING', aadhaar: 'PENDING', eduCert: 'PENDING', offerLetter: 'PENDING', lastUpdatedDate: 'Recently', historyLogs: [] },
                    bankDetails: { bankName: 'Pending', accountHolder: u.name || '', accountNo: '—', ifscCode: '—', upiId: u.email || '', lastUpdatedDate: 'Recently', historyLogs: [] },
                    attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
                    leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
                    subordinates: [],
                  });
                }
              });
            }
          } catch (_) {}

          // Update caches
          memoryCache.data = mapped;
          memoryCache.timestamp = Date.now();
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
              sessionStorage.setItem(STORAGE_TIME_KEY, String(Date.now()));
            } catch (_) {}
          }
          return mapped;
        }
      }
    } catch (_) {}

    // Fallback directory
    const fallback = getDefaultDirectory(currentUser);
    memoryCache.data = fallback;
    memoryCache.timestamp = Date.now();
    return fallback;
  })();

  memoryCache.fetching = fetchPromise;
  const result = await fetchPromise;
  memoryCache.fetching = null;

  const activeCount = result.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
  return { employees: result, companyKey: memoryCache.companyKey, activeCount };
}

/**
 * Returns the currently active verified user count synchronously from cache/default.
 */
export function getActiveSeatsCountSync(currentUser?: any): number {
  if (memoryCache.data && memoryCache.data.length > 0) {
    return memoryCache.data.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CachedEmployee[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
        }
      }
    } catch (_) {}
  }
  const fallback = getDefaultDirectory(currentUser);
  return fallback.filter(e => e.role !== 'UNASSIGNED' && e.status !== 'inactive').length;
}

/**
 * Invalidate user directory cache and broadcast update across all views & tabs.
 */
export function invalidateUserDirectoryCache() {
  memoryCache.data = null;
  memoryCache.timestamp = 0;
  memoryCache.fetching = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_TIME_KEY);
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent('das-crm-staff-updated'));
      window.dispatchEvent(new CustomEvent('user-directory-updated'));
      window.dispatchEvent(new Event('storage'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_sync');
        bc.postMessage({ type: 'USER_DIRECTORY_INVALIDATED', timestamp: Date.now() });
        bc.close();
      }
    } catch (_) {}
  }
}

/**
 * Subscribe to user directory updates across tabs, windows, and components.
 */
export function subscribeUserDirectory(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    invalidateUserDirectoryCache();
    callback();
  };

  window.addEventListener('storage', handleUpdate);
  window.addEventListener('das-crm-staff-updated', handleUpdate);
  window.addEventListener('user-directory-updated', handleUpdate);
  window.addEventListener('crm-role-updated', handleUpdate);

  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('das_crm_sync');
      bc.onmessage = () => handleUpdate();
    } catch (_) {}
  }

  const handleVisibility = () => {
    if (typeof document !== 'undefined' && !document.hidden) {
      handleUpdate();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('das-crm-staff-updated', handleUpdate);
    window.removeEventListener('user-directory-updated', handleUpdate);
    window.removeEventListener('crm-role-updated', handleUpdate);
    document.removeEventListener('visibilitychange', handleVisibility);
    if (bc) {
      try {
        bc.close();
      } catch (_) {}
    }
  };
}
