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

export function safeRequirement(val: any, fallback = '—'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'object') {
    if (typeof val.name === 'string') return val.name;
    if (typeof val.product === 'string') return val.product;
    if (typeof val.notes === 'string') return val.notes;
    if (typeof val.requirement === 'string') return val.requirement;
  }
  return fallback;
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

  const rawName = l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.customFields?.clientName || 'Lead Prospect';
  const rawStatus = safeStatus(l.status || l.stage);
  const rawOwner = safeOwnerName(l.owner || l.assignedRep || l.currentAssignee || l.assignedRepName);
  const rawOwnerRole = safeOwnerRole(l.owner || l.assignedRepRole);
  const rawCompany = safeCompany(l.company || l.customFields?.company);
  const rawSource = safeSource(
    l.customFields?.platform ||
    l.customFields?.sourcePlatform ||
    l.source ||
    l.customFields?.source ||
    'Google Ads'
  );
  const rawReq = safeRequirement(l.requirement || l.productInterest || l.notes || l.customFields?.col_requirement || l.customFields?.requirement || l.customFields?.productInterest);
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

  return {
    id: String(l.id || `lead_${idx}`),
    name: safeString(rawName, 'Lead Prospect'),
    email: safeString(l.email, '—'),
    phone: safeString(l.phone, '—'),
    company: rawCompany,
    status: rawStatus,
    statusColor: (typeof l.status === 'object' && l.status?.color) ? l.status.color : getStatusColor(rawStatus),
    source: rawSource,
    score: typeof l.score === 'number' ? l.score : 80,
    value: val.formatted,
    numericValue: val.numeric,
    owner: rawOwner,
    assignedRep: rawOwner,
    assignedRepName: rawOwner,
    assignedRepRole: rawOwnerRole,
    city: rawCity,
    budget: rawBudget,
    requirement: rawReq,
    created: createdStr,
    rawCreatedAt: l.createdAt || l.rawCreatedAt || undefined,
    tags: safeTags(l.tags, [rawSource, 'VERIFIED ✓']),
    allocationTrail: Array.isArray(l.allocationTrail) ? l.allocationTrail : [],
    currentAssignee: rawOwner,
    totalCalls: typeof l.totalCalls === 'number' ? l.totalCalls : 1,
    lastCalledAt: safeString(l.lastCalledAt, 'Recently updated'),
    customFields: typeof l.customFields === 'object' && l.customFields !== null ? l.customFields : {},
  };
}
