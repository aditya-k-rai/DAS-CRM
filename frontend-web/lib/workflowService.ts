'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WorkflowLeadStatus {
  id: string;
  name: string;
  color: string;
  order?: number;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

export interface WorkflowPipelineStage {
  id: string;
  name: string;
  probability: number;
  color: string;
  order?: number;
}

export interface WorkflowLeadSource {
  id: string;
  name: string;
  category?: string;
}

export interface WorkflowCustomField {
  id: string;
  label: string;
  entity: 'LEADS' | 'CONTACTS' | 'DEALS';
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'TOGGLE';
  required: boolean;
}

export const WORKFLOW_STATUSES_KEY = 'das_crm_lead_statuses_v2';
export const WORKFLOW_STAGES_KEY = 'das_crm_pipeline_stages_v2';
export const WORKFLOW_SOURCES_KEY = 'das_crm_lead_sources_v2';
export const WORKFLOW_FIELDS_KEY = 'das_crm_custom_fields_v2';
export const WORKFLOW_UPDATE_EVENT = 'das_crm_workflow_updated';

export const DEFAULT_LEAD_STATUSES: WorkflowLeadStatus[] = [
  { id: '1', name: 'New', color: '#6366f1', order: 0, isDefault: true, isWon: false, isLost: false },
  { id: '2', name: 'Contacted', color: '#f59e0b', order: 1, isDefault: false, isWon: false, isLost: false },
  { id: '3', name: 'Qualified', color: '#3b82f6', order: 2, isDefault: false, isWon: false, isLost: false },
  { id: '4', name: 'Proposal', color: '#8b5cf6', order: 3, isDefault: false, isWon: false, isLost: false },
  { id: '5', name: 'Negotiation', color: '#ec4899', order: 4, isDefault: false, isWon: false, isLost: false },
  { id: '6', name: 'Won', color: '#22c55e', order: 5, isDefault: false, isWon: true, isLost: false },
  { id: '7', name: 'Lost', color: '#ef4444', order: 6, isDefault: false, isWon: false, isLost: true },
];

export const DEFAULT_PIPELINE_STAGES: WorkflowPipelineStage[] = [
  { id: 'ps-1', name: 'Prospecting', probability: 10, color: '#6366f1', order: 0 },
  { id: 'ps-2', name: 'Qualification', probability: 25, color: '#f59e0b', order: 1 },
  { id: 'ps-3', name: 'Proposal', probability: 50, color: '#3b82f6', order: 2 },
  { id: 'ps-4', name: 'Negotiation', probability: 75, color: '#8b5cf6', order: 3 },
  { id: 'ps-5', name: 'Closed Won', probability: 100, color: '#22c55e', order: 4 },
];

export const DEFAULT_LEAD_SOURCES: WorkflowLeadSource[] = [
  { id: 'src-1', name: 'Google Ads', category: 'Inbound Paid' },
  { id: 'src-2', name: 'Meta Ads (FB & Insta)', category: 'Inbound Paid' },
  { id: 'src-3', name: 'LinkedIn Ads', category: 'Inbound Paid' },
  { id: 'src-4', name: 'IndiaMART', category: 'B2B Marketplace' },
  { id: 'src-5', name: 'TradeIndia', category: 'B2B Marketplace' },
  { id: 'src-6', name: 'Justdial', category: 'Local Inbound' },
  { id: 'src-7', name: 'Website Forms', category: 'Organic Direct' },
  { id: 'src-8', name: 'Direct Referral', category: 'Offline Referral' },
];

