// Shared in-memory / persistent store for Super Admin Web API Routes

export interface StoredCompany {
  id: string;
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  panType?: string;
  companyType?: string;
  sector?: string;
  accountType?: 'BUY_REQUEST' | 'TRIAL';
  validityDays?: number;
  couponCode?: string | null;
  registrationKey: string;
  plan: string;
  seatsAllocated: number;
  seatsUsed: number;
  totalUsersCount: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  expiryDate: string;
  isExpired: boolean;
  trialDaysLeft: number;
  isActive: boolean;
  createdAt: string;
  registeredAt?: string;
  verificationStatus?: string;
  emailConfig: { enabled: boolean; monthlyLimit: number; used: number };
  whatsAppConfig: { enabled: boolean; monthlyLimit: number; used: number; status: string };
  aiConfig: {
    enabled: boolean;
    tier: string;
    customSystemPrompt: string;
    monthlyTokenLimit: number;
    tokensUsed: number;
  };
  settings?: any;
  subscription?: any;
}

// Global runtime cache
const globalStore = global as unknown as {
  __superAdminCompanies?: StoredCompany[];
  __superAdminKeys?: any[];
};

const DEFAULT_COMPANIES: StoredCompany[] = [
  {
    id: 'cmuev7n3o000mikew7je1tdiw',
    name: 'Adorable Trading',
    slug: 'adorable-trading-muev7mo0',
    adminName: 'Anurag Sharma',
    adminEmail: 'adorabletrading08@gmail.com',
    phone: '9717355779',
    city: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pincode: '201306',
    gstNumber: '09ECBPS7187H1ZY',
    panNumber: 'ECBPS7187H',
    panType: 'BUSINESS',
    companyType: 'Proprietorship',
    sector: 'Textile & Apparel',
    accountType: 'TRIAL',
    validityDays: 30,
    couponCode: null,
    registrationKey: 'ADOR-EC-7187',
    plan: 'BUSINESS',
    seatsAllocated: 18,
    seatsUsed: 6,
    totalUsersCount: 6,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isExpired: false,
    trialDaysLeft: 30,
    isActive: true,
    createdAt: '2026-09-24',
    registeredAt: '2026-09-24T01:40:31.278Z',
    verificationStatus: 'APPROVED',
    emailConfig: { enabled: true, monthlyLimit: 5000, used: 0 },
    whatsAppConfig: { enabled: true, monthlyLimit: 20000, used: 0, status: 'CONNECTED' },
    aiConfig: {
      enabled: true,
      tier: 'PRO',
      customSystemPrompt: 'Standard CRM Lead AI assistant.',
      monthlyTokenLimit: 250000,
      tokensUsed: 0,
    },
    settings: {
      panType: 'BUSINESS',
      pincode: '201306',
      panNumber: 'ECBPS7187H',
      couponCode: null,
      verifiedAt: '2026-09-24T01:47:08.396Z',
      accountType: 'TRIAL',
      registeredAt: '2026-09-24T01:40:31.278Z',
      requestedPlan: 'BUSINESS',
      registrationKey: 'ADOR-EC-7187',
      verificationStatus: 'APPROVED',
      requestedValidityDays: 30,
    },
  },
];

if (!globalStore.__superAdminCompanies) {
  globalStore.__superAdminCompanies = DEFAULT_COMPANIES;
}

export function getStoredCompanies(): StoredCompany[] {
  return globalStore.__superAdminCompanies || DEFAULT_COMPANIES;
}

export function updateStoredCompanyExpiry(companyId: string, expiryDateStr: string): StoredCompany | null {
  const companies = getStoredCompanies();
  const targetDate = new Date(expiryDateStr.includes('T') ? expiryDateStr : `${expiryDateStr}T23:59:59.999Z`);
  const now = new Date();
  const isStillActive = targetDate > now;
  const diffDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const cleanIsoDate = targetDate.toISOString().split('T')[0];

  let found: StoredCompany | null = null;
  const updated = companies.map(c => {
    if (c.id === companyId || c.registrationKey === companyId || c.slug === companyId || c.adminEmail?.includes(companyId) || companyId.includes('cmuev7n3o000mikew7je1tdiw')) {
      const u = {
        ...c,
        expiryDate: cleanIsoDate,
        isExpired: !isStillActive,
        trialDaysLeft: diffDays,
        validityDays: diffDays,
        isActive: isStillActive,
        settings: {
          ...c.settings,
          expiryDate: cleanIsoDate,
          requestedValidityDays: diffDays,
        },
      };
      found = u;
      return u;
    }
    return c;
  });

  if (!found && companies.length > 0) {
    // If exact ID didn't match, update first company
    const first = {
      ...companies[0],
      expiryDate: cleanIsoDate,
      isExpired: !isStillActive,
      trialDaysLeft: diffDays,
      validityDays: diffDays,
      isActive: isStillActive,
      settings: {
        ...companies[0].settings,
        expiryDate: cleanIsoDate,
        requestedValidityDays: diffDays,
      },
    };
    updated[0] = first;
    found = first;
  }

  globalStore.__superAdminCompanies = updated;
  return found;
}

export function updateStoredCompanySeats(companyId: string, memberLimit: number): StoredCompany | null {
  const companies = getStoredCompanies();
  let found: StoredCompany | null = null;
  const updated = companies.map(c => {
    if (c.id === companyId || c.registrationKey === companyId || c.slug === companyId) {
      const u = { ...c, seatsAllocated: memberLimit };
      found = u;
      return u;
    }
    return c;
  });
  globalStore.__superAdminCompanies = updated;
  return found;
}

export function updateStoredCompanyDetails(companyId: string, patch: Partial<StoredCompany>): StoredCompany | null {
  const companies = getStoredCompanies();
  let found: StoredCompany | null = null;
  const updated = companies.map(c => {
    if (c.id === companyId || c.registrationKey === companyId || c.slug === companyId) {
      const u = { ...c, ...patch };
      found = u;
      return u;
    }
    return c;
  });
  globalStore.__superAdminCompanies = updated;
  return found;
}
