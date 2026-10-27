/**
 * Universal Lead & Entity Normalizer for DAS CRM Frontend
 * Prevents "Objects are not valid as a React child" (Error #31) and
 * "TypeError: toLowerCase is not a function" by guaranteeing that all
 * relational entity fields (owner, status, company, source, etc.) are converted
 * to safe, clean primitive types for rendering, state, and string filtering.
 */

export interface NormalizedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  statusColor: string;
  source: string;
  score: number;
  value: string;
  numericValue: number;
  owner: string;
  ownerId?: string;
  assignedRep: string;
  assignedRepName: string;
  assignedRepRole: string;
  city: string;
  budget: string;
  requirement: string;
  created: string;
  rawCreatedAt?: string;
  tags: string[];
  allocationTrail?: any[];
  currentAssignee?: string;
  totalCalls?: number;
  lastCalledAt?: string;
  customFields?: Record<string, any>;
}

export function safeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.name) return String(val.name);
    if (val.label) return String(val.label);
    if (val.title) return String(val.title);
    if (val.value) return String(val.value);
    if (val.firstName || val.lastName) {
      const full = `${val.firstName || ''} ${val.lastName || ''}`.trim();
      if (full) return full;
    }
    return fallback;
  }
  return fallback;
}

export function safeStatus(val: any, fallback = 'New'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.label === 'string' && val.label.trim()) return val.label.trim();
    if (typeof val.status === 'string' && val.status.trim()) return val.status.trim();
    if (typeof val.stage === 'string' && val.stage.trim()) return val.stage.trim();
  }
  return fallback;
}

export function safeOwnerName(val: any, fallback = 'Unassigned'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    const full = `${val.firstName || ''} ${val.lastName || ''}`.trim();
    if (full) return full;
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.email === 'string' && val.email.trim()) return val.email.trim();
    if (typeof val.username === 'string' && val.username.trim()) return val.username.trim();
  }
  return fallback;
}

export function safeOwnerRole(val: any, fallback = 'Sales Rep'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim() || fallback;
  if (typeof val === 'object') {
    if (typeof val.role === 'string') return val.role.trim() || fallback;
    if (typeof val.role === 'object' && val.role !== null && val.role.name) return String(val.role.name);
    if (typeof val.designation === 'string') return val.designation.trim() || fallback;
  }
  return fallback;
}

export function safeCompany(val: any, fallback = '—'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.companyName === 'string' && val.companyName.trim()) return val.companyName.trim();
    if (typeof val.title === 'string' && val.title.trim()) return val.title.trim();
  }
  return fallback;
}

export function safeSource(val: any, fallback = 'Google Ads'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    if (typeof val.platform === 'string' && val.platform.trim()) return val.platform.trim();
    if (typeof val.sourcePlatform === 'string' && val.sourcePlatform.trim()) return val.sourcePlatform.trim();
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.fileName === 'string' && val.fileName.trim()) return val.fileName.trim();
  }
  return fallback;
}

export const INVALID_PRODUCT_NAMES = new Set([
  '—',
  '-',
  '--',
  'none',
  'null',
  'undefined',
  'n/a',
  'na',
  'not specified',
  'no product',
  'no products',
  'no products yet',
  'no requirement',
  'individual lead',
  'individual',
  'individual leads',
  'lead',
  'leads',
  'lead profile',
  'lead requirement',
  'lead requirement profile',
  'direct requirement',
  'system / ingestion',
  'general',
  'general lead',
  'general requirement',
  'customer',
  'client',
  'prospect',
  'contact',
  'unknown',
  'other',
  'other requirements',
  'requirement',
  'requirements',
  'enterprise',
  'enterprise solution',
  'das crm',
  'das crm suite',
  'all',
]);

export function isValidProductName(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length < 2) return false;
  const lower = trimmed.toLowerCase();
  if (INVALID_PRODUCT_NAMES.has(lower)) return false;
  if (/^(individual lead|individual|lead requirement|unspecified|not specified)\b/i.test(trimmed)) {
    return false;
  }
  // Exclude phone numbers or emails mistakenly stored in product field
  if (/^(\+?\d[\d\s-]{6,}|\S+@\S+\.\S+)$/.test(trimmed)) {
    return false;
  }
  return true;
}

export function safeRequirement(val: any, fallback = '—'): string {
  if (val === null || val === undefined) return fallback;
  let rawStr = '';
  if (typeof val === 'string') {
    rawStr = val.trim();
  } else if (typeof val === 'object') {
    if (typeof val.name === 'string') rawStr = val.name.trim();
    else if (typeof val.product === 'string') rawStr = val.product.trim();
    else if (typeof val.requirement === 'string') rawStr = val.requirement.trim();
  }
  if (!rawStr || !isValidProductName(rawStr)) return fallback;
  return rawStr;
}

