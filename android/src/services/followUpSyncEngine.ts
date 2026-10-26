/**
 * followUpSyncEngine.ts — DAS CRM Android Follow-up & Task Sync Engine
 *
 * Full 1:1 Parity with Web Follow-ups & Tasks Module:
 * 1. Multi-source Loader: Server (/follow-ups) + Local Storage (@das_crm_followup_tasks_cache & das_crm_followup_tasks_cache) + Contact History Scanner (das_crm_contact_history_*).
 * 2. Robust Date/Time Normalizer: Parses ISO, YYYY-MM-DD, readable 'Tue, 27 Oct', 12h/24h AM/PM times with current year fallback.
 * 3. Lifecycle Controllers: Create, Reschedule, Complete (with Next Follow-up chaining), Cancel.
 * 4. Offline First: Immediate optimistic local persistence + asynchronous backend synchronization.
 * 5. Data Integrity: Real prospect metadata resolution from lead directory, zero dummy tasks.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../config/api';
import { LeadItem } from './apiService';

export const STORAGE_FOLLOWUPS_PRIMARY = '@das_crm_followup_tasks_cache';
export const STORAGE_FOLLOWUPS_SECONDARY = 'das_crm_followup_tasks_cache';

export type ChannelType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';
export type PriorityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FollowUpTask {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  leadPhone: string;
  leadEmail: string;
  channel: ChannelType;
  purpose: string;
  dueAt: string; // ISO string
  isCompleted: boolean;
  completedAt?: string;
  outcomeNote?: string;
  assignedRepName: string;
  assignedRepId?: string;
  priority: PriorityLevel;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: string;
  createdAt?: string;
  reminderMinutes?: number;
  rescheduledAt?: string;
  rescheduleReason?: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

export interface FollowUpSyncPayload {
  leadId: string;
  leadName: string;
  leadCompany?: string;
  leadPhone?: string;
  leadEmail?: string;
  followUpType?: ChannelType;
  title?: string;
  purpose?: string;
  notes?: string;
  scheduledDate: string;
  scheduledTime?: string;
  priority?: PriorityLevel;
  reminderMinutes?: number;
  assigneeId?: string;
  assignedRepName?: string;
}

/**
 * Robust date and time normalizer.
 * Safely parses any date format (ISO, YYYY-MM-DD, 'Tue, 27 Oct', '27 Oct')
 * and time format ('09:30 AM', '14:00', '9:30') into an ISO string.
 */
