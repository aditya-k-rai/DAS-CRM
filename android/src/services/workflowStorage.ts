import AsyncStorage from '@react-native-async-storage/async-storage';

export const WORKFLOW_STORAGE_KEY = '@das_crm_workflow_config_v2';

export interface LeadStatusItem {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  icon?: string;
  desc?: string;
}

export interface PipelineStageItem {
  id: string;
  name: string;
  probability: number;
  color: string;
}

export const DEFAULT_ANDROID_STATUSES: LeadStatusItem[] = [
  { id: '1', name: 'NEW LEAD', color: '#6366f1', isDefault: true, icon: '🎯', desc: 'Fresh prospective inquiry received' },
  { id: '2', name: 'CONTACTED', color: '#fbbf24', isDefault: false, icon: '📞', desc: 'Direct call or chat discussion completed' },
  { id: '3', name: 'QUALIFIED', color: '#3b82f6', isDefault: false, icon: '⭐', desc: 'Budget & requirement criteria confirmed' },
  { id: '4', name: 'PROPOSAL', color: '#818cf8', isDefault: false, icon: '📄', desc: 'Formal quotation proposal deck dispatched' },
  { id: '5', name: 'IN NEGOTIATION', color: '#ec4899', isDefault: false, icon: '🤝', desc: 'Product presented & discussing pricing/terms' },
  { id: '6', name: 'MEETING SCHEDULED', color: '#a855f7', isDefault: false, icon: '📅', desc: 'Product demo / physical visit scheduled' },
  { id: '7', name: 'WON', color: '#34d399', isDefault: false, isWon: true, icon: '🎉', desc: 'Deal finalized & payment cleared' },
  { id: '8', name: 'LOST', color: '#ef4444', isDefault: false, isLost: true, icon: '❌', desc: 'Lead dropped / not interested' },
];

export const DEFAULT_ANDROID_PIPELINE_STAGES: PipelineStageItem[] = [
  { id: 'ps-1', name: 'Discovery Call', probability: 15, color: '#6366f1' },
  { id: 'ps-2', name: 'Qualified Demo', probability: 40, color: '#3b82f6' },
  { id: 'ps-3', name: 'Proposal Sent', probability: 65, color: '#8b5cf6' },
  { id: 'ps-4', name: 'Negotiation', probability: 85, color: '#ec4899' },
  { id: 'ps-5', name: 'Closed Won', probability: 100, color: '#34d399' },
];

/** Retrieve configured lead statuses from AsyncStorage or defaults */
export async function getStoredStatuses(): Promise<LeadStatusItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.statuses) && parsed.statuses.length > 0) {
        return parsed.statuses.map((s: any, idx: number) => ({
          id: s.id || String(idx + 1),
          name: s.name,
          color: s.color || '#6366f1',
          isDefault: !!s.isDefault,
          isWon: !!s.isWon,
          isLost: !!s.isLost,
          icon: s.icon || (s.isWon ? '🎉' : s.isLost ? '❌' : s.isDefault ? '🎯' : '📌'),
          desc: s.desc || `Stage: ${s.name}`,
        }));
      }
    }
  } catch (err) {
    console.warn('Error reading stored statuses:', err);
  }
  return DEFAULT_ANDROID_STATUSES;
}

/** Retrieve configured pipeline stages from AsyncStorage or defaults */
export async function getStoredPipelineStages(): Promise<PipelineStageItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.pipelineStages) && parsed.pipelineStages.length > 0) {
        return parsed.pipelineStages;
      }
    }
  } catch (err) {
    console.warn('Error reading stored pipeline stages:', err);
  }
  return DEFAULT_ANDROID_PIPELINE_STAGES;
}
