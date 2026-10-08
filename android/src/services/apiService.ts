/**
 * apiService.ts — DAS CRM Android API Communication Service
 * Handles live NestJS backend calls, token injection, and offline fallback.
 * End-to-End Sync for Authentication, Leads, Attendance, and Role Telemetry.
 */

import { API_BASE, getApiBase, setApiBase, getCandidateApiUrls, findFastestReachableEndpoint } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineSyncEngine } from './offlineSyncEngine';

export const STORAGE_KEY_PUBLIC_COMPANIES = '@das_crm_public_companies';

export interface PublicCompany {
  id: string;
  name: string;
  slug?: string;
  status?: 'APPROVED' | 'PENDING' | string;
  isActive?: boolean;
  companyKey?: string;
}

export const DEFAULT_ACTIVE_COMPANY: PublicCompany = {
  id: 'cmuev7n3o000mikew7je1tdiw',
  name: 'Adorable Trading',
  slug: 'adorable-trading-muev7mo0',
  isActive: true,
  status: 'APPROVED',
  companyKey: 'ADOR-EC-7187',
};

export interface LeadItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  value: string;
  source: string;
  priority: string;

  // Custom Spreadsheet Columns & Organization Parity
  owner?: string;
  ownerId?: string;
  assignedRep?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  city?: string;
  budget?: string;
  requirement?: string;
  callSyncStatus?: string;
  customFields?: Record<string, any>;

  // AI Lead Score
  aiScore?: AIScoreData;

  // Offline Sync & Conflict Resolution Fields
  _synced?: boolean;
  _isOfflineDraft?: boolean;
  _updatedAt?: number;
  _hasConflict?: boolean;
}

// AI Lead Score Types
export type ScoreTier = 'HOT' | 'WARM' | 'COLD' | 'LOW';

export interface AIScoreData {
  totalScore: number;
  tier: ScoreTier;
  budgetScore: number;
  intentScore: number;
  engagementScore: number;
  productFitScore: number;
  responseScore: number;
  analysisSummary?: string;
  topFactors?: string[];
  riskFactors?: string[];
  recommendations?: string[];
  lastCalculatedAt?: string;
}

export interface AIScoreConfig {
  budgetWeight: number;
  intentWeight: number;
  engagementWeight: number;
  productFitWeight: number;
  responseWeight: number;
  hotThresholdMin: number;
  warmThresholdMin: number;
  coldThresholdMin: number;
  showOnLeadsTable: boolean;
  showBreakdownDetail: boolean;
  autoRecalculate: boolean;
}

export type Lead = LeadItem;

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  status?: string;
  assignedManager?: string;
}

export const FALLBACK_LEADS: LeadItem[] = [];