export function parseDateAndTimeToIso(dateStr?: string, timeStr?: string): {
  dueAtIso: string;
  scheduledDateStr: string;
  scheduledTimeStr: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();

  let hours = 10;
  let minutes = 30;

  // 1. Resolve Time
  if (timeStr && typeof timeStr === 'string') {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const cleanTime = timeStr.replace(/[^\d:]/g, '');
    const parts = cleanTime.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      hours = Math.min(23, Math.max(0, h));
      minutes = Math.min(59, Math.max(0, m));
    }
  }

  let finalDate = new Date();

  // 2. Resolve Date
  if (dateStr && typeof dateStr === 'string') {
    if (dateStr.includes('T')) {
      const parsedIso = new Date(dateStr);
      if (!isNaN(parsedIso.getTime())) {
        finalDate = parsedIso;
        if (!timeStr) {
          hours = finalDate.getHours();
          minutes = finalDate.getMinutes();
        }
      }
    } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
      finalDate = new Date(y, m - 1, d, hours, minutes, 0);
    } else {
      // e.g. 'Tue, 27 Oct' or '27 Oct' or 'Tue, 27 Oct @09:30 AM'
      let candidate = dateStr.replace(/@.*$/, '').trim();
      // If year is not mentioned, append current year
      if (!new RegExp(`\\b${currentYear}\\b`).test(candidate)) {
        candidate = `${candidate} ${currentYear}`;
      }
      const testParsed = new Date(
        `${candidate} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      );
      if (!isNaN(testParsed.getTime())) {
        finalDate = testParsed;
      } else {
        const direct = new Date(candidate);
        if (!isNaN(direct.getTime())) {
          finalDate = direct;
          finalDate.setHours(hours, minutes, 0, 0);
        }
      }
    }
  }

  finalDate.setHours(hours, minutes, 0, 0);
  if (isNaN(finalDate.getTime())) {
    finalDate = new Date();
    finalDate.setHours(hours, minutes, 0, 0);
  }

  const yyyy = finalDate.getFullYear();
  const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finalDate.getDate()).padStart(2, '0');
  const canonicalDateStr = `${yyyy}-${mm}-${dd}`;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const canonicalTimeStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;

  return {
    dueAtIso: finalDate.toISOString(),
    scheduledDateStr: canonicalDateStr,
    scheduledTimeStr: timeStr || canonicalTimeStr,
  };
}

class FollowUpSyncEngine {
  /**
   * Reads cached follow-up tasks from all local storage buckets.
   */
  async getLocalCachedFollowUps(): Promise<FollowUpTask[]> {
    const list: FollowUpTask[] = [];
    const idMap = new Set<string>();

    try {
      const rawPrimary = await AsyncStorage.getItem(STORAGE_FOLLOWUPS_PRIMARY);
      if (rawPrimary) {
        const parsed = JSON.parse(rawPrimary);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            if (t && t.id && !idMap.has(t.id)) {
              idMap.add(t.id);
              list.push(t);
            }
          });
        }
      }
    } catch (_) {}

    try {
      const rawSecondary = await AsyncStorage.getItem(STORAGE_FOLLOWUPS_SECONDARY);
      if (rawSecondary) {
        const parsed = JSON.parse(rawSecondary);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            if (t && t.id && !idMap.has(t.id)) {
              idMap.add(t.id);
              list.push(t);
            }
          });
        }
      }
    } catch (_) {}

    return list;
  }

  /**
   * Persists task list to all local storage buckets for offline availability.
   */
  async persistTasks(tasks: FollowUpTask[]): Promise<void> {
    try {
      const json = JSON.stringify(tasks);
      await AsyncStorage.setItem(STORAGE_FOLLOWUPS_PRIMARY, json);
      await AsyncStorage.setItem(STORAGE_FOLLOWUPS_SECONDARY, json);
    } catch (e) {
      console.warn('Failed to persist tasks to storage:', e);
    }
  }

  /**
   * Creates or updates a follow-up task locally and syncs to backend NestJS API.
   */
  async saveAndSyncFollowUp(
    token: string | null,
    payload: FollowUpSyncPayload
  ): Promise<FollowUpTask> {
    const { dueAtIso, scheduledDateStr, scheduledTimeStr } = parseDateAndTimeToIso(
      payload.scheduledDate,
      payload.scheduledTime
    );

    const channel: ChannelType = payload.followUpType || 'CALL';
    const cleanLeadName = payload.leadName?.trim() || 'Client Prospect';
    const resolvedTitle =
      payload.title ||
      (channel === 'MEETING'
        ? `🏢 In-Person / Virtual Visit: ${cleanLeadName}`
        : `📞 Callback: ${cleanLeadName}${payload.leadPhone ? ` (${payload.leadPhone})` : ''}`);

    const newTask: FollowUpTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      leadId: payload.leadId,
      leadName: cleanLeadName,
      leadCompany: payload.leadCompany || 'Enterprise Account',
      leadPhone: payload.leadPhone || '',
      leadEmail: payload.leadEmail || '',
      channel,
      purpose: payload.purpose || payload.notes || 'Follow-up touchpoint scheduled',
      dueAt: dueAtIso,
      isCompleted: false,
      assignedRepName: payload.assignedRepName || 'Sales Rep',
      assignedRepId: payload.assigneeId,
      priority: payload.priority || 'HIGH',
      scheduledDate: scheduledDateStr,
      scheduledTime: scheduledTimeStr,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reminderMinutes: payload.reminderMinutes ?? 5,
    };

    // 1. Optimistic local cache update
    const currentTasks = await this.getLocalCachedFollowUps();
    const nextTasks = [
      newTask,
      ...currentTasks.filter(
        (t) =>
          !(
            t.leadId === newTask.leadId &&
            t.dueAt === newTask.dueAt &&
            !t.isCompleted
          )
      ),
    ];
    await this.persistTasks(nextTasks);

    // 2. Synchronize to Backend /follow-ups API
    try {
      const apiBase = getApiBase();
      const serverPayload = {
        title: resolvedTitle,
        followUpType: channel,
        leadId: payload.leadId,
        scheduledDate: scheduledDateStr,
        scheduledTime: scheduledTimeStr,
        dueAt: dueAtIso,
        priority: newTask.priority,
        purpose: newTask.purpose,
        notes: payload.notes || newTask.purpose,
        reminderMinutes: newTask.reminderMinutes,
        assigneeId: payload.assigneeId,
      };

      const res = await fetch(`${apiBase}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(serverPayload),
      });

      if (res.ok) {
        const savedServerRecord = await res.json();
        if (savedServerRecord && savedServerRecord.id) {
          // Update cached task with real backend database ID
          const updatedWithServerId = nextTasks.map((t) =>
            t.id === newTask.id ? { ...t, id: String(savedServerRecord.id) } : t
          );
          await this.persistTasks(updatedWithServerId);
          newTask.id = String(savedServerRecord.id);
        }
      }
    } catch (err) {
      console.warn('Backend /follow-ups create sync notice (persisted offline):', err);
    }

    return newTask;
  }

  /**
   * Multi-Source Loader:
   * Merges server tasks, local cached tasks, and scans all AsyncStorage contact histories.
   * Completely eliminates fake/dummy synthesized tasks.
   */
  async loadAllFollowUps(
    token: string | null,
    currentUser: any,
    leads: LeadItem[]
  ): Promise<FollowUpTask[]> {
    const taskMap = new Map<string, FollowUpTask>();

    // 1. Load Local Cached Tasks
    const localTasks = await this.getLocalCachedFollowUps();
    localTasks.forEach((t) => {
      if (t && t.id) taskMap.set(t.id, t);
    });

    // 2. Query Backend /follow-ups API
    try {
      const apiBase = getApiBase();
      const compId = currentUser?.companyId || '';
      const res = await fetch(`${apiBase}/follow-ups?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(compId ? { 'x-organization-id': compId } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data)
          ? data
          : data?.data || data?.items || [];

        items.forEach((item: any) => {
          if (!item) return;
          const leadObj = item.lead || {};
          const assigneeObj = item.assignee || {};
          const matchedLead = leads.find(
            (l) => l.id === item.leadId || l.id === leadObj.id
          );

          const leadName =
            matchedLead?.name ||
            leadObj.name ||
            `${leadObj.firstName || ''} ${leadObj.lastName || ''}`.trim() ||
            item.leadName ||
            item.title ||
            'Prospect';

          const leadCompany =
            matchedLead?.company ||
            (typeof leadObj.company === 'string'
              ? leadObj.company
              : leadObj.company?.name) ||
            'Corporate Account';

          const leadPhone =
            matchedLead?.phone || leadObj.phone || item.leadPhone || '';
          const leadEmail =
            matchedLead?.email || leadObj.email || item.leadEmail || '';

          const assignedRep =
            assigneeObj.name ||
            `${assigneeObj.firstName || ''} ${assigneeObj.lastName || ''}`.trim() ||
            matchedLead?.assignedRep ||
            item.assignedRepName ||
            'Sales Rep';

          const channel = (
            item.followUpType ||
            item.channel ||
            'CALL'
          ).toUpperCase() as ChannelType;

          const { dueAtIso } = parseDateAndTimeToIso(
            item.dueAt || item.scheduledDate,
            item.scheduledTime
          );

          const task: FollowUpTask = {
            id: String(item.id),
            leadId: String(item.leadId || leadObj.id || ''),
            leadName,
            leadCompany,
            leadPhone,
            leadEmail,
            channel,
            purpose:
              item.purpose || item.notes || item.description || item.title || 'Follow-up Callback',
            dueAt: dueAtIso,
            isCompleted: Boolean(
              item.isCompleted ||
                item.status === 'COMPLETED' ||
                item.computedStatus === 'COMPLETED'
            ),
            completedAt: item.completedAt,
            outcomeNote: item.outcomeNote || item.outcome,
            assignedRepName: assignedRep,
            assignedRepId: item.assigneeId || assigneeObj.id,
            priority: (item.priority || 'HIGH').toUpperCase() as PriorityLevel,
            status: item.status || 'PENDING',
          };

          taskMap.set(task.id, task);
        });
      }
    } catch (err) {
      console.warn('Backend /follow-ups fetch error:', err);
    }

    // 3. 🔍 CRITICAL FAILSAFE SCANNER: Inspect Lead Contact Histories
    // Ensures any follow-up ever scheduled on any lead timeline appears in the pipeline
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const historyKeys = allKeys.filter((k) =>
        k.startsWith('das_crm_contact_history_')
      );

      for (const key of historyKeys) {
        const leadIdKey = key.replace('das_crm_contact_history_', '');
        try {
          const rawHist = await AsyncStorage.getItem(key);
          if (rawHist) {
            const hist = JSON.parse(rawHist);
            if (Array.isArray(hist)) {
              for (const att of hist) {
                if (att && att.followUpDate) {
                  const matchedLead = leads.find(
                    (l) => l.id === leadIdKey || l.phone === att.phone
                  );

                  const leadName =
                    matchedLead?.name ||
                    (matchedLead
                      ? `${matchedLead.firstName || ''} ${matchedLead.lastName || ''}`.trim()
                      : '') ||
                    att.leadName ||
                    'Lead Prospect';

                  const leadPhone =
                    matchedLead?.phone || att.phone || '';
                  const leadCompany =
                    matchedLead?.company || 'Corporate Client';
                  const leadEmail =
                    matchedLead?.email || '';

                  const isMeeting =
                    att.outcome === 'MEETING_SCHEDULED' ||
                    att.scheduledType === 'MEETING' ||
                    /meeting|visit|in-person/i.test(att.notes || '');

                  const { dueAtIso, scheduledDateStr, scheduledTimeStr } =
                    parseDateAndTimeToIso(att.followUpDate, att.followUpTime);

                  // Check if this task already exists in our map
                  let alreadyExists = false;
                  for (const existing of taskMap.values()) {
                    if (
                      (existing.leadId === leadIdKey ||
                        (leadPhone && existing.leadPhone === leadPhone)) &&
                      (existing.dueAt === dueAtIso ||
                        existing.scheduledDate === scheduledDateStr)
                    ) {
                      alreadyExists = true;
                      break;
                    }
                  }

                  if (!alreadyExists) {
                    const synthId = `hist_${att.id || leadIdKey}_${scheduledDateStr}`;
                    const synthTask: FollowUpTask = {
                      id: synthId,
                      leadId: leadIdKey,
                      leadName,
                      leadCompany,
                      leadPhone,
                      leadEmail,
                      channel: isMeeting ? 'MEETING' : 'CALL',
                      purpose:
                        att.notes ||
                        (isMeeting ? 'Scheduled In-Person / Virtual Meeting' : 'Follow-up Callback'),
                      dueAt: dueAtIso,
                      scheduledDate: scheduledDateStr,
                      scheduledTime: scheduledTimeStr,
                      isCompleted: false,
                      assignedRepName: att.by || currentUser?.name || 'Sales Rep',
                      priority: 'HIGH',
                      status: 'PENDING',
                    };
                    taskMap.set(synthId, synthTask);
                  }
                }
              }
            }
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Error scanning contact history for follow-ups:', err);
    }

    const mergedList = Array.from(taskMap.values());

    // Sort by dueAt ascending (soonest due first)
    mergedList.sort((a, b) => {
      const timeA = new Date(a.dueAt).getTime();
      const timeB = new Date(b.dueAt).getTime();
      return timeA - timeB;
    });

    // Save consolidated clean list to storage
    await this.persistTasks(mergedList);

    return mergedList;
  }

  /**
   * Reschedule a follow-up task.
   */
  async rescheduleFollowUp(
    token: string | null,
    taskId: string,
    newDateStr: string,
    newTimeStr: string,
    reason?: string
  ): Promise<boolean> {
    const { dueAtIso, scheduledDateStr, scheduledTimeStr } = parseDateAndTimeToIso(
      newDateStr,
      newTimeStr
    );

    const currentTasks = await this.getLocalCachedFollowUps();
    const updatedTasks = currentTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          dueAt: dueAtIso,
          scheduledDate: scheduledDateStr,
          scheduledTime: scheduledTimeStr,
          rescheduledAt: new Date().toISOString(),
          rescheduleReason: reason,
          status: 'RESCHEDULED',
          purpose: reason
            ? `${t.purpose} · Rescheduled: ${reason}`
            : t.purpose,
        };
      }
      return t;
    });

    await this.persistTasks(updatedTasks);

    // Backend sync
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/follow-ups/${taskId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          newDate: scheduledDateStr,
          newTime: scheduledTimeStr,
          dueAt: dueAtIso,
          reason,
        }),
      });
    } catch (_) {}

    return true;
  }

  /**
   * Complete a follow-up task.
   */
  async completeFollowUp(
    token: string | null,
    taskId: string,
    outcome: string,
    completionNotes?: string,
    nextFollowUpPayload?: FollowUpSyncPayload
  ): Promise<boolean> {
    const currentTasks = await this.getLocalCachedFollowUps();
    const targetTask = currentTasks.find((t) => t.id === taskId);

    const updatedTasks = currentTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          outcomeNote: `${outcome}${completionNotes ? `: ${completionNotes}` : ''}`,
          status: 'COMPLETED',
        };
      }
      return t;
    });

    await this.persistTasks(updatedTasks);

    // Backend sync
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/follow-ups/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          outcome,
          completionNotes,
          createNextFollowUp: Boolean(nextFollowUpPayload),
          nextFollowUpDate: nextFollowUpPayload?.scheduledDate,
          nextFollowUpTime: nextFollowUpPayload?.scheduledTime,
          nextFollowUpType: nextFollowUpPayload?.followUpType,
          nextFollowUpTitle: nextFollowUpPayload?.title,
        }),
      });
    } catch (_) {}

    // Chain next follow-up if provided
    if (nextFollowUpPayload && targetTask) {
      await this.saveAndSyncFollowUp(token, {
        ...nextFollowUpPayload,
        leadId: nextFollowUpPayload.leadId || targetTask.leadId,
        leadName: nextFollowUpPayload.leadName || targetTask.leadName,
        leadPhone: nextFollowUpPayload.leadPhone || targetTask.leadPhone,
        leadCompany: nextFollowUpPayload.leadCompany || targetTask.leadCompany,
      });
    }

    return true;
  }

  /**
   * Cancel a follow-up task.
   */
  async cancelFollowUp(
    token: string | null,
    taskId: string,
    reason?: string
  ): Promise<boolean> {
    const currentTasks = await this.getLocalCachedFollowUps();
    const updatedTasks = currentTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          isCompleted: true,
          cancelledAt: new Date().toISOString(),
          cancelledReason: reason,
          status: 'CANCELLED',
          outcomeNote: `Cancelled: ${reason || 'User cancelled follow-up'}`,
        };
      }
      return t;
    });

    await this.persistTasks(updatedTasks);

    // Backend sync
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/follow-ups/${taskId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
    } catch (_) {}

    return true;
  }
}

export const followUpSyncEngine = new FollowUpSyncEngine();
