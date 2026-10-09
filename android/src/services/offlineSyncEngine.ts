/**
 * offlineSyncEngine.ts — DAS CRM Android Offline & Conflict Resolution Engine
 * 
 * Provides:
 * 1. Real-time network reachability & backend availability detection.
 * 2. Persistent Offline Mutation Queue with automatic FIFO replay upon reconnection.
 * 3. Deterministic Conflict Resolution (Three-Way Field Merge, Last-Write-Wins with
 *    Timestamp Verification, Non-Destructive Conflict Archiving).
 * 4. Cache-First local persistence for Leads, Attendance, and Core Workspace entities.
 * 5. Event-driven sync state broadcasting for instant UI reactivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { getApiBase, probeAndSetWorkingApiBase } from '../config/api';

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const QUEUE_STORAGE_KEY = '@das_crm_offline_mutation_queue';
export const CACHED_LEADS_KEY = '@das_crm_cached_leads';
export const CACHED_ATTENDANCE_KEY = '@das_crm_cached_attendance';
export const CONFLICT_ARCHIVE_KEY = '@das_crm_conflict_archive';
export const LAST_SYNC_KEY = '@das_crm_last_sync_timestamp';

// ─── Types ───────────────────────────────────────────────────────────────────
export type MutationAction =
  | 'CREATE_LEAD'
  | 'UPDATE_LEAD'
  | 'UPDATE_LEAD_STATUS'
  | 'DELETE_LEAD'
  | 'ATTENDANCE_PUNCH'
  | 'GENERIC_MUTATION';

export interface QueuedMutation {
  id: string;
  action: MutationAction;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  createdAt: number; // Client timestamp
  entityId?: string;
  retryCount: number;
  status: 'PENDING' | 'RETRYING' | 'CONFLICT';
  lastError?: string;
}

export type SyncStatusType = 'IDLE' | 'SYNCING' | 'OFFLINE' | 'SYNCED' | 'CONFLICT';

export interface SyncEngineState {
  isOnline: boolean;
  isBackendConnected: boolean;
  syncStatus: SyncStatusType;
  pendingCount: number;
  lastSyncTime: number | null;
  lastError?: string | null;
  activeConflictCount: number;
}

export interface ConflictRecord {
  id: string;
  entityId: string;
  action: MutationAction;
  clientPayload: any;
  serverState?: any;
  resolvedAt: number;
  strategy: 'MERGED_FIELD_LEVEL' | 'CLIENT_PRIORITY' | 'SERVER_PRIORITY' | 'ARCHIVED';
  message: string;
}

type SyncListener = (state: SyncEngineState) => void;

class OfflineSyncEngine {
  private state: SyncEngineState = {
    isOnline: true,
    isBackendConnected: true,
    syncStatus: 'IDLE',
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
    activeConflictCount: 0,
  };

  private listeners: Set<SyncListener> = new Set();
  private checkTimer: any = null;
  private isProcessingQueue = false;
  private activeToken: string | null = null;

  constructor() {
    this.init();
  }

  /** Initialize engine, restore state, and attach lifecycle listeners */
  private async init() {
    try {
      const savedTime = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (savedTime) {
        this.state.lastSyncTime = Number(savedTime);
      }
      const queue = await this.getQueue();
      this.state.pendingCount = queue.length;
    } catch (_) {}

    // Initial check
    this.checkNetworkStatus();

    // Controlled heartbeat (30s interval)
    this.startHeartbeat();

    // React Native AppState listener (pause heartbeat when backgrounded, resume when active)
    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        this.startHeartbeat();
        this.checkNetworkStatus();
      } else {
        this.stopHeartbeat();
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.checkTimer = setInterval(() => {
      this.checkNetworkStatus();
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private lastProbeTime = 0;

  /** Set current active authentication token for queue draining */
  public setAuthToken(token: string | null) {
    this.activeToken = token;
  }

  /** Subscribe to real-time engine state changes */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Current snapshot of sync state */
  public getState(): SyncEngineState {
    return { ...this.state };
  }

  private notify() {
    const snap = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (_) {}
    });
  }

  /** Perform live network and backend reachability check */
  public async checkNetworkStatus(): Promise<boolean> {
    const apiBase = getApiBase();
    let isBackendLive = false;
    let isNetLive = false;

    // 1. Try Backend Health Ping on current API_BASE
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${apiBase}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        isBackendLive = true;
        isNetLive = true;
      }
    } catch (_) {}

    // 2. If current API_BASE failed, auto-probe candidate URLs (LAN IP, Expo Host, etc.) with 60s cooldown
    if (!isBackendLive && Date.now() - this.lastProbeTime > 60000) {
      this.lastProbeTime = Date.now();
      try {
        const workingUrl = await probeAndSetWorkingApiBase();
        if (workingUrl) {
          isBackendLive = true;
          isNetLive = true;
        }
      } catch (_) {}
    }

    // 3. Fallback Internet Check if backend didn't respond
    if (!isBackendLive) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.status === 204 || res.ok) {
          isNetLive = true;
        }
      } catch (_) {
        isNetLive = false;
      }
    }

    const wasOffline = !this.state.isOnline || !this.state.isBackendConnected;
    const isNowOnline = isNetLive && isBackendLive;

    this.state.isOnline = isNetLive;
    this.state.isBackendConnected = isBackendLive;

    if (!isNetLive || !isBackendLive) {
      this.state.syncStatus = 'OFFLINE';
    } else if (this.state.syncStatus === 'OFFLINE') {
      this.state.syncStatus = 'IDLE';
    }

    this.notify();

    // If transitioned from offline to online, automatically drain pending queue!
    if (wasOffline && isNowOnline && this.state.pendingCount > 0) {
      this.flushQueue();
    }

    return isNowOnline;
  }

  // ─── OFFLINE MUTATION QUEUE MANAGEMENT ─────────────────────────────────────

  /** Enqueue a mutation to be executed when back online */
  public async enqueue(
    mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<QueuedMutation> {
    const newItem: QueuedMutation = {
      ...mutation,
      id: 'mut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    try {
      const queue = await this.getQueue();
      // Deduplicate: If an UPDATE for same entity is already in queue, merge payloads
      const existingIdx = queue.findIndex(
        (q) => q.entityId && q.entityId === newItem.entityId && q.action === newItem.action
      );

      if (existingIdx >= 0) {
        queue[existingIdx] = {
          ...queue[existingIdx],
          payload: { ...queue[existingIdx].payload, ...newItem.payload },
          createdAt: Date.now(),
          retryCount: 0,
        };
      } else {
        queue.push(newItem);
      }

      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.state.pendingCount = queue.length;
      this.notify();
    } catch (_) {}

    return newItem;
  }

  /** Read current queued mutations from AsyncStorage */
  public async getQueue(): Promise<QueuedMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (_) {}
    return [];
  }

  /** Remove a mutation from the queue */
  public async removeMutation(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((m) => m.id !== id);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
      this.state.pendingCount = filtered.length;
      this.notify();
    } catch (_) {}
  }

  /** Clear all items in queue */
  public async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      this.state.pendingCount = 0;
      this.notify();
    } catch (_) {}
  }

  // ─── CONFLICT RESOLUTION & QUEUE FLUSH ENGINE ──────────────────────────────

  /**
   * Drain the mutation queue sequentially.
   * Employs Deterministic Three-Way Field-Level Merging and Last-Write-Wins.
   */
  public async flushQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isProcessingQueue) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const isConnected = await this.checkNetworkStatus();
    if (!isConnected) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      this.state.syncStatus = 'SYNCED';
      this.notify();
      setTimeout(() => {
        if (this.state.syncStatus === 'SYNCED') {
          this.state.syncStatus = 'IDLE';
          this.notify();
        }
      }, 3000);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessingQueue = true;
    this.state.syncStatus = 'SYNCING';
    this.notify();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const remainingQueue: QueuedMutation[] = [];
    const apiBase = getApiBase();

    for (const item of queue) {
      processed++;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.activeToken) {
          headers.Authorization = `Bearer ${this.activeToken}`;
        }

        // 1. Conflict Detection for updates: Fetch current server version first
        let resolvedPayload = item.payload;

        if (
          (item.action === 'UPDATE_LEAD' || item.action === 'UPDATE_LEAD_STATUS') &&
          item.entityId &&
          !item.entityId.startsWith('lead-local-')
        ) {
          try {
            const checkRes = await fetch(`${apiBase}/leads/${item.entityId}`, {
              method: 'GET',
              headers,
            });

            if (checkRes.ok) {
              const serverLead = await checkRes.json();
              const serverUpdated = serverLead.updatedAt ? new Date(serverLead.updatedAt).getTime() : 0;

              // Check if server was updated after local mutation was made
              if (serverUpdated > item.createdAt) {
                // Three-way field level merge: Keep server updates for fields NOT touched by client
                resolvedPayload = {
                  ...serverLead,
                  ...item.payload,
                  // Client priority on user's intentional edits
                  status: item.payload.status || serverLead.status,
                  phone: item.payload.phone || serverLead.phone,
                  email: item.payload.email || serverLead.email,
                };

                // Record conflict resolution
                await this.logConflict({
                  id: 'conf_' + Date.now(),
                  entityId: item.entityId,
                  action: item.action,
                  clientPayload: item.payload,
                  serverState: serverLead,
                  resolvedAt: Date.now(),
                  strategy: 'MERGED_FIELD_LEVEL',
                  message: `Merged offline edits into newer server version for Lead ${item.entityId}`,
                });
              }
            } else if (checkRes.status === 404) {
              // Lead was deleted on server! Non-destructive archive
              await this.logConflict({
                id: 'conf_' + Date.now(),
                entityId: item.entityId,
                action: item.action,
                clientPayload: item.payload,
                resolvedAt: Date.now(),
                strategy: 'ARCHIVED',
                message: `Lead was removed on server. Preserved offline changes locally.`,
              });
              // Skip server push since entity does not exist
              succeeded++;
              continue;
            }
          } catch (_) {
            // If conflict inspection fails, proceed with original payload
          }
        }

        // 2. Execute network mutation
        const targetUrl = item.endpoint.startsWith('http')
          ? item.endpoint
          : `${apiBase}${item.endpoint.startsWith('/') ? '' : '/'}${item.endpoint}`;

        const res = await fetch(targetUrl, {
          method: item.method,
          headers,
          body: item.method === 'DELETE' && !resolvedPayload ? undefined : JSON.stringify(resolvedPayload),
        });

        if (res.ok || res.status === 201 || res.status === 204) {
          succeeded++;
          // If this was a lead creation or update, update local cache to marked synced
          if (item.entityId) {
            await this.markLeadSynced(item.entityId);
          }
        } else if (res.status >= 400 && res.status < 500 && res.status !== 408) {
          // Client error (validation / unprocessable): Don't retry endlessly, archive it
          failed++;
          await this.logConflict({
            id: 'conf_' + Date.now(),
            entityId: item.entityId || 'unknown',
            action: item.action,
            clientPayload: item.payload,
            resolvedAt: Date.now(),
            strategy: 'ARCHIVED',
            message: `Server returned HTTP ${res.status}: ${res.statusText}. Action archived.`,
          });
        } else {
          // Server error 5xx or network drop: keep in queue for next retry
          failed++;
          item.retryCount += 1;
          remainingQueue.push(item);
        }
      } catch (err: any) {
        failed++;
        item.retryCount += 1;
        item.lastError = err?.message || 'Network unreachable';
        remainingQueue.push(item);
      }
    }

    // Save remaining items back to queue
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
    this.state.pendingCount = remainingQueue.length;

    const now = Date.now();
    this.state.lastSyncTime = now;
    await AsyncStorage.setItem(LAST_SYNC_KEY, String(now));

    this.isProcessingQueue = false;
    this.state.syncStatus = remainingQueue.length > 0 ? 'OFFLINE' : 'SYNCED';
    this.notify();

    if (this.state.syncStatus === 'SYNCED') {
      setTimeout(() => {
        if (this.state.syncStatus === 'SYNCED') {
          this.state.syncStatus = 'IDLE';
          this.notify();
        }
      }, 3000);
    }

    return { processed, succeeded, failed };
  }

  /** Log a conflict record non-destructively for review/audit */
  private async logConflict(conflict: ConflictRecord) {
    try {
      const raw = await AsyncStorage.getItem(CONFLICT_ARCHIVE_KEY);
      const list: ConflictRecord[] = raw ? JSON.parse(raw) : [];
      list.unshift(conflict);
      // Keep last 50 conflict logs
      await AsyncStorage.setItem(CONFLICT_ARCHIVE_KEY, JSON.stringify(list.slice(0, 50)));
      this.state.activeConflictCount = list.length;
      this.notify();
    } catch (_) {}
  }

  // ─── CACHE-FIRST CORE DATA STORAGE ─────────────────────────────────────────

  /** Get cached leads for instant 0ms offline rendering */
  public async getCachedLeads(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_LEADS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const isMockLead = (l: any) => {
            if (!l) return true;
            const id = String(l.id || '');
            const name = String(l.name || '').toLowerCase();
            return (
              id.startsWith('lead-10') ||
              id === 'lead-1' ||
              name.includes('anand mahindra') ||
              name.includes('rajesh gopinathan') ||
              name.includes('sunil mittal') ||
              name.includes('karan adani') ||
              name.includes('priya sharma')
            );
          };
          return parsed.filter(l => !isMockLead(l));
        }
      }
    } catch (_) {}
    return [];
  }

  /** Save leads collection to local offline cache */
  public async saveCachedLeads(leads: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_LEADS_KEY, JSON.stringify(leads));
    } catch (_) {}
  }

  /** Upsert a single lead into the cache (optimistic UI update) */
  public async upsertCachedLead(lead: any, isOfflineDraft = false): Promise<void> {
    try {
      const leads = await this.getCachedLeads();
      const idx = leads.findIndex((l) => l.id === lead.id);
      const enhanced = {
        ...lead,
        _synced: !isOfflineDraft,
        _isOfflineDraft: isOfflineDraft,
        _updatedAt: Date.now(),
      };

      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...enhanced };
      } else {
        leads.unshift(enhanced);
      }

      await this.saveCachedLeads(leads);
    } catch (_) {}
  }

  /** Mark a cached lead as successfully synced */
  public async markLeadSynced(leadId: string): Promise<void> {
    try {
      const leads = await this.getCachedLeads();
      const idx = leads.findIndex((l) => l.id === leadId);
      if (idx >= 0) {
        leads[idx]._synced = true;
        leads[idx]._isOfflineDraft = false;
        await this.saveCachedLeads(leads);
      }
    } catch (_) {}
  }

  /** Remove lead from local cache */
  public async removeCachedLead(leadId: string): Promise<void> {
    try {
      const leads = await this.getCachedLeads();
      const filtered = leads.filter((l) => l.id !== leadId);
      await this.saveCachedLeads(filtered);
    } catch (_) {}
  }

  /** Get cached attendance records */
  public async getCachedAttendance(): Promise<Record<string, any>> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_ATTENDANCE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  /** Save attendance records to cache */
  public async saveCachedAttendance(records: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_ATTENDANCE_KEY, JSON.stringify(records));
    } catch (_) {}
  }

  /** Clean up on shutdown */
  public destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.listeners.clear();
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
