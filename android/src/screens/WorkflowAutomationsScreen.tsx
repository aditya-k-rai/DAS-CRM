import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkflowBuilderScreen, {
  WorkflowRule,
  DEFAULT_WORKFLOWS,
  WORKFLOW_STORAGE_KEY,
  TabId,
} from './WorkflowBuilderScreen';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: 'SEND_WHATSAPP' | 'SEND_EMAIL' | 'CREATE_TASK' | 'REASSIGN_LEAD';
  delay: 'IMMEDIATELY' | '15_MINS' | '1_HOUR' | '24_HOURS';
  status: boolean;
  triggersCount: number;
}

export interface BotExecutionLog {
  id: string;
  ruleName: string;
  leadName: string;
  time: string;
  status: string;
}

interface WorkflowAutomationsScreenProps {
  onClose?: () => void;
  navigation?: any;
}

const TRIGGER_OPTIONS = [
  { key: 'AI_SCORE', icon: 'AI', label: 'AI Score Threshold (>= 80)' },
  { key: 'STATUS_CHANGE', icon: 'ST', label: 'Lead Status Changed' },
  { key: 'TIME_BASED', icon: 'TM', label: 'Time-Based Trigger (48h/72h)' },
  { key: 'VALUE_THRESHOLD', icon: 'VL', label: 'Deal Value Threshold' },
];

