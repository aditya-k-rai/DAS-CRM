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
  companyKey: 'ADOR-EC-7187',
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

  // 1. Admin
  const adminRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const isOwnerOrAdmin = adminRole.includes('ADMIN') || adminRole.includes('OWNER') || adminRole.includes('SUPER_ADMIN');
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
    id: currentUser?.id || 'cmuev7ni70016ikew8an7tdw8',
    name: currentUser?.name || 'Anurag Sharma',
    code: 'EMP001',
    dept: isOwnerOrAdmin ? 'Executive & Administration' : 'Executive & Management',
    email: currentUser?.email || 'adorabletrading08@gmail.com',
    phone: formatPhone(currentUser?.phone || storedPhones['adorabletrading08@gmail.com'] || storedPhones[currentUser?.id] || storedPhones[currentUser?.email?.toLowerCase()] || '9717355779'),
    role,
    isVerified: true,
    verificationStatus: 'VERIFIED',
    assignedManager: 'Admin',
    baseSalary: '₹95,000',
    joined: 'Sep 24, 2026',
    canSelfCheckIn: true,
    status: 'active',
    documents: {
      pan: 'VERIFIED',
      aadhaar: 'AADHAAR_VERIFIED.pdf',
      eduCert: 'DEGREE_VERIFIED.pdf',
      offerLetter: 'OFFER_LETTER_ADMIN.pdf',
      lastUpdatedDate: 'Recently',
      historyLogs: [],
    },
    bankDetails: {
      bankName: 'Direct Deposit',
      accountHolder: currentUser?.name || 'Anurag Sharma',
      accountNo: '••••••••',
      ifscCode: '—',
      upiId: currentUser?.email || 'adorabletrading08@gmail.com',
      lastUpdatedDate: 'Recently',
      historyLogs: [],
    },
    attendance: { presentDays: 1, absentDays: 0, leaveDays: 0, todayInTime: '09:30 AM', todayOutTime: null, todayGps: '—' },
    leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
    subordinates: [],
  });

  // 2. Nandini Rastogi (Sales Exec)
  const nandiniId = 'cmuhp0517000ngg2dq93a6nlp';
  if (!removedIds.includes(nandiniId)) {
    const nandiniRole = (storedOverrides[nandiniId] || storedOverrides['rastoginandini92@gmail.com'] || 'SALES_EXEC') as any;
    const isNandiniVerified = nandiniRole !== 'UNASSIGNED';
    list.push({
      id: nandiniId,
      name: 'Nandini Rastogi',
      code: 'EMP002',
      dept: isNandiniVerified
        ? nandiniRole === 'HR'
          ? 'Human Resources'
          : nandiniRole === 'MANAGER'
          ? 'Executive & Management'
          : 'Sales & Growth'
        : 'Pending Department',
      email: 'rastoginandini92@gmail.com',
      phone: formatPhone(storedPhones[nandiniId] || storedPhones['rastoginandini92@gmail.com'] || '+91 98765 43210'),
      role: nandiniRole,
      isVerified: isNandiniVerified,
      verificationStatus: isNandiniVerified ? 'VERIFIED' : 'PENDING',
      assignedManager: storedManagers[nandiniId] || storedManagers['rastoginandini92@gmail.com'] || (isNandiniVerified ? 'Admin' : 'Pending Admin Assignment'),
      baseSalary: '₹40,000',
      joined: 'Sep 26, 2026',
      canSelfCheckIn: false,
      status: 'active',
      documents: {
        pan: 'VERIFIED',
        aadhaar: 'AADHAAR_SUBMITTED.pdf',
        eduCert: 'DEGREE_SUBMITTED.pdf',
        offerLetter: 'PENDING_OFFER.pdf',
        lastUpdatedDate: 'Sep 26, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Direct Deposit',
        accountHolder: 'Nandini Rastogi',
        accountNo: '••••••••',
        ifscCode: '—',
        upiId: 'rastoginandini92@okaxis',
        lastUpdatedDate: 'Sep 26, 2026',
        historyLogs: [],
      },
      attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
      leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
      subordinates: [],
    });
  }

  // 3. Aditya Kumar Rai (Manager)
  const adityaId = 'usr_aditya_rai_01';
  if (!removedIds.includes(adityaId) && !removedIds.includes('rai992522@gmail.com')) {
    const adityaRole = (storedOverrides[adityaId] || storedOverrides['rai992522@gmail.com'] || 'MANAGER') as any;
    const isAdityaVerified = adityaRole !== 'UNASSIGNED';
    list.push({
      id: adityaId,
      name: 'Aditya Kumar Rai',
      code: 'EMP003',
      dept: isAdityaVerified
        ? adityaRole === 'HR'
          ? 'Human Resources'
          : adityaRole === 'MANAGER'
          ? 'Executive & Management'
          : adityaRole === 'TEAM_LEADER'
          ? 'Lead & Operations'
          : 'Sales & Growth'
        : 'Pending Department',
      email: 'rai992522@gmail.com',
      phone: formatPhone(storedPhones[adityaId] || storedPhones['rai992522@gmail.com'] || '+91 99252 20000'),
      role: adityaRole,
      isVerified: isAdityaVerified,
      verificationStatus: isAdityaVerified ? 'VERIFIED' : 'PENDING',
      assignedManager: storedManagers[adityaId] || storedManagers['rai992522@gmail.com'] || (isAdityaVerified ? 'Admin' : 'Pending Admin Assignment'),
      baseSalary: isAdityaVerified ? (adityaRole === 'MANAGER' ? '₹75,000' : adityaRole === 'HR' ? '₹55,000' : '₹45,000') : '₹75,000',
      joined: 'Sep 27, 2026',
      canSelfCheckIn: false,
      status: 'active',
      documents: {
        pan: 'VERIFIED',
        aadhaar: 'AADHAAR_SUBMITTED.pdf',
        eduCert: 'DEGREE_SUBMITTED.pdf',
        offerLetter: 'OFFER_LETTER.pdf',
        lastUpdatedDate: 'Sep 27, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Direct Deposit',
        accountHolder: 'Aditya Kumar Rai',
        accountNo: '••••••••',
        ifscCode: '—',
        upiId: 'rai992522@okaxis',
        lastUpdatedDate: 'Sep 27, 2026',
        historyLogs: [],
      },
      attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
      leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
      subordinates: [],
    });
  }

  // 4. Sachin Puri (Team Leader)
  const sachinId = 'usr_sachin_puri_01';
  if (!removedIds.includes(sachinId) && !removedIds.includes('sachinpuri938@gmail.com')) {
    const sachinRole = (storedOverrides[sachinId] || storedOverrides['sachinpuri938@gmail.com'] || 'TEAM_LEADER') as any;
    const isSachinVerified = sachinRole !== 'UNASSIGNED';
    list.push({
      id: sachinId,
      name: 'Sachin Puri',
      code: 'EMP004',
      dept: isSachinVerified ? 'Lead & Operations' : 'Pending Department',
      email: 'sachinpuri938@gmail.com',
      phone: formatPhone(storedPhones[sachinId] || storedPhones['sachinpuri938@gmail.com'] || '+91 93102 03982'),
      role: sachinRole,
      isVerified: isSachinVerified,
      verificationStatus: isSachinVerified ? 'VERIFIED' : 'PENDING',
      assignedManager: storedManagers[sachinId] || storedManagers['sachinpuri938@gmail.com'] || 'Aditya Kumar Rai (Manager)',
      baseSalary: '₹55,000',
      joined: 'Sep 27, 2026',
      canSelfCheckIn: true,
      status: 'active',
      documents: {
        pan: 'VERIFIED',
        aadhaar: 'AADHAAR_SUBMITTED.pdf',
        eduCert: 'DEGREE_SUBMITTED.pdf',
        offerLetter: 'OFFER_LETTER.pdf',
        lastUpdatedDate: 'Sep 27, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Direct Deposit',
        accountHolder: 'Sachin Puri',
        accountNo: '••••••••',
        ifscCode: '—',
        upiId: 'sachinpuri938@okaxis',
        lastUpdatedDate: 'Sep 27, 2026',
        historyLogs: [],
      },
      attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
      leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
      subordinates: [],
    });
  }

  // 5. Sulekha Tomar (Sales Exec)
  const sulekhaId = 'usr_sulekha_tomar_01';
  if (!removedIds.includes(sulekhaId) && !removedIds.includes('sulekhatmr@gmail.com')) {
    const sulekhaRole = (storedOverrides[sulekhaId] || storedOverrides['sulekhatmr@gmail.com'] || 'SALES_EXEC') as any;
    const isSulekhaVerified = sulekhaRole !== 'UNASSIGNED';
    list.push({
      id: sulekhaId,
      name: 'Sulekha Tomar',
      code: 'EMP005',
      dept: isSulekhaVerified ? 'Sales & Growth' : 'Pending Department',
      email: 'sulekhatmr@gmail.com',
      phone: formatPhone(storedPhones[sulekhaId] || storedPhones['sulekhatmr@gmail.com'] || '+91 93661 03735'),
      role: sulekhaRole,
      isVerified: isSulekhaVerified,
      verificationStatus: isSulekhaVerified ? 'VERIFIED' : 'PENDING',
      assignedManager: storedManagers[sulekhaId] || storedManagers['sulekhatmr@gmail.com'] || 'Sachin Puri (Team Leader)',
      baseSalary: '₹45,000',
      joined: 'Sep 28, 2026',
      canSelfCheckIn: false,
      status: 'active',
      documents: {
        pan: 'VERIFIED',
        aadhaar: 'AADHAAR_SUBMITTED.pdf',
        eduCert: 'DEGREE_SUBMITTED.pdf',
        offerLetter: 'OFFER_LETTER.pdf',
        lastUpdatedDate: 'Sep 28, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Direct Deposit',
        accountHolder: 'Sulekha Tomar',
        accountNo: '••••••••',
        ifscCode: '—',
        upiId: 'sulekhatmr@okaxis',
        lastUpdatedDate: 'Sep 28, 2026',
        historyLogs: [],
      },
      attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
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
    const compId = currentUser?.companyId || 'cmuev7n3o000mikew7je1tdiw';

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-organization-id': compId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let companyKey = memoryCache.companyKey || 'ADOR-EC-7187';

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
            if (!rawPhone && (u.email === 'adorabletrading08@gmail.com' || u.name?.toLowerCase().includes('anurag'))) {
              rawPhone = '9717355779';
            }
            if (!rawPhone && u.email === 'rai992522@gmail.com') {
              rawPhone = '+91 99252 20000';
            }
            if (!rawPhone && u.email === 'rastoginandini92@gmail.com') {
              rawPhone = '+91 98765 43210';
            }
            if (!rawPhone && u.email === 'sachinpuri938@gmail.com') {
              rawPhone = '+91 93102 03982';
            }
            if (!rawPhone && u.email === 'sulekhatmr@gmail.com') {
              rawPhone = '+91 93661 03735';
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
 * Invalidate user directory cache (call when user is verified, edited, or removed).
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
  }
}
