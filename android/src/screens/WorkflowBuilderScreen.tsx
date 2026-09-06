/**
 * WorkflowBuilderScreen.tsx — DAS CRM Android
 * Complete Admin Workflow & Lifecycle Control Engine.
 * Features:
 *   1. Admin-Only Zone Banner
 *   2. Lead Statuses (Reorder, inline edit, 10-color palette selector, default/won/lost flags, add/delete)
 *   3. Pipeline Stages (Win probabilities, stage colors, reorder, add/delete)
 *   4. Lead Sources (Active toggles, icon selection, add/delete)
 *   5. Custom Fields (Entity: Leads/Contacts/Deals, Type: Text/Number/Dropdown/Date/Toggle, Required flags)
 *   6. Automation Rules Engine (Trigger -> IF Condition -> THEN Action, run logs, detail modals)
 *   7. AsyncStorage persistence for organization-wide lifecycle state.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  BackHandler,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const WORKFLOW_STORAGE_KEY = '@das_crm_workflow_config_v2';
const STORAGE_KEY = WORKFLOW_STORAGE_KEY;

// ─── Color Palette (Matching Web COLORS) ──────────────────────────────────────
const COLORS = [
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

// ─── Data Interfaces ──────────────────────────────────────────────────────────
export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  color: string;
}

export interface LeadSource {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface CustomField {
  id: string;
  label: string;
  entity: 'LEADS' | 'CONTACTS' | 'DEALS';
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'TOGGLE';
  required: boolean;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggerLabel: string;
  conditionLabel: string;
  actionLabel: string;
  isActive: boolean;
  runCount: number;
  lastRunStr: string;
  color: string;
}

// ─── Initial Presets ─────────────────────────────────────────────────────────
const DEFAULT_STATUSES: LeadStatus[] = [
  { id: '1', name: 'New', color: '#6366f1', isDefault: true, isWon: false, isLost: false },
  { id: '2', name: 'Contacted', color: '#f59e0b', isDefault: false, isWon: false, isLost: false },
  { id: '3', name: 'Qualified', color: '#3b82f6', isDefault: false, isWon: false, isLost: false },
  { id: '4', name: 'Proposal', color: '#8b5cf6', isDefault: false, isWon: false, isLost: false },
  { id: '5', name: 'Negotiation', color: '#ec4899', isDefault: false, isWon: false, isLost: false },
  { id: '6', name: 'Won', color: '#22c55e', isDefault: false, isWon: true, isLost: false },
  { id: '7', name: 'Lost', color: '#ef4444', isDefault: false, isWon: false, isLost: true },
];

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'ps-1', name: 'Discovery Call', probability: 10, color: '#6366f1' },
  { id: 'ps-2', name: 'Demo Scheduled', probability: 30, color: '#3b82f6' },
  { id: 'ps-3', name: 'Proposal Sent', probability: 60, color: '#8b5cf6' },
  { id: 'ps-4', name: 'Contract Negotiation', probability: 80, color: '#ec4899' },
  { id: 'ps-5', name: 'Closed Won', probability: 100, color: '#22c55e' },
  { id: 'ps-6', name: 'Closed Lost', probability: 0, color: '#ef4444' },
];

const DEFAULT_LEAD_SOURCES: LeadSource[] = [
  { id: 'ls-1', name: 'Website Contact Form', icon: '🌐', isActive: true },
  { id: 'ls-2', name: 'WhatsApp Cloud Inbound', icon: '💬', isActive: true },
  { id: 'ls-3', name: 'Customer & Partner Referral', icon: '👥', isActive: true },
  { id: 'ls-4', name: 'Cold Calling & Outbound', icon: '📞', isActive: true },
  { id: 'ls-5', name: 'LinkedIn Sales Navigator', icon: '💼', isActive: true },
  { id: 'ls-6', name: 'Google Search & Meta Ads', icon: '🎯', isActive: true },
  { id: 'ls-7', name: 'Trade Show & Expo Event', icon: '🎪', isActive: true },
];

const DEFAULT_CUSTOM_FIELDS: CustomField[] = [
  { id: 'cf-1', label: 'GSTIN / Corporate Tax ID', entity: 'LEADS', type: 'TEXT', required: true },
  { id: 'cf-2', label: 'Annual Estimated Budget', entity: 'LEADS', type: 'NUMBER', required: false },
  { id: 'cf-3', label: 'Decision Maker Authority', entity: 'CONTACTS', type: 'DROPDOWN', required: true },
  { id: 'cf-4', label: 'Target Closing Date', entity: 'DEALS', type: 'DATE', required: true },
  { id: 'cf-5', label: 'Incumbent Competitor', entity: 'DEALS', type: 'TOGGLE', required: false },
];

export const DEFAULT_WORKFLOWS: WorkflowRule[] = [
  { id: 'wf-1', name: 'Hot Lead Auto-Handover', description: 'When AI Score reaches 80+, automatically escalate to the assigned Team Leader for priority follow-up.', triggerLabel: 'AI Score >= 80', conditionLabel: 'Status is not WON or LOST', actionLabel: 'Assign to Team Leader & Send WhatsApp', isActive: true, runCount: 142, lastRunStr: 'Today, 08:12 AM', color: '#6366f1' },
  { id: 'wf-2', name: 'No-Contact 3-Day Re-Assignment', description: 'If a lead has not been contacted in 3 days, re-assign it to the next available Sales Executive.', triggerLabel: 'No Contact for 72 Hours', conditionLabel: 'Status = NEW or FOLLOW_UP', actionLabel: 'Re-assign to Next Available Sales Exec', isActive: true, runCount: 38, lastRunStr: 'Yesterday, 09:00 AM', color: '#0ea5e9' },
  { id: 'wf-3', name: 'Meeting Booked Notification', description: 'Trigger a WhatsApp + in-app alert to the Sales Rep & Team Leader when a meeting is scheduled.', triggerLabel: 'Status Changed > MEETING SCHEDULED', conditionLabel: 'Any Lead, Any Rep', actionLabel: 'WhatsApp + Push Notif to Rep & TL', isActive: true, runCount: 64, lastRunStr: 'Today, 02:34 PM', color: '#10b981' },
  { id: 'wf-4', name: 'Lost Lead Win-Back Campaign', description: 'If a lead is marked LOST, after 30 days automatically add them to the Win-Back drip campaign.', triggerLabel: 'Status Changed > LOST', conditionLabel: '30 Days After LOST Date', actionLabel: 'Add to Win-Back Campaign Queue', isActive: false, runCount: 12, lastRunStr: '28 Aug 2026, 11:00 AM', color: '#f59e0b' },
  { id: 'wf-5', name: 'High Value Deal Alert', description: 'If deal value exceeds 5,00,000 notify Admin and Manager instantly.', triggerLabel: 'Deal Value > Rs. 5,00,000', conditionLabel: 'Status = NEGOTIATION or PROPOSAL', actionLabel: 'Alert Admin & Manager in Real-Time', isActive: false, runCount: 7, lastRunStr: '15 Aug 2026, 03:45 PM', color: '#c084fc' },
];

const TRIGGER_OPTIONS = [
  { key: 'AI_SCORE', icon: 'AI', label: 'AI Score Threshold' },
  { key: 'STATUS_CHANGE', icon: 'ST', label: 'Lead Status Changed' },
  { key: 'TIME_BASED', icon: 'TM', label: 'Time-Based Trigger' },
  { key: 'VALUE_THRESHOLD', icon: 'VL', label: 'Deal Value Threshold' },
];

export type TabId = 'statuses' | 'pipeline' | 'sources' | 'fields' | 'automations';

export interface Props {
  navigation?: any;
  route?: any;
  onClose?: () => void;
  initialTab?: TabId;
}

export default function WorkflowBuilderScreen({ navigation, route, onClose, initialTab }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab || route?.params?.initialTab || 'statuses');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (route?.params?.initialTab) {
      setActiveTab(route?.params?.initialTab);
    }
  }, [initialTab, route?.params?.initialTab]);

  // State Collections
  const [statuses, setStatuses] = useState<LeadStatus[]>(DEFAULT_STATUSES);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_PIPELINE_STAGES);
  const [leadSources, setLeadSources] = useState<LeadSource[]>(DEFAULT_LEAD_SOURCES);
  const [customFields, setCustomFields] = useState<CustomField[]>(DEFAULT_CUSTOM_FIELDS);
  const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_WORKFLOWS);

  // Form States
  // 1. New Status Form
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');

  // 2. New Pipeline Stage Form
  const [newStageName, setNewStageName] = useState('');
  const [newStageProb, setNewStageProb] = useState(50);
  const [newStageColor, setNewStageColor] = useState('#6366f1');

  // 3. New Lead Source Form
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceIcon, setNewSourceIcon] = useState('🌐');

  // 4. New Custom Field Form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldEntity, setNewFieldEntity] = useState<'LEADS' | 'CONTACTS' | 'DEALS'>('LEADS');
  const [newFieldType, setNewFieldType] = useState<'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'TOGGLE'>('TEXT');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Automation Modals
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.statuses) setStatuses(parsed.statuses);
          if (parsed.pipelineStages) setPipelineStages(parsed.pipelineStages);
          if (parsed.leadSources) setLeadSources(parsed.leadSources);
          if (parsed.customFields) setCustomFields(parsed.customFields);
          if (parsed.rules) setRules(parsed.rules);
        }
      } catch (err) {
        console.warn('Failed to load workflow state', err);
      }
    })();
  }, []);

  // Save to AsyncStorage
  const handleSaveChanges = async () => {
    try {
      const payload = { statuses, pipelineStages, leadSources, customFields, rules };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      Alert.alert('✅ Changes Saved', 'Workflow and lifecycle configuration successfully saved for your organization.');
    } catch (err) {
      Alert.alert('Error', 'Failed to persist workflow configurations.');
    }
  };

  const goBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      try {
        navigation?.navigate('Home');
      } catch {
        try { navigation?.navigate('Menu'); } catch {}
      }
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // ─── Lead Status Handlers ───────────────────────────────────────────────────
  const addStatus = () => {
    if (!newStatusName.trim()) {
      Alert.alert('Missing Name', 'Please enter a status name.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStatuses(prev => [
      ...prev,
      { id: `st-${Date.now()}`, name: newStatusName.trim(), color: newStatusColor, isDefault: false, isWon: false, isLost: false },
    ]);
    setNewStatusName('');
  };

  const removeStatus = (id: string) => {
    Alert.alert('Delete Status', 'Are you sure you want to delete this status stage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setStatuses(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  };

  const updateStatus = (id: string, field: keyof LeadStatus, val: any) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const moveStatus = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= statuses.length) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = [...statuses];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setStatuses(updated);
  };

  // ─── Pipeline Stage Handlers ────────────────────────────────────────────────
  const addPipelineStage = () => {
    if (!newStageName.trim()) {
      Alert.alert('Missing Name', 'Please enter pipeline stage name.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPipelineStages(prev => [
      ...prev,
      { id: `ps-${Date.now()}`, name: newStageName.trim(), probability: Math.min(100, Math.max(0, newStageProb)), color: newStageColor },
    ]);
    setNewStageName('');
  };

  const removePipelineStage = (id: string) => {
    Alert.alert('Delete Pipeline Stage', 'Are you sure you want to delete this deal stage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPipelineStages(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  };

  const movePipelineStage = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pipelineStages.length) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = [...pipelineStages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPipelineStages(updated);
  };

  // ─── Lead Source Handlers ───────────────────────────────────────────────────
  const addLeadSource = () => {
    if (!newSourceName.trim()) {
      Alert.alert('Missing Name', 'Please enter lead source name.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLeadSources(prev => [
      ...prev,
      { id: `ls-${Date.now()}`, name: newSourceName.trim(), icon: newSourceIcon, isActive: true },
    ]);
    setNewSourceName('');
  };

  const toggleSourceActive = (id: string) => {
    setLeadSources(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const removeLeadSource = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLeadSources(prev => prev.filter(s => s.id !== id));
  };

  // ─── Custom Field Handlers ──────────────────────────────────────────────────
  const addCustomField = () => {
    if (!newFieldLabel.trim()) {
      Alert.alert('Missing Label', 'Please enter custom field label.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCustomFields(prev => [
      ...prev,
      {
        id: `cf-${Date.now()}`,
        label: newFieldLabel.trim(),
        entity: newFieldEntity,
        type: newFieldType,
        required: newFieldRequired,
      },
    ]);
    setNewFieldLabel('');
    setNewFieldRequired(false);
  };

  const removeCustomField = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  // ─── Automation Rules Handlers ──────────────────────────────────────────────
  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = (id: string) => {
    Alert.alert('Delete Rule', 'Delete this automation rule? Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setRules(prev => prev.filter(r => r.id !== id));
          setSelectedRule(null);
        },
      },
    ]);
  };

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'statuses', label: 'Lead Statuses', icon: '📋' },
    { id: 'pipeline', label: 'Pipeline Stages', icon: '⊞' },
    { id: 'sources', label: 'Lead Sources', icon: '📄' },
    { id: 'fields', label: 'Custom Fields', icon: '⚙️' },
    { id: 'automations', label: 'Automation Rules', icon: '⚡' },
  ];

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* ── Top Bar ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Workflow Setup</Text>
          <Text style={styles.headerSub}>Enterprise Workflow &amp; Lifecycle Controls</Text>
        </View>
        <TouchableOpacity style={styles.saveChangesBtn} onPress={handleSaveChanges} activeOpacity={0.8}>
          <Text style={styles.saveChangesBtnText}>💾 Save Changes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 24) + 85 }]} showsVerticalScrollIndicator={false}>
        {/* ── Horizontal Navigation Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveTab(tab.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 📋 TAB 1: LEAD STATUSES (Exact Parity with Web Screenshot)       */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'statuses' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lead Statuses</Text>
              <Text style={styles.sectionSub}>Customize the stages of your lead lifecycle. Drag or use arrows to reorder.</Text>
            </View>

            {/* List of Status Items */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {statuses.map((st, idx) => (
                <View key={st.id} style={styles.statusRow}>
                  {/* Reorder Buttons */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      disabled={idx === 0}
                      onPress={() => moveStatus(idx, 'UP')}
                      style={[styles.reorderArrow, idx === 0 && { opacity: 0.2 }]}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Text style={styles.reorderArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.gripIcon}>⋮⋮</Text>
                    <TouchableOpacity
                      disabled={idx === statuses.length - 1}
                      onPress={() => moveStatus(idx, 'DOWN')}
                      style={[styles.reorderArrow, idx === statuses.length - 1 && { opacity: 0.2 }]}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Text style={styles.reorderArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Main Status Color Preview */}
                  <View style={[styles.statusColorCircle, { backgroundColor: st.color, borderColor: st.color }]} />

                  {/* Editable Status Name */}
                  <TextInput
                    style={styles.statusInput}
                    value={st.name}
                    onChangeText={txt => updateStatus(st.id, 'name', txt)}
                    placeholder="Status Name"
                    placeholderTextColor="#64748b"
                  />

                  {/* Badges */}
                  <View style={styles.badgeWrap}>
                    {st.isDefault && (
                      <View style={[styles.pillBadge, { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.45)' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#818cf8' }]}>Default</Text>
                      </View>
                    )}
                    {st.isWon && (
                      <View style={[styles.pillBadge, { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.45)' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#22c55e' }]}>Won</Text>
                      </View>
                    )}
                    {st.isLost && (
                      <View style={[styles.pillBadge, { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.45)' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#ef4444' }]}>Lost</Text>
                      </View>
                    )}
                  </View>

                  {/* 10-Color Picker Palette Dots */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteScroll}>
                    {COLORS.map(c => {
                      const isSelected = st.color === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.colorDot, { backgroundColor: c }, isSelected && styles.colorDotSelected]}
                          onPress={() => updateStatus(st.id, 'color', c)}
                          activeOpacity={0.7}
                        />
                      );
                    })}
                  </ScrollView>

                  {/* Delete button (only for non-locked statuses) */}
                  {!st.isDefault && !st.isWon && !st.isLost ? (
                    <TouchableOpacity onPress={() => removeStatus(st.id)} style={styles.trashBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 22 }} />
                  )}
                </View>
              ))}
            </View>

            {/* Add New Status Card (Dashed Border) */}
            <View style={styles.addDashedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={[styles.statusColorCircle, { backgroundColor: newStatusColor, borderColor: newStatusColor }]} />
                <TextInput
                  style={[styles.statusInput, { flex: 1 }]}
                  placeholder="New status name..."
                  placeholderTextColor="#64748b"
                  value={newStatusName}
                  onChangeText={setNewStatusName}
                  onSubmitEditing={addStatus}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteScroll}>
                  {COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, newStatusColor === c && styles.colorDotSelected]}
                      onPress={() => setNewStatusColor(c)}
                      activeOpacity={0.7}
                    />
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.addBtn} onPress={addStatus} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>+ Add Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ⊞ TAB 2: PIPELINE STAGES                                         */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pipeline Stages</Text>
              <Text style={styles.sectionSub}>Configure deal pipeline stages, probability percentages, and win forecasts.</Text>
            </View>

            {/* Stages List */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {pipelineStages.map((ps, idx) => (
                <View key={ps.id} style={styles.statusRow}>
                  {/* Reorder */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      disabled={idx === 0}
                      onPress={() => movePipelineStage(idx, 'UP')}
                      style={[styles.reorderArrow, idx === 0 && { opacity: 0.2 }]}
                    >
                      <Text style={styles.reorderArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.gripIcon}>⋮⋮</Text>
                    <TouchableOpacity
                      disabled={idx === pipelineStages.length - 1}
                      onPress={() => movePipelineStage(idx, 'DOWN')}
                      style={[styles.reorderArrow, idx === pipelineStages.length - 1 && { opacity: 0.2 }]}
                    >
                      <Text style={styles.reorderArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.statusColorCircle, { backgroundColor: ps.color, borderColor: ps.color }]} />

                  <TextInput
                    style={[styles.statusInput, { flex: 1.2 }]}
                    value={ps.name}
                    onChangeText={txt => setPipelineStages(p => p.map(s => s.id === ps.id ? { ...s, name: txt } : s))}
                  />

                  {/* Probability Stepper */}
                  <View style={styles.probBox}>
                    <TouchableOpacity
                      style={styles.probBtn}
                      onPress={() => setPipelineStages(p => p.map(s => s.id === ps.id ? { ...s, probability: Math.max(0, s.probability - 5) } : s))}
                    >
                      <Text style={styles.probBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.probText}>{ps.probability}%</Text>
                    <TouchableOpacity
                      style={styles.probBtn}
                      onPress={() => setPipelineStages(p => p.map(s => s.id === ps.id ? { ...s, probability: Math.min(100, s.probability + 5) } : s))}
                    >
                      <Text style={styles.probBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Color Selector */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteScroll}>
                    {COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorDot, { backgroundColor: c }, ps.color === c && styles.colorDotSelected]}
                        onPress={() => setPipelineStages(p => p.map(s => s.id === ps.id ? { ...s, color: c } : s))}
                        activeOpacity={0.7}
                      />
                    ))}
                  </ScrollView>

                  <TouchableOpacity onPress={() => removePipelineStage(ps.id)} style={styles.trashBtn}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add New Stage Card */}
            <View style={styles.addDashedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={[styles.statusColorCircle, { backgroundColor: newStageColor, borderColor: newStageColor }]} />
                <TextInput
                  style={[styles.statusInput, { flex: 1.5 }]}
                  placeholder="New deal stage name..."
                  placeholderTextColor="#64748b"
                  value={newStageName}
                  onChangeText={setNewStageName}
                />
                <View style={styles.probBox}>
                  <TouchableOpacity style={styles.probBtn} onPress={() => setNewStageProb(p => Math.max(0, p - 10))}>
                    <Text style={styles.probBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.probText}>{newStageProb}%</Text>
                  <TouchableOpacity style={styles.probBtn} onPress={() => setNewStageProb(p => Math.min(100, p + 10))}>
                    <Text style={styles.probBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteScroll}>
                  {COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, newStageColor === c && styles.colorDotSelected]}
                      onPress={() => setNewStageColor(c)}
                      activeOpacity={0.7}
                    />
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.addBtn} onPress={addPipelineStage} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>+ Add Stage</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 📄 TAB 3: LEAD SOURCES                                            */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'sources' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lead Sources</Text>
              <Text style={styles.sectionSub}>Manage lead attribution channels, campaigns, and inbound sources.</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {leadSources.map(ls => (
                <View key={ls.id} style={styles.sourceRow}>
                  <Text style={{ fontSize: 20 }}>{ls.icon}</Text>
                  <TextInput
                    style={[styles.statusInput, { flex: 1 }]}
                    value={ls.name}
                    onChangeText={txt => setLeadSources(p => p.map(s => s.id === ls.id ? { ...s, name: txt } : s))}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: ls.isActive ? '#34d399' : '#64748b' }}>
                      {ls.isActive ? 'ACTIVE' : 'OFF'}
                    </Text>
                    <Switch
                      value={ls.isActive}
                      onValueChange={() => toggleSourceActive(ls.id)}
                      trackColor={{ false: '#1e293b', true: '#10b981' }}
                      thumbColor="#ffffff"
                    />
                    <TouchableOpacity onPress={() => removeLeadSource(ls.id)} style={styles.trashBtn}>
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Add New Source */}
            <View style={styles.addDashedCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8', marginBottom: 8 }}>
                ➕ Register New Lead Channel Source
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {['🌐', '💬', '👥', '📞', '💼', '🎯', '🎪', '✉️', '📣', '🤖'].map(ic => (
                    <TouchableOpacity
                      key={ic}
                      style={[styles.iconChoice, newSourceIcon === ic && styles.iconChoiceSelected]}
                      onPress={() => setNewSourceIcon(ic)}
                    >
                      <Text style={{ fontSize: 16 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.statusInput, { flex: 1 }]}
                  placeholder="Lead source channel name (e.g. Meta Reels Ads)..."
                  placeholderTextColor="#64748b"
                  value={newSourceName}
                  onChangeText={setNewSourceName}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addLeadSource} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>+ Add Source</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ⚙️ TAB 4: CUSTOM FIELDS                                           */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'fields' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Custom Fields</Text>
              <Text style={styles.sectionSub}>Add industry-specific attributes to Leads, Contacts, and Deals.</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {customFields.map(cf => (
                <View key={cf.id} style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabelText}>{cf.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <View style={[styles.pillBadge, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.5)' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#a5b4fc' }]}>{cf.entity}</Text>
                      </View>
                      <View style={[styles.pillBadge, { backgroundColor: 'rgba(56,189,248,0.2)', borderColor: 'rgba(56,189,248,0.5)' }]}>
                        <Text style={[styles.pillBadgeText, { color: '#38bdf8' }]}>{cf.type}</Text>
                      </View>
                      {cf.required && (
                        <View style={[styles.pillBadge, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)' }]}>
                          <Text style={[styles.pillBadgeText, { color: '#f87171' }]}>Required</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => removeCustomField(cf.id)} style={styles.trashBtn}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Custom Field Form */}
            <View style={styles.addDashedCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8', marginBottom: 8 }}>
                ➕ Create New Custom Field
              </Text>
              <TextInput
                style={[styles.statusInput, { marginBottom: 8 }]}
                placeholder="Field Label (e.g. Machine Serial Number)..."
                placeholderTextColor="#64748b"
                value={newFieldLabel}
                onChangeText={setNewFieldLabel}
              />

              <Text style={styles.formMiniHeader}>Target Entity:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {(['LEADS', 'CONTACTS', 'DEALS'] as const).map(ent => (
                  <TouchableOpacity
                    key={ent}
                    style={[styles.choicePill, newFieldEntity === ent && styles.choicePillActive]}
                    onPress={() => setNewFieldEntity(ent)}
                  >
                    <Text style={[styles.choicePillText, newFieldEntity === ent && styles.choicePillTextActive]}>{ent}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formMiniHeader}>Data Type:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {(['TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'TOGGLE'] as const).map(tp => (
                  <TouchableOpacity
                    key={tp}
                    style={[styles.choicePill, newFieldType === tp && styles.choicePillActive]}
                    onPress={() => setNewFieldType(tp)}
                  >
                    <Text style={[styles.choicePillText, newFieldType === tp && styles.choicePillTextActive]}>{tp}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 }}>
                <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '700' }}>Mandatory Required Field?</Text>
                <Switch
                  value={newFieldRequired}
                  onValueChange={setNewFieldRequired}
                  trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity style={[styles.addBtn, { alignSelf: 'stretch', alignItems: 'center' }]} onPress={addCustomField} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+ Save Custom Field</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ⚡ TAB 5: AUTOMATION RULES ENGINE (Full Visual Rule Pipeline)   */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {activeTab === 'automations' && (
          <View>
            {/* Stats Strip */}
            <View style={styles.statsRow}>
              {[
                { val: rules.length, label: 'Total Rules', color: '#ffffff' },
                { val: rules.filter(r => r.isActive).length, label: 'Active', color: '#34d399' },
                { val: rules.reduce((s, r) => s + r.runCount, 0), label: 'Total Runs', color: '#818cf8' },
                { val: rules.filter(r => !r.isActive).length, label: 'Paused', color: '#fbbf24' },
              ].map((s, i) => (
                <View key={i} style={styles.statChip}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLbl}>ACTIVE AUTOMATION RULES</Text>
              <TouchableOpacity style={styles.newRuleBtn} onPress={() => setCreateRuleOpen(true)} activeOpacity={0.8}>
                <Text style={styles.newRuleBtnText}>+ New Rule</Text>
              </TouchableOpacity>
            </View>

            {/* Workflow Cards */}
            {rules.map(rule => (
              <TouchableOpacity
                key={rule.id}
                style={[styles.ruleCard, { borderLeftColor: rule.color }]}
                onPress={() => setSelectedRule(rule)}
                activeOpacity={0.85}
              >
                <View style={styles.ruleCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleDesc} numberOfLines={2}>{rule.description}</Text>
                  </View>
                  <Switch
                    value={rule.isActive}
                    onValueChange={() => toggleRule(rule.id)}
                    trackColor={{ false: '#1e293b', true: rule.color }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Node Pipeline */}
                <View style={styles.pipeline}>
                  <View style={[styles.nodeChip, { borderColor: 'rgba(99,102,241,0.4)', backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                    <Text style={styles.nodeChipLbl}>TRIGGER</Text>
                    <Text style={[styles.nodeChipVal, { color: '#818cf8' }]}>{rule.triggerLabel}</Text>
                  </View>
                  <Text style={styles.pipelineArrow}>-&gt;</Text>
                  <View style={[styles.nodeChip, { borderColor: 'rgba(56,189,248,0.4)', backgroundColor: 'rgba(56,189,248,0.08)' }]}>
                    <Text style={styles.nodeChipLbl}>IF</Text>
                    <Text style={[styles.nodeChipVal, { color: '#38bdf8' }]}>{rule.conditionLabel}</Text>
                  </View>
                  <Text style={styles.pipelineArrow}>-&gt;</Text>
                  <View style={[styles.nodeChip, { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.08)' }]}>
                    <Text style={styles.nodeChipLbl}>THEN</Text>
                    <Text style={[styles.nodeChipVal, { color: '#34d399' }]}>{rule.actionLabel}</Text>
                  </View>
                </View>

                <View style={styles.ruleCardBottom}>
                  <Text style={styles.ruleMetaText}>{rule.runCount} runs</Text>
                  <Text style={styles.ruleMetaText}>Last: {rule.lastRunStr}</Text>
                  <View style={[styles.activeBadge, rule.isActive ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.12)' } : { borderColor: 'rgba(100,116,139,0.3)', backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                    <Text style={[styles.activeBadgeText, { color: rule.isActive ? '#34d399' : '#64748b' }]}>
                      {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ── Rule Detail Modal ── */}
      <Modal visible={!!selectedRule} transparent animationType="slide">
        <View style={styles.overlay}>
          {selectedRule && (
            <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 24) + 16 }]}>
              <View style={styles.modalHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedRule.name}</Text>
                  <Text style={styles.modalSub}>Automation Rule Execution Chain</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRule(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                  <View style={[styles.activeBadge, selectedRule.isActive ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.12)' } : { borderColor: 'rgba(100,116,139,0.3)', backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                    <Text style={[styles.activeBadgeText, { color: selectedRule.isActive ? '#34d399' : '#64748b' }]}>
                      {selectedRule.isActive ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </View>
                  <Text style={styles.ruleMetaText}>{selectedRule.runCount} total executions</Text>
                </View>

                <Text style={styles.detailDesc}>{selectedRule.description}</Text>
                <Text style={[styles.sectionLbl, { marginTop: 12 }]}>AUTOMATION CHAIN</Text>

                {[
                  { lbl: 'TRIGGER', val: selectedRule.triggerLabel, col: '#818cf8', bc: 'rgba(99,102,241,0.4)' },
                  { lbl: 'CONDITION (IF)', val: selectedRule.conditionLabel, col: '#38bdf8', bc: 'rgba(56,189,248,0.4)' },
                  { lbl: 'ACTION (THEN)', val: selectedRule.actionLabel, col: '#34d399', bc: 'rgba(52,211,153,0.4)' },
                ].map((node, i) => (
                  <View key={i}>
                    {i > 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                        <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>↓</Text>
                      </View>
                    )}
                    <View style={[styles.detailNode, { borderColor: node.bc }]}>
                      <Text style={styles.detailNodeLbl}>{node.lbl}</Text>
                      <Text style={[styles.detailNodeVal, { color: node.col }]}>{node.val}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Last Executed:</Text>
                  <Text style={styles.metaValue}>{selectedRule.lastRunStr}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, selectedRule.isActive ? { borderColor: '#475569', backgroundColor: 'rgba(100,116,139,0.2)' } : { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)' }]}
                    onPress={() => {
                      toggleRule(selectedRule.id);
                      setSelectedRule(p => p ? { ...p, isActive: !p.isActive } : null);
                    }}
                  >
                    <Text style={[styles.actionBtnText, { color: selectedRule.isActive ? '#94a3b8' : '#34d399' }]}>
                      {selectedRule.isActive ? 'Pause Rule' : 'Activate Rule'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.12)' }]}
                    onPress={() => deleteRule(selectedRule.id)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#f87171' }]}>Delete Rule</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Create Rule Modal ── */}
      <Modal visible={createRuleOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 24) + 16 }]}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>New Workflow Rule</Text>
                <Text style={styles.modalSub}>Select trigger condition to configure</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setCreateRuleOpen(false); setSelectedTrigger(null); }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLbl}>SELECT TRIGGER TYPE</Text>
            {TRIGGER_OPTIONS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.triggerOpt, selectedTrigger === t.key && styles.triggerOptActive]}
                onPress={() => setSelectedTrigger(t.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.triggerIcon, selectedTrigger === t.key && { backgroundColor: 'rgba(99,102,241,0.3)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: selectedTrigger === t.key ? '#818cf8' : '#64748b' }}>{t.icon}</Text>
                </View>
                <Text style={[styles.triggerLbl, selectedTrigger === t.key && { color: '#818cf8' }]}>{t.label}</Text>
                {selectedTrigger === t.key && <Text style={{ color: '#818cf8', fontSize: 16, fontWeight: '900' }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.proceedBtn, !selectedTrigger && { opacity: 0.35 }]}
              disabled={!selectedTrigger}
              onPress={() => {
                const newRule: WorkflowRule = {
                  id: `wf-${Date.now()}`,
                  name: `Automation Rule (${selectedTrigger})`,
                  description: 'Trigger created from template wizard. Executes automatic status dispatch and WhatsApp alert.',
                  triggerLabel: selectedTrigger || 'Custom Event',
                  conditionLabel: 'Lead matched target conditions',
                  actionLabel: 'Send WhatsApp + Reassign',
                  isActive: true,
                  runCount: 0,
                  lastRunStr: 'Just now',
                  color: '#6366f1',
                };
                setRules(prev => [newRule, ...prev]);
                setCreateRuleOpen(false);
                setSelectedTrigger(null);
                Alert.alert('✅ Rule Created', `Workflow rule "${newRule.name}" is now active!`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>Proceed &amp; Activate Rule →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0c1322',
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff', letterSpacing: 0.3 },
  headerSub: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 1 },
  adminBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  adminBadgeText: { fontSize: 8.5, fontWeight: '900', color: '#818cf8' },
  saveChangesBtn: {
    backgroundColor: '#4f46e5',
    borderWidth: 1,
    borderColor: '#818cf8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  saveChangesBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  content: { padding: 14 },

  // Admin Banner
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  adminBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  adminBannerTitle: { fontSize: 13, fontWeight: '900', color: '#818cf8' },
  adminBannerSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },

  // Tabs
  tabScroll: { marginBottom: 14 },
  tabScrollContent: { gap: 6 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButtonActive: {
    backgroundColor: '#1a1b4b',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabIcon: { fontSize: 12 },
  tabText: { fontSize: 11.5, fontWeight: '800', color: '#94a3b8' },
  tabTextActive: { color: '#ffffff', fontWeight: '900' },

  // Section Card
  sectionCard: {
    backgroundColor: '#0c1322',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  sectionSub: { fontSize: 10.5, color: '#94a3b8', marginTop: 2 },

  // Status Row Item
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reorderControls: { flexDirection: 'column', alignItems: 'center', gap: 1 },
  reorderArrow: { paddingHorizontal: 2 },
  reorderArrowText: { fontSize: 8, color: '#94a3b8', fontWeight: '900' },
  gripIcon: { fontSize: 10, color: '#475569', fontWeight: '900' },

  statusColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeWrap: { flexDirection: 'row', gap: 4 },
  pillBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillBadgeText: { fontSize: 8.5, fontWeight: '900' },

  colorPaletteScroll: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.2 }],
  },
  trashBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add Dashed Card
  addDashedCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
  },
  addBtn: {
    backgroundColor: '#4f46e5',
    borderWidth: 1,
    borderColor: '#818cf8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  // Pipeline Probability
  probBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  probBtn: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  probBtnText: { color: '#818cf8', fontSize: 12, fontWeight: '900' },
  probText: { color: '#38bdf8', fontSize: 10.5, fontWeight: '900', minWidth: 32, textAlign: 'center' },

  // Sources
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
  },
  iconChoice: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(99,102,241,0.2)',
  },

  // Custom Fields
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
  },
  fieldLabelText: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  formMiniHeader: { fontSize: 10, color: '#94a3b8', fontWeight: '800', marginBottom: 4 },
  choicePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  choicePillActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  choicePillText: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },
  choicePillTextActive: { color: '#ffffff' },

  // Automation Rules
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statChip: {
    flex: 1,
    backgroundColor: '#0c1322',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    alignItems: 'center',
  },
  statVal: { fontSize: 16, fontWeight: '900' },
  statLbl: { fontSize: 8.5, color: '#64748b', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLbl: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  newRuleBtn: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newRuleBtnText: { color: '#818cf8', fontSize: 10.5, fontWeight: '900' },
  ruleCard: {
    backgroundColor: '#0c1322',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
  },
  ruleCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  ruleName: { fontSize: 12.5, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  ruleDesc: { fontSize: 9.5, color: '#94a3b8', lineHeight: 13 },
  pipeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  nodeChip: { borderWidth: 1, borderRadius: 6, padding: 5 },
  nodeChipLbl: { fontSize: 7.5, color: '#64748b', fontWeight: '900', letterSpacing: 0.5, marginBottom: 1 },
  nodeChipVal: { fontSize: 8.5, fontWeight: '800' },
  pipelineArrow: { color: '#334155', fontSize: 10, fontWeight: '700' },
  ruleCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleMetaText: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  activeBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  activeBadgeText: { fontSize: 8.5, fontWeight: '900' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    maxHeight: '90%',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  modalSub: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '900' },
  detailDesc: { fontSize: 11.5, color: '#94a3b8', lineHeight: 16, marginBottom: 8 },
  detailNode: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 10, padding: 10 },
  detailNodeLbl: { fontSize: 8.5, fontWeight: '900', color: '#64748b', letterSpacing: 0.5, marginBottom: 3 },
  detailNodeVal: { fontSize: 11, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 8,
    marginTop: 12,
  },
  metaLabel: { fontSize: 9.5, color: '#64748b', fontWeight: '700' },
  metaValue: { fontSize: 9.5, color: '#ffffff', fontWeight: '800' },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '900' },
  triggerOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  triggerOptActive: { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: '#818cf8' },
  triggerIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLbl: { flex: 1, fontSize: 11.5, fontWeight: '800', color: '#94a3b8' },
  proceedBtn: {
    backgroundColor: '#4f46e5',
    borderWidth: 1,
    borderColor: '#818cf8',
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  proceedBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