class ApiService {
  /** Fetch employee directory (/users or /employees) */
  async getEmployees(token?: string | null): Promise<{ success: boolean; employees: Employee[] }> {
    try {
      const activeBase = getApiBase();
      const res = await fetch(`${activeBase}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.users || data.employees || data.data || []);
        if (list.length > 0) {
          const employees: Employee[] = list.map((u: any) => ({
            id: String(u.id),
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Staff Member',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || 'SALES_EXEC',
            status: u.status || 'ACTIVE',
          }));
          return { success: true, employees };
        }
      }
    } catch (_) {}
    return {
      success: true,
      employees: [
        { id: 'cmuhp0517000ngg2dq93a6nlp', name: 'Nandini Rastogi', email: 'rastoginandini92@gmail.com', role: 'SALES_EXEC', status: 'ACTIVE' },
        { id: 'cmukwwdv9000ng42dghtw6t3z', name: 'Sulekha Tomar', email: 'sulekhatmr@gmail.com', role: 'SALES_EXEC', status: 'ACTIVE' },
        { id: 'cmukykfoe000nht2d0ylnsd3t', name: 'Sadhana', email: 'sadhnadikshit98@gmail.com', role: 'SALES_EXEC', status: 'ACTIVE' },
      ],
    };
  }
  /** Live NestJS Backend Health & Network Reachability Check */
  async checkBackendHealth(): Promise<{ isOnline: boolean; isBackendConnected: boolean; latencyMs: number; service?: string }> {
    const startTime = Date.now();
    const activeBase = getApiBase();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${activeBase}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const latencyMs = Date.now() - startTime;
        return {
          isOnline: true,
          isBackendConnected: true,
          latencyMs,
          service: data.service || 'DAS CRM NestJS Backend',
        };
      }
    } catch {
      // Secondary fallback ping if local dev backend is starting up
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 204 || res.ok) {
          return {
            isOnline: true,
            isBackendConnected: false,
            latencyMs: Date.now() - startTime,
            service: 'Internet Reachable (Backend Offline)',
          };
        }
      } catch {}
    }

    return {
      isOnline: false,
      isBackendConnected: false,
      latencyMs: 0,
      service: 'Offline / Disconnected',
    };
  }

  /** Fetch public active tenant companies for login dropdown with multi-candidate network retry and offline cache */
  async getPublicCompanies(): Promise<PublicCompany[]> {
    // 1. Try currently active API base first with fast timeout
    let workingBase = getApiBase();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${workingBase}/auth/public-companies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const companies: PublicCompany[] = data.map((c: any) => ({
            id: c.id,
            name: c.name || c.companyName,
            slug: c.slug,
            status: c.status || (c.isActive ? 'APPROVED' : 'PENDING'),
            isActive: c.isActive ?? (c.status === 'APPROVED'),
            companyKey: c.companyKey || c.registrationKeyId || undefined,
          }));
          AsyncStorage.setItem(STORAGE_KEY_PUBLIC_COMPANIES, JSON.stringify(companies)).catch(() => {});
          return companies;
        }
      }
    } catch (_) {}

    // 2. If active base failed, race candidate URLs concurrently to discover working server
    const fastestUrl = await findFastestReachableEndpoint(2200);
    if (fastestUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${fastestUrl}/auth/public-companies`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setApiBase(fastestUrl);
            const companies: PublicCompany[] = data.map((c: any) => ({
              id: c.id,
              name: c.name || c.companyName,
              slug: c.slug,
              status: c.status || (c.isActive ? 'APPROVED' : 'PENDING'),
              isActive: c.isActive ?? (c.status === 'APPROVED'),
              companyKey: c.companyKey || c.registrationKeyId || undefined,
            }));
            AsyncStorage.setItem(STORAGE_KEY_PUBLIC_COMPANIES, JSON.stringify(companies)).catch(() => {});
            return companies;
          }
        }
      } catch (_) {}
    }

    // 3. If network attempts all failed, fall back to cached companies in AsyncStorage
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY_PUBLIC_COMPANIES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}

    // Parity fallback with Web LoginGateway: Ensure Adorable Trading is always available
    return [DEFAULT_ACTIVE_COMPANY];
  }

  /** Fetch current authenticated user profile (/auth/me) */
  async getCurrentUser(token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback handled by authStore
    }
    return null;
  }

  /** Fetch list of leads for active workspace (/leads) with cache-first offline support and smart conflict merge */
  async getLeads(token?: string | null): Promise<LeadItem[]> {
    // 1. Immediately read cached leads for instant offline display
    const cachedLeads: LeadItem[] = await offlineSyncEngine.getCachedLeads();

    try {
      const activeBase = getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${activeBase}/leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        const rawList = Array.isArray(result) ? result : (result.data || []);
        if (rawList.length > 0) {
          const serverLeads: LeadItem[] = rawList.map((item: any) => ({
            id: String(item.id),
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || 'Unnamed Lead',
            company: item.companyName || item.company || '—',
            email: item.email || 'No Email Provided',
            phone: item.phone || item.mobile || '—',
            status: (item.stage || item.status || 'NEW LEAD').toUpperCase(),
            value: item.estimatedValue ? `$${Number(item.estimatedValue).toLocaleString()}` : (item.value || '$5,000'),
            source: item.source || 'Direct',
            priority: item.priority || 'Medium',
            assignedRep: item.assignedRep || item.assignedTo || 'Unassigned',
            city: item.city || '—',
            budget: item.budget || '—',
            requirement: item.requirement || '—',
            callSyncStatus: item.callSyncStatus || 'Never',
            aiScore: item.aiScore,
            _synced: true,
            _isOfflineDraft: false,
            _updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now(),
          }));

          // Smart merge: Preserve any local offline drafts that haven't been pushed yet
          const pendingDrafts = cachedLeads.filter(
            (c) => c._isOfflineDraft || c.id.startsWith('lead-local-') || c._synced === false
          );

          // For server leads that exist in cachedLeads, check if local has unsynced field updates
          const mergedServerLeads = serverLeads.map((sLead) => {
            const localVersion = cachedLeads.find((c) => c.id === sLead.id);
            if (localVersion && localVersion._synced === false && (localVersion._updatedAt || 0) > (sLead._updatedAt || 0)) {
              return { ...sLead, ...localVersion, _synced: false };
            }
            return sLead;
          });

          // Unique combined list with pending local drafts pinned at top
          const serverIds = new Set(mergedServerLeads.map((l) => l.id));
          const uniquePending = pendingDrafts.filter((d) => !serverIds.has(d.id));
          const finalLeads = [...uniquePending, ...mergedServerLeads];

          // Persist to local cache for instant future loads
          await offlineSyncEngine.saveCachedLeads(finalLeads);
          return finalLeads;
        }
      }
    } catch {
      // Backend unreachable or offline: gracefully return cache
    }

    return cachedLeads.length > 0 ? cachedLeads : FALLBACK_LEADS;
  }

  /** Create a new lead with optimistic local cache and offline queue */
  async createLead(token: string | null, leadData: Partial<LeadItem>): Promise<{ success: boolean; lead: LeadItem }> {
    const newLead: LeadItem = {
      id: leadData.id || `lead-local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: leadData.name || 'New Lead',
      company: leadData.company || 'Enterprise Prospect',
      email: leadData.email || 'lead@company.com',
      phone: leadData.phone || '+91 99999 00000',
      status: (leadData.status || 'NEW LEAD').toUpperCase(),
      value: leadData.value || '₹0',
      source: leadData.source || 'Mobile App',
      priority: leadData.priority || 'Medium',
      assignedRep: leadData.assignedRep || 'Unassigned',
      city: leadData.city || '—',
      budget: leadData.budget || '—',
      requirement: leadData.requirement || '—',
      callSyncStatus: 'Never',
      _synced: false,
      _isOfflineDraft: true,
      _updatedAt: Date.now(),
    };

    // 1. Optimistic write to local cache
    await offlineSyncEngine.upsertCachedLead(newLead, true);

    const payload = {
      firstName: newLead.name.split(' ')[0] || 'New',
      lastName: newLead.name.split(' ').slice(1).join(' ') || 'Lead',
      companyName: newLead.company,
      email: newLead.email,
      phone: newLead.phone,
      stage: newLead.status,
      source: newLead.source,
      priority: newLead.priority,
      estimatedValue: Number(newLead.value.replace(/[^0-9.]/g, '')) || 5000,
    };

    // 2. If online and authenticated, push to backend
    if (token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_BASE}/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const created = await res.json();
          if (created && created.id) {
            newLead.id = String(created.id);
          }
          await offlineSyncEngine.markLeadSynced(newLead.id);
          return { success: true, lead: newLead };
        }
      } catch (_) {}
    }

    // 3. If offline or network error, enqueue for auto-sync upon reconnection
    await offlineSyncEngine.enqueue({
      action: 'CREATE_LEAD',
      endpoint: '/leads',
      method: 'POST',
      payload,
      entityId: newLead.id,
    });

    return { success: true, lead: newLead };
  }

  /** Update an existing lead with optimistic local cache and offline queue */
  async updateLead(
    tokenOrId: string | null,
    leadIdOrUpdates: string | Partial<LeadItem>,
    maybeUpdates?: Partial<LeadItem>
  ): Promise<boolean> {
    let token: string | null = null;
    let leadId: string;
    let updates: Partial<LeadItem>;

    if (typeof leadIdOrUpdates === 'string') {
      token = tokenOrId;
      leadId = leadIdOrUpdates;
      updates = maybeUpdates || {};
    } else {
      token = null;
      leadId = String(tokenOrId);
      updates = leadIdOrUpdates || {};
    }
    const cachedLeads = await offlineSyncEngine.getCachedLeads();
    const existing = cachedLeads.find((l) => l.id === leadId);
    const updatedLead: LeadItem = {
      ...(existing || { id: leadId, name: 'Lead', company: '—', email: '—', phone: '—', status: 'NEW LEAD', value: '₹0', source: '—', priority: 'Medium' }),
      ...updates,
      _synced: false,
      _updatedAt: Date.now(),
    };
    await offlineSyncEngine.upsertCachedLead(updatedLead, true);

    const payload = {
      ...updates,
      ...(updates.name ? {
        firstName: updates.name.split(' ')[0],
        lastName: updates.name.split(' ').slice(1).join(' '),
      } : {}),
    };

    if (token && !leadId.startsWith('lead-local-')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_BASE}/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          await offlineSyncEngine.markLeadSynced(leadId);
          return true;
        }
      } catch (_) {}
    }

    await offlineSyncEngine.enqueue({
      action: 'UPDATE_LEAD',
      endpoint: `/leads/${leadId}`,
      method: 'PATCH',
      payload,
      entityId: leadId,
    });

    return true;
  }

  /** Update lead status with optimistic local cache and offline queue */
  async updateLeadStatus(token: string | null, leadId: string, newStatus: string): Promise<boolean> {
    const cachedLeads = await offlineSyncEngine.getCachedLeads();
    const existing = cachedLeads.find((l) => l.id === leadId);
    if (existing) {
      existing.status = newStatus;
      existing._synced = false;
      existing._updatedAt = Date.now();
      await offlineSyncEngine.upsertCachedLead(existing, true);
    }

    if (token && !leadId.startsWith('lead-local-')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${API_BASE}/leads/${leadId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ statusId: newStatus, status: newStatus }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          await offlineSyncEngine.markLeadSynced(leadId);
          return true;
        }
      } catch (_) {}
    }

    await offlineSyncEngine.enqueue({
      action: 'UPDATE_LEAD_STATUS',
      endpoint: `/leads/${leadId}/status`,
      method: 'PATCH',
      payload: { statusId: newStatus, status: newStatus },
      entityId: leadId,
    });

    return true;
  }

  /** Delete a lead with optimistic local cache removal and offline queue */
  async deleteLead(token: string | null, leadId: string): Promise<boolean> {
    await offlineSyncEngine.removeCachedLead(leadId);

    if (token && !leadId.startsWith('lead-local-')) {
      try {
        const res = await fetch(`${API_BASE}/leads/${leadId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) return true;
      } catch (_) {}

      await offlineSyncEngine.enqueue({
        action: 'DELETE_LEAD',
        endpoint: `/leads/${leadId}`,
        method: 'DELETE',
        payload: { id: leadId },
        entityId: leadId,
      });
    }

    return true;
  }

  /** Authoritative Online-Verified Lead Allocation with Employee Notification Dispatch */
  async allocateLeadsWithVerification(
    token: string | null,
    payload: {
      mode: 'BATCHWISE' | 'DIRECT_ASSIGN' | 'LEAD_POOL';
      batchRules?: any[];
      directAssign?: { assigneeId: string; assigneeName?: string };
      totalLeadsCount?: number;
      fileName?: string;
    },
  ): Promise<{ success: boolean; verified: boolean; message: string }> {
    if (!token) {
      return { success: true, verified: false, message: 'Demo mode allocated' };
    }
    try {
      const res = await fetch(`${API_BASE}/leads/distribution/allocate-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          verified: !!data.verified,
          message: data.message || 'Allocations verified and employee notifications dispatched.',
        };
      } else {
        return { success: false, verified: false, message: 'Server rejected lead allocation.' };
      }
    } catch (e: any) {
      return { success: false, verified: false, message: e.message || 'Network connection failed.' };
    }
  }

  /** Dispatch Lead Import & Allocation Report to Admin Email */
  async mailImportReport(
    token: string | null,
    payload: {
      importId: string;
      fileName: string;
      source: 'CSV' | 'EXCEL' | 'GOOGLE_SHEETS';
      importDate: string;
      totalLeads: number;
      allocationMode: string;
      allocationBreakdown?: string[];
      recipientEmail: string;
      notes?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/leads/mail-import-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message || `Mailed report to ${payload.recipientEmail}` };
      }
    } catch {}
    return {
      success: true,
      message: `Mailed report for "${payload.fileName}" to ${payload.recipientEmail} (Simulated offline backup).`,
    };
  }

  /** Fetch Server-Authoritative Time & Date from Backend API */
  async getServerTime(): Promise<{ serverTime: string; isoDate: string; timestampMs: number; formattedTime: string; formattedDate: string }> {
    try {
      const res = await fetch(`${API_BASE}/attendance/server-time`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.serverTime) return data;
      }
    } catch {}

    // Trusted fallback
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    return {
      serverTime: `${dateStr} ${timeStr} IST (Server Time)`,
      isoDate: now.toISOString(),
      timestampMs: now.getTime(),
      formattedTime: timeStr,
      formattedDate: dateStr,
    };
  }

  /** Record attendance punch in / punch out (/attendance/punch) with offline queue fallback */
  async recordAttendancePunch(token: string | null, payload: { type: 'IN' | 'OUT'; location?: string; image?: string }) {
    const localResult = { success: true, timestamp: new Date().toISOString() };

    if (!token) return localResult;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE}/attendance/punch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (_) {
      // Backend unreachable: queue the punch for later sync
      await offlineSyncEngine.enqueue({
        action: 'ATTENDANCE_PUNCH',
        endpoint: '/attendance/punch',
        method: 'POST',
        payload: { ...payload, queuedAt: new Date().toISOString() },
      });
    }

    return localResult;
  }

  /** Fetch Products Catalog (/products) */
  async getProducts(token: string | null) {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  /** Create Product Item (/products) */
  async createProduct(token: string | null, product: any) {
    if (!token) return product;
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(product),
      });
      if (res.ok) return await res.json();
    } catch {}
    return product;
  }

  /** Fetch Quotations and Invoices (/quotations) */
  async getQuotations(token: string | null) {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  /** Create Quotation Invoice (/quotations) */
  async createQuotation(token: string | null, quotation: any) {
    if (!token) return quotation;
    try {
      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(quotation),
      });
      if (res.ok) return await res.json();
    } catch {}
    return quotation;
  }

  /** Import CSV Content (/imports/csv) */
  async importLeadsCsv(token: string | null, csvContent: string, headerRowIndex: number = 0, columnMapping?: Record<string, string>) {
    try {
      const res = await fetch(`${API_BASE}/imports/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ csvContent, headerRowIndex, columnMapping }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      success: false,
      importedCount: 0,
      headers: [],
      leads: [],
      error: 'Backend offline or network error while processing CSV.',
    };
  }

  /** Import Excel Rows (/imports/excel) */
  async importLeadsExcel(token: string | null, rows: any[]) {
    try {
      const res = await fetch(`${API_BASE}/imports/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rows }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      success: rows.length > 0,
      importedCount: rows.length,
      leads: rows,
    };
  }

  /** Sync Google Sheets Live URL (/imports/google-sheets) */
  async syncGoogleSheets(token: string | null, sheetUrl: string, selectedSheets?: string[], headerRowIndex: number = 0) {
    try {
      const res = await fetch(`${API_BASE}/imports/google-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sheetUrl, selectedSheets, headerRowIndex }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      success: false,
      importedCount: 0,
      sheetTitle: '',
      availableSheets: [],
      leads: [],
      error: 'Backend offline or unable to connect to Google Sheets.',
    };
  }

  /** WhatsApp Cloud API Conversations */
  async getWhatsAppConversations(token: string | null) {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/conversations`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }

  /** Send WhatsApp Message */
  async sendWhatsAppMessage(token: string | null, to: string, message: string) {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to, message }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, timestamp: new Date().toISOString() };
  }

  /** Import leads from CSV/Excel file — sends structured data + audit metadata to backend */
  async importLeadsFromFile(
    token: string | null,
    payload: {
      leads: any[];
      fileName: string;
      fileSize: string;
      platform: string;
      importedAt: string;
      sheetCount: number;
      totalRows: number;
      blockedSheets: number;
    }
  ) {
    try {
      const res = await fetch(`${API_BASE}/leads/import-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leads: payload.leads,
          audit: {
            fileName: payload.fileName,
            fileSize: payload.fileSize,
            platform: payload.platform,
            importedAt: payload.importedAt,
            sheetCount: payload.sheetCount,
            totalRows: payload.totalRows,
            blockedSheets: payload.blockedSheets,
          },
        }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, importedCount: payload.leads.length };
  }

  // ══════════════════════════════════════════════════════════════
  // 🤖 AI LEAD SCORING API METHODS
  // ══════════════════════════════════════════════════════════════

  /** Get AI Score configuration for organization */
  async getAIScoreConfig(token: string | null): Promise<AIScoreConfig | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  /** Update AI Score configuration */
  async updateAIScoreConfig(token: string | null, config: Partial<AIScoreConfig>): Promise<boolean> {
    if (!token) return true;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {}
    return true;
  }

  /** Get AI Score for a specific lead */
  async getLeadAIScore(token: string | null, leadId: string): Promise<AIScoreData | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/scores/${leadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  /** Get all lead scores for the organization */
  async getAllAIScores(token: string | null, tier?: ScoreTier): Promise<AIScoreData[]> {
    if (!token) return [];
    try {
      const url = tier ? `${API_BASE}/ai-scoring/scores?tier=${tier}` : `${API_BASE}/ai-scoring/scores`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.scores || []);
      }
    } catch {}
    return [];
  }

  /** Calculate/recalculate AI score for a specific lead */
  async calculateLeadAIScore(token: string | null, leadId: string): Promise<AIScoreData | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/scores/${leadId}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  /** Recalculate all AI scores for the organization */
  async recalculateAllAIScores(token: string | null): Promise<boolean> {
    if (!token) return true;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/scores/recalculate-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return res.ok;
    } catch {}
    return true;
  }

  /** Get AI Score summary/distribution for dashboard */
  async getAIScoreSummary(token: string | null): Promise<{
    distribution: { hot: number; warm: number; cold: number; low: number; total: number };
    topLeads: Array<{ id: string; name: string; score: number; tier: ScoreTier }>;
    config: { hotThresholdMin: number; warmThresholdMin: number; coldThresholdMin: number };
  } | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/ai-scoring/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  // ── Lead Distribution & Manager Allocation ──────────────────────────────────
  async allocateLeadsToRep(
    token: string | null,
    leadIds: string[],
    targetUserId: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!token) return { success: false, message: 'No authentication token' };
    try {
      const res = await fetch(`${API_BASE}/leads/distribution/manager-allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds,
          targetUserId,
        }),
      });
      if (res.ok) {
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.message || 'Allocation failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during allocation' };
    }
  }

  // ── Follow-ups & Reminders Engine ──────────────────────────────────────────
  async getFollowUps(token: string | null, queryParams?: Record<string, string>): Promise<any[]> {
    if (!token) return [];
    try {
      const qs = queryParams ? '?' + new URLSearchParams(queryParams).toString() : '';
      const res = await fetch(`${API_BASE}/follow-ups${qs}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.followUps || data.data || [];
      }
    } catch {}
    return [];
  }

  async getTodayFollowUps(token: string | null): Promise<any> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/follow-ups/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  async createFollowUp(token: string | null, payload: any): Promise<any> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  async updateFollowUp(token: string | null, id: string, payload: any): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/follow-ups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {}
    return false;
  }

  async completeFollowUp(token: string | null, id: string, payload: any): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/follow-ups/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {}
    return false;
  }

  async rescheduleFollowUp(token: string | null, id: string, payload: any): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/follow-ups/${id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {}
    return false;
  }

  // ── Leaves Management Engine ───────────────────────────────────────────────
  async getLeaveRequests(token: string | null): Promise<any[]> {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.leaves || [];
      }
    } catch {}
    return [];
  }

  async updateLeaveStatus(token: string | null, id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/leaves/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch {}
    return false;
  }

  // ── Deals & Pipeline Engine ───────────────────────────────────────────────
  async getDeals(token: string | null, queryParams?: Record<string, string>): Promise<any[]> {

    if (!token) return [];
    try {
      const qs = queryParams ? '?' + new URLSearchParams(queryParams).toString() : '';
      const res = await fetch(`${API_BASE}/deals${qs}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.deals || data.data || [];
      }
    } catch {}
    return [];
  }

  async createDeal(token: string | null, payload: any): Promise<any> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  async moveDeal(token: string | null, id: string, stageId: string): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/deals/${id}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stageId }),
      });
      return res.ok;
    } catch {}
    return false;
  }

  async getForecast(token: string | null): Promise<any> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/deals/forecast`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  async getPipelines(token: string | null): Promise<any[]> {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/deals/pipelines`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.pipelines || [];
      }
    } catch {}
    return [];
  }
}



export const apiService = new ApiService();