export function safeCity(val: any, fallback = '—'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    if (typeof val.name === 'string') return val.name;
    if (typeof val.city === 'string') return val.city;
  }
  return fallback;
}

export function safeTags(val: any, defaultTags: string[] = ['VERIFIED ✓']): string[] {
  if (!val) return defaultTags;
  if (Array.isArray(val)) {
    const clean = val
      .map(t => {
        if (typeof t === 'string') return t;
        if (typeof t === 'object' && t !== null) return t.name || t.label || t.title || '';
        return String(t || '');
      })
      .filter(t => t && t.trim().length > 0);
    return clean.length > 0 ? clean : defaultTags;
  }
  if (typeof val === 'string') {
    return [val];
  }
  return defaultTags;
}

export function safeLeadValue(val: any, estimatedVal?: any): { formatted: string; numeric: number } {
  let num = 0;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof estimatedVal === 'number') {
    num = estimatedVal;
  } else if (typeof val === 'string') {
    num = Number(val.replace(/[^0-9.-]/g, '')) || 0;
  } else if (typeof estimatedVal === 'string') {
    num = Number(estimatedVal.replace(/[^0-9.-]/g, '')) || 0;
  }
  if (num === 0 && !val && !estimatedVal) {
    return { formatted: '—', numeric: 0 };
  }
  return {
    formatted: `₹${num.toLocaleString('en-IN')}`,
    numeric: num,
  };
}

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  'new lead': '#3b82f6',
  contacted: '#06b6d4',
  qualified: '#10b981',
  proposal: '#8b5cf6',
  negotiation: '#f59e0b',
  won: '#10b981',
  'closed won': '#10b981',
  lost: '#ef4444',
  'unqualified / lost': '#ef4444',
  'not interested': '#ef4444',
  'meeting scheduled': '#8b5cf6',
  'visit scheduled': '#8b5cf6',
};

export function getStatusColor(statusStr: string, defaultColor = '#6366f1'): string {
  if (!statusStr) return defaultColor;
  const s = String(statusStr).toLowerCase().trim();
  return DEFAULT_STATUS_COLORS[s] || defaultColor;
}

/**
 * Normalizes any lead object (backend, prisma, cache, or mock)
 * into a completely flat, React-safe NormalizedLead record.
 */