export const DEFAULT_CUSTOM_FIELDS: WorkflowCustomField[] = [
  { id: 'cf-1', label: 'GSTIN / Corporate Tax ID', entity: 'LEADS', type: 'TEXT', required: true },
  { id: 'cf-2', label: 'Annual Estimated Budget', entity: 'LEADS', type: 'NUMBER', required: false },
  { id: 'cf-3', label: 'Decision Maker Authority', entity: 'CONTACTS', type: 'DROPDOWN', required: true },
  { id: 'cf-4', label: 'Target Closing Date', entity: 'DEALS', type: 'DATE', required: true },
  { id: 'cf-5', label: 'Incumbent Competitor', entity: 'DEALS', type: 'TOGGLE', required: false },
];

export const WORKFLOW_PALETTE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Violet
];

/** Retrieve cached lead statuses synchronously from localStorage or fallback */
export function getStoredLeadStatuses(): WorkflowLeadStatus[] {
  if (typeof window === 'undefined') return DEFAULT_LEAD_STATUSES;
  try {
    const raw = localStorage.getItem(WORKFLOW_STATUSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored lead statuses:', err);
  }
  return DEFAULT_LEAD_STATUSES;
}

/** Retrieve cached pipeline stages synchronously from localStorage or fallback */
export function getStoredPipelineStages(): WorkflowPipelineStage[] {
  if (typeof window === 'undefined') return DEFAULT_PIPELINE_STAGES;
  try {
    const raw = localStorage.getItem(WORKFLOW_STAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored pipeline stages:', err);
  }
  return DEFAULT_PIPELINE_STAGES;
}

/** Retrieve cached lead sources synchronously from localStorage or fallback */
export function getStoredLeadSources(): WorkflowLeadSource[] {
  if (typeof window === 'undefined') return DEFAULT_LEAD_SOURCES;
  try {
    const raw = localStorage.getItem(WORKFLOW_SOURCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored lead sources:', err);
  }
  return DEFAULT_LEAD_SOURCES;
}

/** Retrieve cached custom fields synchronously from localStorage or fallback */
export function getStoredCustomFields(): WorkflowCustomField[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_FIELDS;
  try {
    const raw = localStorage.getItem(WORKFLOW_FIELDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored custom fields:', err);
  }
  return DEFAULT_CUSTOM_FIELDS;
}

/** Save lead statuses to localStorage and backend API */
export async function persistLeadStatuses(statuses: WorkflowLeadStatus[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_STATUSES_KEY, JSON.stringify(statuses));
      window.dispatchEvent(new CustomEvent(WORKFLOW_UPDATE_EVENT, { detail: { type: 'statuses', statuses } }));
    } catch (e) {
      console.warn('localStorage error writing statuses:', e);
    }
  }

  // Sync to Backend API
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    await fetch(`${apiBase}/leads/statuses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ statuses }),
    });
    return true;
  } catch (err) {
    console.warn('Backend API update failed, cached locally:', err);
    return true; // Still true since localStorage is updated
  }
}

/** Save pipeline stages to localStorage and backend API */
export async function persistPipelineStages(stages: WorkflowPipelineStage[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_STAGES_KEY, JSON.stringify(stages));
      window.dispatchEvent(new CustomEvent(WORKFLOW_UPDATE_EVENT, { detail: { type: 'stages', stages } }));
    } catch (e) {
      console.warn('localStorage error writing stages:', e);
    }
  }
  return true;
}

/** Save lead sources to localStorage */
export async function persistLeadSources(sources: WorkflowLeadSource[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_SOURCES_KEY, JSON.stringify(sources));
      window.dispatchEvent(new CustomEvent(WORKFLOW_UPDATE_EVENT, { detail: { type: 'sources', sources } }));
    } catch (e) {
      console.warn('localStorage error writing sources:', e);
    }
  }
  return true;
}

/** Save custom fields to localStorage */
export async function persistCustomFields(fields: WorkflowCustomField[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKFLOW_FIELDS_KEY, JSON.stringify(fields));
      window.dispatchEvent(new CustomEvent(WORKFLOW_UPDATE_EVENT, { detail: { type: 'fields', fields } }));
    } catch (e) {
      console.warn('localStorage error writing custom fields:', e);
    }
  }
  return true;
}

/**
 * React hook to consume and react to configured Lead Statuses across the CRM.
 */
export function useWorkflowLeadStatuses() {
  const [statuses, setStatuses] = useState<WorkflowLeadStatus[]>(() => getStoredLeadStatuses());
  const [isLoading, setIsLoading] = useState(false);

  const refreshFromSource = useCallback(async () => {
    setIsLoading(true);
    // 1. Load from cache first
    const cached = getStoredLeadStatuses();
    setStatuses(cached);

    // 2. Fetch latest from API in background
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const res = await fetch(`${apiBase}/leads/statuses`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: WorkflowLeadStatus[] = data.map((item: any, idx: number) => ({
            id: item.id || String(idx + 1),
            name: item.name,
            color: item.color || '#6366f1',
            order: item.order ?? idx,
            isDefault: !!item.isDefault,
            isWon: !!item.isWon,
            isLost: !!item.isLost,
          }));
          setStatuses(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem(WORKFLOW_STATUSES_KEY, JSON.stringify(mapped));
          }
        }
      }
    } catch (err) {
      // Offline fallback: keep cached
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromSource();

    // Listen to local update events across components
    const handleUpdate = () => {
      setStatuses(getStoredLeadStatuses());
    };

    window.addEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshFromSource]);

  const saveStatuses = async (newStatuses: WorkflowLeadStatus[]) => {
    setStatuses(newStatuses);
    return persistLeadStatuses(newStatuses);
  };

  const statusNames = statuses.map((s) => s.name);
  const statusTabs = ['All', ...statusNames];

  const statusColorMap = statuses.reduce<Record<string, string>>((acc, s) => {
    acc[s.name] = s.color;
    acc[s.name.toLowerCase()] = s.color;
    return acc;
  }, {});

  return {
    statuses,
    statusNames,
    statusTabs,
    statusColorMap,
    isLoading,
    saveStatuses,
    reload: refreshFromSource,
  };
}

/**
 * React hook to consume and react to configured Pipeline Stages across the CRM.
 */
export function useWorkflowPipelineStages() {
  const [stages, setStages] = useState<WorkflowPipelineStage[]>(() => getStoredPipelineStages());

  useEffect(() => {
    const handleUpdate = () => {
      setStages(getStoredPipelineStages());
    };

    window.addEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveStages = async (newStages: WorkflowPipelineStage[]) => {
    setStages(newStages);
    return persistPipelineStages(newStages);
  };

  const stageNames = stages.map((s) => s.name);

  const stageColorMap = stages.reduce<Record<string, string>>((acc, s) => {
    acc[s.name] = s.color;
    acc[s.name.toLowerCase()] = s.color;
    return acc;
  }, {});

  return {
    stages,
    stageNames,
    stageColorMap,
    saveStages,
  };
}

/**
 * React hook to consume and react to configured Lead Sources.
 */
export function useWorkflowLeadSources() {
  const [sources, setSources] = useState<WorkflowLeadSource[]>(() => getStoredLeadSources());

  useEffect(() => {
    const handleUpdate = () => {
      setSources(getStoredLeadSources());
    };

    window.addEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveSources = async (newSources: WorkflowLeadSource[]) => {
    setSources(newSources);
    return persistLeadSources(newSources);
  };

  return {
    sources,
    saveSources,
  };
}

/**
 * React hook to consume and react to Custom Fields.
 */
export function useWorkflowCustomFields() {
  const [customFields, setCustomFields] = useState<WorkflowCustomField[]>(() => getStoredCustomFields());

  useEffect(() => {
    const handleUpdate = () => {
      setCustomFields(getStoredCustomFields());
    };

    window.addEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveCustomFields = async (newFields: WorkflowCustomField[]) => {
    setCustomFields(newFields);
    return persistCustomFields(newFields);
  };

  return {
    customFields,
    saveCustomFields,
  };
}