export const WorkflowAutomationsScreen: React.FC<WorkflowAutomationsScreenProps> = ({
  onClose,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  // ─── Pipeline Automation Rules State (Synchronized with WorkflowBuilder) ───
  const [pipelineRules, setPipelineRules] = useState<WorkflowRule[]>(DEFAULT_WORKFLOWS);
  const [showFullWorkflowBuilder, setShowFullWorkflowBuilder] = useState(false);
  const [builderTab, setBuilderTab] = useState<TabId>('automations');

  // Rule Detail & Creation Modals
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [newWorkflowRuleName, setNewWorkflowRuleName] = useState('');

  // Load rules from AsyncStorage
  const loadRules = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.rules && Array.isArray(parsed.rules) && parsed.rules.length > 0) {
          setPipelineRules(parsed.rules);
        }
      }
    } catch (err) {
      console.warn('Failed to load workflow rules in WorkflowAutomationsScreen', err);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Toggle Rule Active/Paused & persist to AsyncStorage
  const handleToggleRule = async (ruleId: string) => {
    try {
      const updatedRules = pipelineRules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      );
      setPipelineRules(updatedRules);
      if (selectedRule && selectedRule.id === ruleId) {
        setSelectedRule({ ...selectedRule, isActive: !selectedRule.isActive });
      }

      // Persist in sync with WorkflowBuilder storage format
      const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
      const existingData = raw ? JSON.parse(raw) : {};
      const payload = { ...existingData, rules: updatedRules };
      await AsyncStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to toggle workflow rule', err);
    }
  };

  // Delete Rule & persist to AsyncStorage
  const handleDeleteRule = (id: string) => {
    Alert.alert('Delete Rule', 'Delete this automation rule? Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = pipelineRules.filter((r) => r.id !== id);
            setPipelineRules(updated);
            setSelectedRule(null);
            const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
            const existingData = raw ? JSON.parse(raw) : {};
            const payload = { ...existingData, rules: updated };
            await AsyncStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(payload));
          } catch (err) {
            console.warn('Failed to delete workflow rule', err);
          }
        },
      },
    ]);
  };

  // Create New Rule & persist to AsyncStorage
  const handleCreateNewWorkflowRule = async () => {
    if (!selectedTrigger) {
      Alert.alert('Select Trigger', 'Please select a trigger event type.');
      return;
    }
    const triggerConfig: Record<string, { trigger: string; condition: string; action: string; color: string }> = {
      AI_SCORE: {
        trigger: 'AI Score >= 80',
        condition: 'Status is not WON or LOST',
        action: 'Assign to TL & Dispatch WhatsApp',
        color: '#6366f1',
      },
      STATUS_CHANGE: {
        trigger: 'Status Changed > PROPOSAL',
        condition: 'High Priority Lead Assigned',
        action: 'Alert Sales Exec + Schedule Task',
        color: '#10b981',
      },
      TIME_BASED: {
        trigger: 'No Contact for 72 Hours',
        condition: 'Status = NEW or CONTACTED',
        action: 'Re-assign to Next Available Rep',
        color: '#0ea5e9',
      },
      VALUE_THRESHOLD: {
        trigger: 'Deal Value > Rs. 5,00,000',
        condition: 'Status in PROPOSAL or NEGOTIATION',
        action: 'Alert Admin & Sales Director Real-Time',
        color: '#c084fc',
      },
    };

    const cfg = triggerConfig[selectedTrigger] || {
      trigger: selectedTrigger,
      condition: 'Target condition matched',
      action: 'Dispatch Notification & Update CRM',
      color: '#6366f1',
    };

    const newRule: WorkflowRule = {
      id: `wf-${Date.now()}`,
      name: newWorkflowRuleName.trim() || `Automated ${selectedTrigger.replace('_', ' ')} Rule`,
      description: 'Trigger created from template wizard. Auto-dispatches escalation SLA, notifications and assignment.',
      triggerLabel: cfg.trigger,
      conditionLabel: cfg.condition,
      actionLabel: cfg.action,
      isActive: true,
      runCount: 0,
      lastRunStr: 'Just now',
      color: cfg.color,
    };

    const updated = [newRule, ...pipelineRules];
    setPipelineRules(updated);
    setCreateRuleOpen(false);
    setSelectedTrigger(null);
    setNewWorkflowRuleName('');

    try {
      const raw = await AsyncStorage.getItem(WORKFLOW_STORAGE_KEY);
      const existingData = raw ? JSON.parse(raw) : {};
      const payload = { ...existingData, rules: updated };
      await AsyncStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(payload));
      Alert.alert('✅ Rule Created', `Workflow rule "${newRule.name}" is now active!`);
    } catch (err) {
      console.warn('Failed to persist created workflow rule', err);
    }
  };

  // Redirect to WorkflowBuilderScreen
  const handleOpenPipelineAutomation = (tab: TabId = 'automations') => {
    setBuilderTab(tab);
    setShowFullWorkflowBuilder(true);
  };

  // ─── Legacy Bot Rules & Execution Logs ───
  const [automationsRules, setAutomationsRules] = useState<AutomationRule[]>([
    { id: '1', name: 'Auto-Send Welcome WhatsApp Message', trigger: 'On New Lead Ingestion', action: 'SEND_WHATSAPP', delay: 'IMMEDIATELY', status: true, triggersCount: 342 },
    { id: '2', name: 'Schedule Follow-up Call Alert Task', trigger: 'Lead Inactive 24h', action: 'CREATE_TASK', delay: '24_HOURS', status: true, triggersCount: 128 },
    { id: '3', name: 'Nudge Unassigned Leads to Team Leader', trigger: 'Unassigned > 15 Mins', action: 'REASSIGN_LEAD', delay: '15_MINS', status: false, triggersCount: 45 },
    { id: '4', name: 'Dispatch Proposal PDF Deck Email', trigger: 'Stage shifted to PROPOSAL', action: 'SEND_EMAIL', delay: 'IMMEDIATELY', status: true, triggersCount: 89 },
  ]);

  const [botLogs] = useState<BotExecutionLog[]>([
    { id: 'b_1', ruleName: 'Auto-Send Welcome WhatsApp Message', leadName: 'Rajesh Kumar', time: '10:30 AM', status: 'EXECUTED' },
    { id: 'b_2', ruleName: 'Dispatch Proposal PDF Deck Email', leadName: 'Priya Sharma', time: '09:15 AM', status: 'EXECUTED' },
    { id: 'b_3', ruleName: 'Nudge Unassigned Leads', leadName: 'Vikram Singh', time: 'Yesterday', status: 'SKIPPED' },
  ]);

  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'SEND_WHATSAPP' | 'SEND_EMAIL' | 'CREATE_TASK' | 'REASSIGN_LEAD'>('SEND_WHATSAPP');
  const [newRuleDelay, setNewRuleDelay] = useState<'IMMEDIATELY' | '15_MINS' | '1_HOUR' | '24_HOURS'>('IMMEDIATELY');

  // If redirect to WorkflowBuilder is active, render it inline
  if (showFullWorkflowBuilder) {
    return (
      <WorkflowBuilderScreen
        initialTab={builderTab}
        onClose={() => {
          setShowFullWorkflowBuilder(false);
          loadRules();
        }}
        navigation={navigation}
      />
    );
  }

  const handleCreateAutomationRule = () => {
    if (!newRuleName.trim() || !newRuleTrigger.trim()) {
      Alert.alert('Missing Info', 'Please enter automation rule name and trigger event.');
      return;
    }
    const newR: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim(),
      trigger: newRuleTrigger.trim(),
      action: newRuleAction,
      delay: newRuleDelay,
      status: true,
      triggersCount: 0,
    };
    setAutomationsRules([newR, ...automationsRules]);
    setNewRuleName('');
    setNewRuleTrigger('');
    setShowNewRuleForm(false);
    Alert.alert('✅ Bot Trigger Activated', `Created automation rule "${newR.name}"!`);
  };

  const totalRuns = pipelineRules.reduce((s, r) => s + r.runCount, 0);
  const activeCount = pipelineRules.filter((r) => r.isActive).length;
  const pausedCount = pipelineRules.filter((r) => !r.isActive).length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: onClose ? 10 : 0 }}>
          <Text style={styles.headerTitle}>⚡ Workflow Automations &amp; Bot Rules</Text>
          <Text style={styles.headerSub}>Enterprise Trigger-Condition-Action Automation Engine</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 24) + 85 }]} showsVerticalScrollIndicator={false}>
        {/* ── ⚙️ Full Admin Workflow & Lifecycle Builder Launcher Banner ── */}
        <TouchableOpacity
          style={styles.adminBuilderBanner}
          onPress={() => handleOpenPipelineAutomation('pipeline')}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={styles.adminBuilderIconBox}>
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.adminBuilderTitle}>Lifecycle &amp; Pipeline Setup</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              </View>
              <Text style={styles.adminBuilderSub}>
                Customize Lead Statuses, Pipeline Stages, Lead Sources &amp; Custom Fields
              </Text>
            </View>
          </View>
          <Text style={styles.adminBuilderArrow}>Launch Setup →</Text>
        </TouchableOpacity>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* ⚡ THE AUTOMATION RULES SECTION                                   */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { val: pipelineRules.length, label: 'Total Rules', color: '#ffffff' },
              { val: activeCount, label: 'Active', color: '#34d399' },
              { val: totalRuns, label: 'Total Runs', color: '#818cf8' },
              { val: pausedCount, label: 'Paused', color: '#fbbf24' },
            ].map((s, i) => (
              <View key={i} style={styles.statChip}>
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Section Header with + New Rule Button */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLbl}>ACTIVE AUTOMATION RULES</Text>
            <TouchableOpacity
              style={styles.newRuleBtn}
              onPress={() => setCreateRuleOpen(true)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.newRuleBtnText}>+ New Rule</Text>
            </TouchableOpacity>
          </View>

          {/* Workflow Cards */}
          {pipelineRules.map((rule) => (
            <TouchableOpacity
              key={rule.id}
              style={[styles.ruleCard, { borderLeftColor: rule.color }]}
              onPress={() => setSelectedRule(rule)}
              activeOpacity={0.85}
            >
              <View style={styles.ruleCardTop}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.ruleName}>{rule.name}</Text>
                  <Text style={styles.ruleDesc} numberOfLines={2}>
                    {rule.description}
                  </Text>
                </View>
                <Switch
                  value={rule.isActive}
                  onValueChange={() => handleToggleRule(rule.id)}
                  trackColor={{ false: '#1e293b', true: rule.color }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Node Pipeline Flow */}
              <View style={styles.pipeline}>
                <View
                  style={[
                    styles.nodeChip,
                    {
                      borderColor: 'rgba(99,102,241,0.4)',
                      backgroundColor: 'rgba(99,102,241,0.1)',
                    },
                  ]}
                >
                  <Text style={styles.nodeChipLbl}>TRIGGER</Text>
                  <Text style={[styles.nodeChipVal, { color: '#818cf8' }]}>
                    {rule.triggerLabel}
                  </Text>
                </View>
                <Text style={styles.pipelineArrow}>-&gt;</Text>
                <View
                  style={[
                    styles.nodeChip,
                    {
                      borderColor: 'rgba(56,189,248,0.4)',
                      backgroundColor: 'rgba(56,189,248,0.08)',
                    },
                  ]}
                >
                  <Text style={styles.nodeChipLbl}>IF</Text>
                  <Text style={[styles.nodeChipVal, { color: '#38bdf8' }]}>
                    {rule.conditionLabel}
                  </Text>
                </View>
                <Text style={styles.pipelineArrow}>-&gt;</Text>
                <View
                  style={[
                    styles.nodeChip,
                    {
                      borderColor: 'rgba(52,211,153,0.4)',
                      backgroundColor: 'rgba(52,211,153,0.08)',
                    },
                  ]}
                >
                  <Text style={styles.nodeChipLbl}>THEN</Text>
                  <Text style={[styles.nodeChipVal, { color: '#34d399' }]}>
                    {rule.actionLabel}
                  </Text>
                </View>
              </View>

              {/* Card Bottom Meta Row */}
              <View style={styles.ruleCardBottom}>
                <Text style={styles.ruleMetaText}>{rule.runCount} runs</Text>
                <Text style={styles.ruleMetaText}>Last: {rule.lastRunStr}</Text>
                <View
                  style={[
                    styles.activeBadge,
                    rule.isActive
                      ? {
                          borderColor: 'rgba(52,211,153,0.4)',
                          backgroundColor: 'rgba(52,211,153,0.12)',
                        }
                      : {
                          borderColor: 'rgba(100,116,139,0.3)',
                          backgroundColor: 'rgba(100,116,139,0.1)',
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeBadgeText,
                      { color: rule.isActive ? '#34d399' : '#64748b' },
                    ]}
                  >
                    {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Direct Bot Quick Trigger Management ── */}
        <View style={[styles.moduleCard, { marginTop: 14 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>⚡ Quick Bot Dispatches &amp; Triggers</Text>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: '#4f46e5', minHeight: 36, paddingHorizontal: 12 },
              ]}
              onPress={() => setShowNewRuleForm(!showNewRuleForm)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff' }}>
                {showNewRuleForm ? '✕ Close' : '➕ Add Bot Trigger'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>
            Direct background triggers for auto-nudges, call reminders, WhatsApp alerts &amp; SLA handoffs.
          </Text>

          {/* Form */}
          {showNewRuleForm && (
            <View style={styles.formCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>
                ⚡ Register Direct Automation Trigger
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="Rule Name (e.g. SLA 15-Min Followup)"
                placeholderTextColor="#64748b"
                value={newRuleName}
                onChangeText={setNewRuleName}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Trigger Event (e.g. On New Inbound Lead)"
                placeholderTextColor="#64748b"
                value={newRuleTrigger}
                onChangeText={setNewRuleTrigger}
              />

              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>
                  Select Automated Action:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['SEND_WHATSAPP', 'SEND_EMAIL', 'CREATE_TASK', 'REASSIGN_LEAD'] as const).map((act) => (
                    <TouchableOpacity
                      key={act}
                      style={[
                        {
                          flex: 1,
                          minHeight: 34,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 8,
                          backgroundColor: '#0f172a',
                          borderWidth: 1,
                          borderColor: '#1e293b',
                        },
                        newRuleAction === act && {
                          backgroundColor: '#4f46e5',
                          borderColor: '#818cf8',
                        },
                      ]}
                      onPress={() => setNewRuleAction(act)}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: '900',
                          color: newRuleAction === act ? '#ffffff' : '#94a3b8',
                        }}
                      >
                        {act}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>
                  Select Delay Timer:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['IMMEDIATELY', '15_MINS', '1_HOUR', '24_HOURS'] as const).map((del) => (
                    <TouchableOpacity
                      key={del}
                      style={[
                        {
                          flex: 1,
                          minHeight: 34,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 8,
                          backgroundColor: '#0f172a',
                          borderWidth: 1,
                          borderColor: '#1e293b',
                        },
                        newRuleDelay === del && {
                          backgroundColor: '#4f46e5',
                          borderColor: '#818cf8',
                        },
                      ]}
                      onPress={() => setNewRuleDelay(del)}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: '900',
                          color: newRuleDelay === del ? '#ffffff' : '#94a3b8',
                        }}
                      >
                        {del}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: '#4f46e5',
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 6,
                  },
                ]}
                onPress={handleCreateAutomationRule}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>
                  ⚡ Save &amp; Activate Bot Rule →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {automationsRules.map((rule) => (
            <View key={rule.id} style={[styles.itemRow, styles.borderBottom]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.itemName}>{rule.name}</Text>
                  <Text style={styles.actionBadge}>{rule.action}</Text>
                </View>
                <Text style={styles.itemSub}>
                  Trigger: {rule.trigger} • Delay: {rule.delay} • {rule.triggersCount} executions
                </Text>
              </View>
              <Switch
                value={rule.status}
                onValueChange={(val) =>
                  setAutomationsRules((prev) =>
                    prev.map((r) => (r.id === rule.id ? { ...r, status: val } : r))
                  )
                }
                trackColor={{ false: '#334155', true: '#4f46e5' }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>

        {/* ── Execution Audit Log ── */}
        <View style={[styles.moduleCard, { marginTop: 14 }]}>
          <Text style={styles.moduleTitle}>🤖 Bot Execution Audit History</Text>
          <Text style={styles.moduleSub}>
            Real-time log of automated bot triggers dispatched by DAS CRM background workers.
          </Text>

          {botLogs.map((log) => (
            <View
              key={log.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#020617',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, color: '#ffffff', fontWeight: '700' }}>
                  {log.ruleName}
                </Text>
                <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>
                  Target: {log.leadName} • {log.time}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  color: log.status === 'EXECUTED' ? '#34d399' : '#94a3b8',
                }}
              >
                {log.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Rule Detail & Execution Chain Modal ── */}
      <Modal visible={!!selectedRule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
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

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                  <View
                    style={[
                      styles.activeBadge,
                      selectedRule.isActive
                        ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.12)' }
                        : { borderColor: 'rgba(100,116,139,0.3)', backgroundColor: 'rgba(100,116,139,0.1)' },
                    ]}
                  >
                    <Text style={[styles.activeBadgeText, { color: selectedRule.isActive ? '#34d399' : '#64748b' }]}>
                      {selectedRule.isActive ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </View>
                  <Text style={styles.ruleMetaText}>{selectedRule.runCount} total executions</Text>
                </View>

                <Text style={styles.detailDesc}>{selectedRule.description}</Text>
                <Text style={[styles.sectionLbl, { marginTop: 12, marginBottom: 8 }]}>AUTOMATION CHAIN</Text>

                {[
                  { lbl: 'TRIGGER', val: selectedRule.triggerLabel, col: '#818cf8', bc: 'rgba(99,102,241,0.4)' },
                  { lbl: 'CONDITION (IF)', val: selectedRule.conditionLabel, col: '#38bdf8', bc: 'rgba(56,189,248,0.4)' },
                  { lbl: 'ACTION (THEN)', val: selectedRule.actionLabel, col: '#34d399', bc: 'rgba(52,211,153,0.4)' },
                ].map((node, i) => (
                  <View key={i}>
                    {i > 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                        <Text style={{ color: '#475569', fontSize: 14, fontWeight: '700' }}>↓</Text>
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
                    style={[
                      styles.modalActionBtn,
                      selectedRule.isActive
                        ? { borderColor: '#475569', backgroundColor: 'rgba(100,116,139,0.2)' }
                        : { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)' },
                    ]}
                    onPress={() => handleToggleRule(selectedRule.id)}
                  >
                    <Text style={[styles.modalActionBtnText, { color: selectedRule.isActive ? '#94a3b8' : '#34d399' }]}>
                      {selectedRule.isActive ? 'Pause Rule' : 'Activate Rule'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.12)' }]}
                    onPress={() => handleDeleteRule(selectedRule.id)}
                  >
                    <Text style={[styles.modalActionBtnText, { color: '#f87171' }]}>Delete Rule</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Create New Workflow Rule Wizard Modal ── */}
      <Modal visible={createRuleOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 24) + 16 }]}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>New Workflow Rule</Text>
                <Text style={styles.modalSub}>Select trigger event to configure automated pipeline</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setCreateRuleOpen(false);
                  setSelectedTrigger(null);
                  setNewWorkflowRuleName('');
                }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.inputField, { marginBottom: 12 }]}
              placeholder="Rule Name (e.g. VIP Lead Fast-Track Handover)"
              placeholderTextColor="#64748b"
              value={newWorkflowRuleName}
              onChangeText={setNewWorkflowRuleName}
            />

            <Text style={[styles.sectionLbl, { marginBottom: 8 }]}>SELECT TRIGGER TYPE</Text>
            {TRIGGER_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.triggerOpt, selectedTrigger === t.key && styles.triggerOptActive]}
                onPress={() => setSelectedTrigger(t.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.triggerIcon, selectedTrigger === t.key && { backgroundColor: 'rgba(99,102,241,0.3)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: selectedTrigger === t.key ? '#818cf8' : '#64748b' }}>
                    {t.icon}
                  </Text>
                </View>
                <Text style={[styles.triggerLbl, selectedTrigger === t.key && { color: '#818cf8' }]}>{t.label}</Text>
                {selectedTrigger === t.key && <Text style={{ color: '#818cf8', fontSize: 16, fontWeight: '900' }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.proceedBtn, !selectedTrigger && { opacity: 0.35 }]}
              disabled={!selectedTrigger}
              onPress={handleCreateNewWorkflowRule}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>⚡ Proceed &amp; Activate Rule →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 12 },
  headerTitle: { fontSize: 14.5, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 9.5, color: '#64748b', marginTop: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },

  // Hero Pipeline Automation Card
  pipelineHeroCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.45)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  pipelineHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pipelineHeroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  pipelineHeroTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  pipelineHeroSub: { fontSize: 10.5, color: '#cbd5e1', marginTop: 3, lineHeight: 15 },
  pipelineHeroButton: {
    backgroundColor: '#4f46e5',
    borderWidth: 1,
    borderColor: '#818cf8',
    borderRadius: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  pipelineHeroButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Admin Builder Launcher Banner
  adminBuilderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  adminBuilderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBuilderTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  adminBuilderSub: { fontSize: 9.5, color: '#94a3b8', marginTop: 2 },
  adminBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: { fontSize: 8, fontWeight: '900', color: '#818cf8' },
  adminBuilderArrow: { color: '#818cf8', fontWeight: '900', fontSize: 12, marginLeft: 8 },

  // Section Container (Automation Rules)
  sectionContainer: { marginTop: 4 },

  // Stats Strip (Matching Screenshot)
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statVal: { fontSize: 17, fontWeight: '900' },
  statLbl: { fontSize: 9, color: '#64748b', fontWeight: '700', marginTop: 2 },

  // Section Header Row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLbl: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  newRuleBtn: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    paddingHorizontal: 12,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  newRuleBtnText: {
    color: '#818cf8',
    fontSize: 11.5,
    fontWeight: '900',
  },

  // Modals & Inspectors
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
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
  modalActionBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modalActionBtnText: { fontSize: 11, fontWeight: '900' },
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
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  proceedBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  // Visual Rule Cards (Matching Screenshot)
  ruleCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  ruleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ruleName: { fontSize: 13.5, fontWeight: '900', color: '#ffffff' },
  ruleDesc: { fontSize: 10.5, color: '#94a3b8', marginTop: 3, lineHeight: 15 },

  // Visual Node Pipeline Flow
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 8,
  },
  nodeChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '45%',
  },
  nodeChipLbl: { fontSize: 7, fontWeight: '900', color: '#64748b' },
  nodeChipVal: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  pipelineArrow: { color: '#475569', fontSize: 10, fontWeight: '900' },

  // Rule Card Bottom Meta
  ruleCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  ruleMetaText: { fontSize: 9.5, color: '#64748b', fontWeight: '600' },
  activeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  activeBadgeText: { fontSize: 8.5, fontWeight: '900' },

  // Modules & Form Styles
  moduleCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleTitle: { fontSize: 13.5, fontWeight: '900', color: '#ffffff' },
  moduleSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 14,
  },
  actionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4f46e5',
    gap: 8,
    marginVertical: 8,
  },
  inputField: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#ffffff',
  },
  itemRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 11.5, fontWeight: '700', color: '#ffffff' },
  actionBadge: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#38bdf8',
    backgroundColor: 'rgba(56,189,248,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  itemSub: { fontSize: 9.5, color: '#94a3b8', marginTop: 2 },
});