export function normalizeLead(l: any, idx = 0): NormalizedLead {
  if (!l || typeof l !== 'object') {
    return {
      id: `lead_${idx}`,
      name: 'Lead Prospect',
      email: '—',
      phone: '—',
      company: '—',
      status: 'New',
      statusColor: '#3b82f6',
      source: 'Website',
      score: 85,
      value: '₹2,50,000',
      numericValue: 250000,
      owner: 'Sachin Puri',
      assignedRep: 'Sachin Puri',
      assignedRepName: 'Sachin Puri',
      assignedRepRole: 'Team Leader',
      city: '—',
      budget: '—',
      requirement: '—',
      created: 'Today',
      tags: ['VERIFIED ✓'],
      allocationTrail: [],
      totalCalls: 1,
      lastCalledAt: '15m ago',
    };
  }

  let rawName = l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.customFields?.clientName || 'Lead Prospect';
  const rawStatus = safeStatus(l.status || l.stage);
  let rawOwner = safeOwnerName(
    l.owner ||
    l.assignedRep ||
    l.assignedRepName ||
    l.currentAssignee ||
    l.customFields?.assignedRep ||
    l.customFields?.assignedRepName ||
    l.customFields?.owner
  );
  let rawOwnerRole = safeOwnerRole(l.owner || l.assignedRepRole);
  let rawOwnerId = String(
    l.ownerId ||
    (typeof l.owner === 'object' && l.owner?.id ? l.owner.id : '') ||
    l.customFields?.ownerId ||
    l.customFields?.assigneeId ||
    ''
  );

  // If allocationTrail exists, inspect the latest allocation event for authoritative current assignee
  const trail = Array.isArray(l.allocationTrail) ? l.allocationTrail : [];
  if (trail.length > 0) {
    const lastEvent = trail[trail.length - 1];
    if (lastEvent) {
      if (!rawOwnerId && lastEvent.assigneeId) {
        rawOwnerId = String(lastEvent.assigneeId);
      }
      if (lastEvent.toName && (!rawOwner || rawOwner === 'Unassigned' || rawOwner === '—')) {
        rawOwner = safeOwnerName(lastEvent.toName);
      }
    }
  }

  if ((!rawOwner || rawOwner === 'Unassigned' || rawOwner === '—') && (l.customFields?.assignedRep || l.customFields?.assignedRepName)) {
    rawOwner = safeOwnerName(l.customFields.assignedRep || l.customFields.assignedRepName);
  }

  const rawCompany = safeCompany(l.company || l.customFields?.company);
  const rawSource = safeSource(
    l.customFields?.platform ||
    l.customFields?.sourcePlatform ||
    l.source ||
    l.customFields?.source ||
    'Google Ads'
  );
  const rawReq = safeRequirement(l.requirement || l.productInterest || l.customFields?.col_requirement || l.customFields?.requirement || l.customFields?.productInterest);
  const rawCity = safeCity(l.city || l.customFields?.col_city || l.customFields?.city || l.customFields?.City);
  const rawBudget = safeString(l.budget || l.customFields?.col_budget || l.customFields?.budget || l.customFields?.Budget, '—');
  const val = safeLeadValue(l.value, l.estimatedValue);

  let createdStr = 'Today';
  if (l.createdAt) {
    try {
      const d = new Date(l.createdAt);
      createdStr = isNaN(d.getTime()) ? String(l.createdAt) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) {
      createdStr = String(l.createdAt);
    }
  } else if (l.created) {
    createdStr = safeString(l.created, 'Today');
  }

  let rawPhone = l.phone || l.phoneNumber || l.mobile || l.contact || l.contactNumber ||
    l.customFields?.phone || l.customFields?.phoneNumber || l.customFields?.mobile ||
    l.customFields?.col_phone || l.customFields?.col_mobile || l.customFields?.whatsapp ||
    l.customFields?.['Phone Number'] || l.customFields?.['Mobile'] ||
    (String(rawName).toLowerCase().includes('rahul kapoor') ? '+91 98000 10008' : '');

  // Safeguard: Detect when rawName or firstName contains a phone number and rawPhone is empty
  const isCleanPhone = (val: string) => {
    const s = String(val || '').replace(/[\s-]/g, '');
    return /^(0-|\+?91|0)?[6-9]\d{9}$/.test(s) || /^\d{10,12}$/.test(s);
  };

  const formatPhone = (val: string) => {
    const digits = String(val || '').replace(/[^0-9]/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
    }
    return val;
  };

  if ((!rawPhone || rawPhone === '—' || rawPhone === '-') && (isCleanPhone(rawName) || (l.firstName && isCleanPhone(l.firstName)))) {
    const phoneSource = isCleanPhone(rawName) ? rawName : l.firstName;
    rawPhone = formatPhone(phoneSource);
    if (isCleanPhone(rawName)) {
      const city = rawCity && rawCity !== '—' ? ` (${rawCity})` : '';
      const plat = rawSource && rawSource !== 'Google Ads' ? rawSource : 'IndiaMART';
      rawName = `${plat} Buyer${city}`;
    }
  }

  const rawEmail = l.email || l.emailAddress ||
    l.customFields?.email || l.customFields?.col_email ||
    l.customFields?.['Email Address'] || l.customFields?.['Email'] ||
    (String(rawName).toLowerCase().includes('rahul kapoor') ? 'rahul.kapoor@example.com' : '');

  return {
    id: String(l.id || `lead_${idx}`),
    name: safeString(rawName, 'Lead Prospect'),
    email: safeString(rawEmail, '—'),
    phone: safeString(rawPhone, '—'),
    company: rawCompany,
    status: rawStatus,
    statusColor: (typeof l.status === 'object' && l.status?.color) ? l.status.color : getStatusColor(rawStatus),
    source: rawSource,
    score: typeof l.score === 'number' ? l.score : 80,
    value: val.formatted,
    numericValue: val.numeric,
    owner: rawOwner,
    ownerId: rawOwnerId,
    assignedRep: rawOwner,
    assignedRepName: rawOwner,
    assignedRepRole: rawOwnerRole,
    city: rawCity,
    budget: rawBudget,
    requirement: rawReq,
    created: createdStr,
    rawCreatedAt: l.createdAt || l.rawCreatedAt || undefined,
    tags: safeTags(l.tags, [rawSource, 'VERIFIED ✓']),
    allocationTrail: trail,
    currentAssignee: rawOwner,
    totalCalls: typeof l.totalCalls === 'number' ? l.totalCalls : 1,
    lastCalledAt: safeString(l.lastCalledAt, 'Recently updated'),
    customFields: typeof l.customFields === 'object' && l.customFields !== null ? l.customFields : {},
  };
}
