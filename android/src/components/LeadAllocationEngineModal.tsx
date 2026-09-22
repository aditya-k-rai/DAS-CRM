/**
 * LeadAllocationEngineModal.tsx — DAS CRM Android
 * Post-Ingestion Lead Distribution, Batchwise Allocation & Lead Pool Claim Engine.
 * Formulated from Admin & Manager Flow Specifications:
 *   1. Batchwise Allocation (Set row ranges 1-100 to TL A, 101-300 to Rep C, loop option)
 *   2. Direct Assignment (Assign all leads directly to a selected Team Leader/Sales Rep)
 *   3. Google Sheet Lead Pool & Claim Window (Pool ON/OFF, Claim Timer, Realtime Claim button)
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, Alert, Switch, ActivityIndicator, useWindowDimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

export type AllocationMode = 'BATCHWISE' | 'DIRECT_ASSIGN' | 'LEAD_POOL';

export interface BatchRule {
  id: string;
  fromRow: number | string;
  toRow: number | string;
  assigneeId: string;
  assigneeName: string;
  role: string;
}

export interface AllocatedBatchRule {
  id: string;
  fromRow: number;
  toRow: number;
  assigneeId: string;
  assigneeName: string;
  role: string;
}

export interface LeadAllocationEngineModalProps {
  visible: boolean;
  onClose: () => void;
  totalLeadsCount?: number;
  sourceType?: 'EXCEL_CSV' | 'GOOGLE_SHEETS';
  isTeamLeaderMode?: boolean;
  /** Called when user taps Preview & Edit Sheet — closes modal and navigates to the spreadsheet grid */
  onPreviewSheet?: () => void;
  onAllocationComplete?: (result: {
    mode: AllocationMode;
    batchRules?: AllocatedBatchRule[];
    assignedUser?: { id: string; name: string };
    poolSettings?: { enabled: boolean; timeMinutes: number };
  }) => void;
}

const MOCK_TEAM = [
  { id: 'usr-1', name: 'Priya Sharma', role: 'Team Leader', leadsCount: 42, color: '#818cf8' },
  { id: 'usr-2', name: 'Rohan Kumar', role: 'Sales Exec', leadsCount: 28, color: '#34d399' },
  { id: 'usr-3', name: 'Amit Shah', role: 'Sales Exec', leadsCount: 19, color: '#f59e0b' },
  { id: 'usr-4', name: 'Neha Gupta', role: 'Sales Exec', leadsCount: 31, color: '#f472b6' },
];

const MOCK_TL_REPS = [
  { id: 'sub-1', name: 'Amit Patel', role: 'Sales Exec', leadsCount: 25, color: '#34d399' },
  { id: 'sub-2', name: 'Meera Kapoor', role: 'Sales Exec', leadsCount: 15, color: '#f59e0b' },
  { id: 'sub-3', name: 'Rohan Kumar', role: 'Sales Exec', leadsCount: 28, color: '#38bdf8' },
  { id: 'sub-4', name: 'Neha Gupta', role: 'Sales Exec', leadsCount: 31, color: '#f472b6' },
];

export interface ValidationConflict {
  hasConflict: boolean;
  message: string;
  conflictingRuleIds: string[];
}

export const validateBatchRules = (
  rules: BatchRule[],
  totalCount: number,
  strict: boolean = false,
): ValidationConflict => {
  const conflictingRuleIds: string[] = [];

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const fromStr = String(r.fromRow ?? '').trim();
    const toStr = String(r.toRow ?? '').trim();

    if (!fromStr || !toStr) {
      if (strict) {
        return {
          hasConflict: true,
          message: `Batch Rule #${i + 1}: Please enter both From Row and To Row.`,
          conflictingRuleIds: [r.id],
        };
      }
      continue;
    }

    const from = Number(fromStr);
    const to = Number(toStr);

    if (isNaN(from) || from < 1 || from > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${fromStr}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (isNaN(to) || to < 1 || to > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} To Row (${toStr}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (from > to) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${from}) cannot be greater than To Row (${to}).`,
        conflictingRuleIds: [r.id],
      };
    }
  }

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const r1 = rules[i];
      const r2 = rules[j];
      const f1Str = String(r1.fromRow ?? '').trim();
      const t1Str = String(r1.toRow ?? '').trim();
      const f2Str = String(r2.fromRow ?? '').trim();
      const t2Str = String(r2.toRow ?? '').trim();

      if (!f1Str || !t1Str || !f2Str || !t2Str) continue;

      const from1 = Number(f1Str);
      const to1 = Number(t1Str);
      const from2 = Number(f2Str);
      const to2 = Number(t2Str);

      if (isNaN(from1) || isNaN(to1) || isNaN(from2) || isNaN(to2)) continue;

      const overlapStart = Math.max(from1, from2);
      const overlapEnd = Math.min(to1, to2);

      if (overlapStart <= overlapEnd) {
        const overlapCount = overlapEnd - overlapStart + 1;
        return {
          hasConflict: true,
          message: `⚠️ Overlap Conflict Error: Rows ${overlapStart} to ${overlapEnd} (${overlapCount} rows) are assigned to both Batch Rule #${i + 1} (${r1.assigneeName}) and Batch Rule #${j + 1} (${r2.assigneeName}). A single row cannot be assigned to multiple users. Please edit row ranges or auto-adjust.`,
          conflictingRuleIds: [r1.id, r2.id],
        };
      }
    }
  }

  return { hasConflict: false, message: '', conflictingRuleIds: [] };
};

export const LeadAllocationEngineModal: React.FC<LeadAllocationEngineModalProps> = ({
  visible,
  onClose,
  totalLeadsCount = 214,
  sourceType = 'EXCEL_CSV',
  isTeamLeaderMode = false,
  onPreviewSheet,
  onAllocationComplete,
}) => {
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();
  const activeTeam = isTeamLeaderMode ? MOCK_TL_REPS : MOCK_TEAM;

  const [mode, setMode] = useState<AllocationMode>('BATCHWISE');

  // Batchwise Allocation State — Row numbers are NOT autofilled
  const [batchRules, setBatchRules] = useState<BatchRule[]>([
    { id: 'b-1', fromRow: '', toRow: '', assigneeId: activeTeam[0].id, assigneeName: `${activeTeam[0].name} (${activeTeam[0].role})`, role: activeTeam[0].role },
    { id: 'b-2', fromRow: '', toRow: '', assigneeId: activeTeam[1].id, assigneeName: `${activeTeam[1].name} (${activeTeam[1].role})`, role: activeTeam[1].role },
  ]);

  // Direct Assign State
  const [selectedUser, setSelectedUser] = useState(MOCK_TEAM[0]);

  // Lead Pool State
  const [poolEnabled, setPoolEnabled] = useState(true);
  const [poolTimeMinutes, setPoolTimeMinutes] = useState(30);
  const [poolClaimedSuccess, setPoolClaimedSuccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (batchRules.length === 0) {
      setBatchRules([
        { id: 'b-1', fromRow: '', toRow: '', assigneeId: activeTeam[0].id, assigneeName: `${activeTeam[0].name} (${activeTeam[0].role})`, role: activeTeam[0].role },
        { id: 'b-2', fromRow: '', toRow: '', assigneeId: activeTeam[1].id, assigneeName: `${activeTeam[1].name} (${activeTeam[1].role})`, role: activeTeam[1].role },
      ]);
    }
  }, [totalLeadsCount]);

  useEffect(() => {
    if (visible) {
      if (sourceType === 'EXCEL_CSV' || isTeamLeaderMode) {
        setMode('BATCHWISE');
      } else if (sourceType === 'GOOGLE_SHEETS') {
        setMode('LEAD_POOL');
      }
    }
  }, [visible, sourceType, isTeamLeaderMode]);

  // Custom Batch Distribution State (Mobile Parity)
  const [customBatchSize, setCustomBatchSize] = useState<string>('100');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(activeTeam.map(m => m.id));
  const [remainingAssigneeId, setRemainingAssigneeId] = useState<string>(activeTeam[0]?.id || '1');

  // Compute allocated rows & remaining rows
  const allocatedRowsCount = React.useMemo(() => {
    return batchRules.reduce((acc, rule) => {
      const from = Number(rule.fromRow);
      const to = Number(rule.toRow);
      if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from) {
        return acc + (to - from + 1);
      }
      return acc;
    }, 0);
  }, [batchRules]);

  const remainingRowsCount = Math.max(0, totalLeadsCount - allocatedRowsCount);

  // 📊 Live breakdown of who got how many leads (Mobile)
  const assigneeLeadBreakdown = React.useMemo(() => {
    const stats: Record<string, {
      id: string;
      name: string;
      role: string;
      color: string;
      totalLeads: number;
      batchCount: number;
      ranges: string[];
    }> = {};

    activeTeam.forEach(m => {
      stats[m.id] = {
        id: m.id,
        name: m.name,
        role: m.role,
        color: m.color || '#6366f1',
        totalLeads: 0,
        batchCount: 0,
        ranges: [],
      };
    });

    if (mode === 'BATCHWISE') {
      batchRules.forEach(rule => {
        const from = Number(rule.fromRow);
        const to = Number(rule.toRow);
        if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from && rule.assigneeId) {
          if (!stats[rule.assigneeId]) {
            stats[rule.assigneeId] = {
              id: rule.assigneeId,
              name: rule.assigneeName || 'Assigned Staff',
              role: rule.role || 'Sales Rep',
              color: '#6366f1',
              totalLeads: 0,
              batchCount: 0,
              ranges: [],
            };
          }
          const item = stats[rule.assigneeId];
          const count = to - from + 1;
          item.totalLeads += count;
          item.batchCount += 1;
          item.ranges.push(`R${from}-${to}`);
        }
      });
    } else if (mode === 'DIRECT_ASSIGN') {
      if (selectedUser && stats[selectedUser.id]) {
        stats[selectedUser.id].totalLeads = totalLeadsCount;
        stats[selectedUser.id].batchCount = 1;
        stats[selectedUser.id].ranges.push(`All 1-${totalLeadsCount}`);
      }
    }

    return Object.values(stats);
  }, [batchRules, mode, selectedUser, totalLeadsCount, activeTeam]);

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAllMembers = () => {
    if (selectedMemberIds.length === activeTeam.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(activeTeam.map(m => m.id));
    }
  };

  const handleApplyCustomBatch = () => {
    const size = Number(customBatchSize);
    if (!size || isNaN(size) || size <= 0) {
      Alert.alert('Invalid Size', 'Please enter a valid batch size greater than 0 (e.g. 100).');
      return;
    }
    if (selectedMemberIds.length === 0) {
      Alert.alert('Assignees Required', 'Please select at least one team member to receive batch.');
      return;
    }

    const selectedMembers = activeTeam.filter(m => selectedMemberIds.includes(m.id));
    let currentStart = 1;
    const newRules: BatchRule[] = [];

    for (let i = 0; i < selectedMembers.length; i++) {
      if (currentStart > totalLeadsCount) break;
      const member = selectedMembers[i];
      const endRow = Math.min(currentStart + size - 1, totalLeadsCount);
      newRules.push({
        id: `batch-${Date.now()}-${i}`,
        fromRow: currentStart,
        toRow: endRow,
        assigneeId: member.id,
        assigneeName: `${member.name} (${member.role})`,
        role: member.role,
      });
      currentStart = endRow + 1;
    }

    setBatchRules(newRules);
  };

  const handleAssignRemainingToMember = (assigneeId: string) => {
    if (remainingRowsCount <= 0) {
      Alert.alert('Done', 'All leads in the dataset have already been allocated.');
      return;
    }
    const member = activeTeam.find(m => m.id === assigneeId) || activeTeam[0];

    let maxTo = 0;
    batchRules.forEach(r => {
      const to = Number(r.toRow);
      if (!isNaN(to) && to > maxTo) maxTo = to;
    });

    const startRow = maxTo + 1;
    if (startRow > totalLeadsCount) {
      Alert.alert('Dataset Full', 'Dataset range is already fully occupied.');
      return;
    }

    const newRule: BatchRule = {
      id: `batch-remaining-${Date.now()}`,
      fromRow: startRow,
      toRow: totalLeadsCount,
      assigneeId: member.id,
      assigneeName: `${member.name} (${member.role})`,
      role: member.role,
    };

    setBatchRules(prev => [...prev, newRule]);
  };

  const handleSplitRemainingEvenly = () => {
    if (remainingRowsCount <= 0) {
      Alert.alert('Done', 'All leads are already allocated.');
      return;
    }
    const membersToUse = selectedMemberIds.length > 0
      ? activeTeam.filter(m => selectedMemberIds.includes(m.id))
      : activeTeam;

    let maxTo = 0;
    batchRules.forEach(r => {
      const to = Number(r.toRow);
      if (!isNaN(to) && to > maxTo) maxTo = to;
    });

    let currentStart = maxTo + 1;
    const remainingToDistribute = totalLeadsCount - maxTo;
    if (remainingToDistribute <= 0) return;

    const countPerMember = Math.max(1, Math.floor(remainingToDistribute / membersToUse.length));
    const additionalRules: BatchRule[] = [];

    membersToUse.forEach((member, idx) => {
      if (currentStart > totalLeadsCount) return;
      const isLast = idx === membersToUse.length - 1;
      const endRow = isLast ? totalLeadsCount : Math.min(currentStart + countPerMember - 1, totalLeadsCount);
      additionalRules.push({
        id: `batch-rem-split-${Date.now()}-${idx}`,
        fromRow: currentStart,
        toRow: endRow,
        assigneeId: member.id,
        assigneeName: `${member.name} (${member.role})`,
        role: member.role,
      });
      currentStart = endRow + 1;
    });

    setBatchRules(prev => [...prev, ...additionalRules]);
  };

  const validation = validateBatchRules(batchRules, totalLeadsCount);

  const handleAddBatchRule = () => {
    const nextUser = activeTeam[batchRules.length % activeTeam.length];
    setBatchRules(prev => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        fromRow: '',
        toRow: '',
        assigneeId: nextUser.id,
        assigneeName: `${nextUser.name} (${nextUser.role})`,
        role: nextUser.role,
      },
    ]);
  };

  const handleUpdateBatchRule = (id: string, patch: Partial<BatchRule>) => {
    setBatchRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const handleRemoveBatchRule = (id: string) => {
    if (batchRules.length <= 1) {
      Alert.alert('Required', 'At least 1 batch rule is required.');
      return;
    }
    setBatchRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAutoFixRanges = () => {
    if (batchRules.length === 0) return;
    const countPerRule = Math.max(1, Math.floor(totalLeadsCount / batchRules.length));
    let currentStart = 1;

    const fixed = batchRules.map((rule, idx) => {
      const isLast = idx === batchRules.length - 1;
      const endRow = isLast ? totalLeadsCount : Math.min(currentStart + countPerRule - 1, totalLeadsCount);
      const updatedRule = {
        ...rule,
        fromRow: currentStart,
        toRow: Math.max(currentStart, endRow),
      };
      currentStart = Math.min(endRow + 1, totalLeadsCount);
      return updatedRule;
    });

    setBatchRules(fixed);
  };

  // 👁️ Preview & Edit Sheet State
  const [isSheetPreviewMode, setIsSheetPreviewMode] = useState(false);
  const [sheetRows, setSheetRows] = useState([
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@acme.com', phone: '+91 98765 43210', company: 'Acme Solutions', city: 'Delhi NCR' },
    { id: '2', name: 'Priya Sharma', email: 'priya@techcorp.in', phone: '+91 87654 32109', company: 'TechCorp India', city: 'Mumbai' },
    { id: '3', name: 'Amit Shah', email: 'amit@westreach.com', phone: '+91 76543 21098', company: 'West Reach Pvt', city: 'Ahmedabad' },
    { id: '4', name: 'Neha Gupta', email: 'neha@lotwaala.org', phone: '+91 65432 10987', company: 'Lotwaala Work Plan', city: 'Bengaluru' },
  ]);

  const [allocationSuccessModalOpen, setAllocationSuccessModalOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ title: string; items: string[] }>({
    title: '',
    items: [],
  });

  const { token } = useAuthStore();

  const handleConfirmAllocation = async () => {
    if (mode === 'BATCHWISE') {
      const strictVal = validateBatchRules(batchRules, totalLeadsCount, true);
      if (strictVal.hasConflict) {
        Alert.alert('Batch Rule Incomplete', strictVal.message);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        mode,
        batchRules: mode === 'BATCHWISE' ? batchRules.map(r => ({
          ...r,
          fromRow: Number(r.fromRow),
          toRow: Number(r.toRow),
        })) : undefined,
        directAssign: mode === 'DIRECT_ASSIGN' ? { assigneeId: selectedUser.id, assigneeName: selectedUser.name } : undefined,
        totalLeadsCount,
      };

      await apiService.allocateLeadsWithVerification(token, payload);
      setSubmitting(false);

      const items: string[] = [];

      if (mode === 'BATCHWISE') {
        batchRules.forEach(r => items.push(`• Rows ${r.fromRow}-${r.toRow} ➔ ${r.assigneeName} (Notification Sent ✓)`));
      } else if (mode === 'DIRECT_ASSIGN') {
        items.push(`• All ${totalLeadsCount} leads assigned directly to ${selectedUser.name} (${selectedUser.role})`);
      } else if (mode === 'LEAD_POOL') {
        items.push(`• Live Lead Pool: ${poolEnabled ? 'ENABLED' : 'DISABLED'}`);
        items.push(`• Claim Window: ${poolTimeMinutes} minutes`);
      }

      items.push(`• 🌐 Server Verification: Authoritative DB transaction verified ✓`);
      items.push(`• 🔔 In-App Notifications: Dispatched to assigned employee(s) ✓`);

      setSuccessDetails({
        title: mode === 'BATCHWISE' ? '⚡ Batches Allocated & Verified!' : mode === 'DIRECT_ASSIGN' ? '👤 Direct Assignment Verified!' : '⏱️ Live Lead Pool Active!',
        items,
      });

      setAllocationSuccessModalOpen(true);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Allocation Failed', 'Unable to verify lead allocation with server. Please check internet connection.');
    }
  };

  const handleDoneSuccessModal = () => {
    setAllocationSuccessModalOpen(false);
    onAllocationComplete?.({
      mode,
      batchRules: mode === 'BATCHWISE' ? batchRules.map(r => ({
        ...r,
        fromRow: Number(r.fromRow),
        toRow: Number(r.toRow),
      })) : undefined,
      assignedUser: mode === 'DIRECT_ASSIGN' ? { id: selectedUser.id, name: selectedUser.name } : undefined,
      poolSettings: mode === 'LEAD_POOL' ? { enabled: poolEnabled, timeMinutes: poolTimeMinutes } : undefined,
    });
    onClose();
  };

  const handleSimulateClaimLead = () => {
    setPoolClaimedSuccess(true);
    setTimeout(() => {
      setPoolClaimedSuccess(false);
      Alert.alert('🎯 Live Lead Claimed!', 'Google Sheets Inbound Lead #L-9041 (Spectro Labs) claimed & added to your pipeline!');
    }, 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 36) }]}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.headerTitle}>
                {isTeamLeaderMode
                  ? '⚡ TL Sub-Allocation Engine'
                  : sourceType === 'EXCEL_CSV'
                  ? '⚡ Excel / CSV Bulk Lead Allocation'
                  : '⚡ Google Sheets Live Routing Engine'}
              </Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{totalLeadsCount} Leads</Text></View>
              <View style={{ backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}>
                <Text style={{ color: '#60a5fa', fontSize: 9, fontWeight: '800' }}>⏳ 6-Month Auto-Purge</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.previewSheetBtn,
                  onPreviewSheet && { borderColor: '#0ea5e9' },
                ]}
                onPress={() => {
                  onClose();
                  onPreviewSheet?.();
                }}
              >
                <Text style={styles.previewSheetBtnText}>
                  👁️ Preview & Edit Sheet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── MODE SELECTOR TABS ─────────────────────────────────────────── */}
        <View style={styles.modeTabBar}>
          {(isTeamLeaderMode || sourceType === 'EXCEL_CSV'
            ? [
                { id: 'BATCHWISE' as AllocationMode, label: '📦 Batchwise', icon: '📦' },
                { id: 'DIRECT_ASSIGN' as AllocationMode, label: '👤 Direct Assign', icon: '👤' },
              ]
            : [
                { id: 'LEAD_POOL' as AllocationMode, label: '⏱️ Lead Pool & Claim', icon: '⏱️' },
                { id: 'BATCHWISE' as AllocationMode, label: '📦 Batch Wise', icon: '📦' },
                { id: 'DIRECT_ASSIGN' as AllocationMode, label: '👤 Direct Assign', icon: '👤' },
              ]
          ).map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.modeTab, mode === tab.id && styles.modeTabActive]}
              onPress={() => setMode(tab.id)}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.modeTabText, mode === tab.id && styles.modeTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 📦 1. BATCHWISE ALLOCATION FLOW */}
          {mode === 'BATCHWISE' && (
            <View>
              <View style={styles.card}>
                <View style={S.cardHeaderRow}>
                  <Text style={styles.cardTitle}>📦 Batchwise Lead Allocation</Text>
                  <Text style={styles.cardSub}>Set custom row ranges to distribute dataset across sales team</Text>
                </View>

                <View style={styles.totalBadgeBox}>
                  <Text style={styles.totalBadgeLabel}>Total Dataset Size:</Text>
                  <Text style={styles.totalBadgeValue}>{totalLeadsCount} Rows</Text>
                </View>

                {/* ⚡ SMART CUSTOM BATCH DISTRIBUTION ENGINE (MOBILE PARITY) */}
                <View style={styles.customBatchCard}>
                  <View style={styles.customBatchHeader}>
                    <View>
                      <Text style={styles.customBatchTitle}>⚡ Custom Batch Distribution Engine</Text>
                      <Text style={styles.customBatchSub}>Enter quota (e.g. 100) to distribute equal leads to each selected rep</Text>
                    </View>
                  </View>

                  {/* Preset chips */}
                  <View style={styles.presetRow}>
                    {['50', '100', '200', '500'].map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.presetChip, customBatchSize === p && styles.presetChipActive]}
                        onPress={() => setCustomBatchSize(p)}
                      >
                        <Text style={[styles.presetText, customBatchSize === p && styles.presetTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Batch Size Input */}
                  <Text style={styles.fieldLabel}>Batch Size (Leads Each):</Text>
                  <TextInput
                    style={styles.batchInput}
                    value={customBatchSize}
                    onChangeText={v => setCustomBatchSize(v.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 100"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />

                  {/* Member Selector Chips */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>Select Assignees ({selectedMemberIds.length}):</Text>
                    <TouchableOpacity onPress={handleSelectAllMembers}>
                      <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800' }}>
                        {selectedMemberIds.length === activeTeam.length ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {activeTeam.map(usr => {
                        const isSel = selectedMemberIds.includes(usr.id);
                        return (
                          <TouchableOpacity
                            key={usr.id}
                            style={[styles.memberChip, isSel && styles.memberChipActive]}
                            onPress={() => handleToggleMember(usr.id)}
                          >
                            <Text style={{ color: isSel ? '#818cf8' : '#64748b', fontSize: 10, fontWeight: '900' }}>
                              {isSel ? '✓' : '○'}
                            </Text>
                            <Text style={[styles.memberChipText, isSel && styles.memberChipTextActive]}>
                              {usr.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Distribute Button */}
                  <TouchableOpacity style={styles.distributeBtn} onPress={handleApplyCustomBatch}>
                    <Text style={styles.distributeBtnText}>
                      ⚡ Distribute {customBatchSize || '0'} Leads Each ({selectedMemberIds.length} Reps) →
                    </Text>
                  </TouchableOpacity>

                  {/* Live Remaining Telemetry Bar */}
                  <View style={styles.remainingTelemetryBox}>
                    <View style={styles.remainingTelemetryRow}>
                      <Text style={styles.telemetryText}>
                        Allocated: <Text style={{ color: '#34d399', fontWeight: '900' }}>{allocatedRowsCount}</Text>
                      </Text>
                      <Text style={[styles.telemetryText, remainingRowsCount > 0 ? styles.telemetryHighlight : { color: '#34d399' }]}>
                        {remainingRowsCount > 0 ? `⚠️ Remaining: ${remainingRowsCount}` : '✓ 100% Assigned'}
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBarAllocated,
                          { width: `${Math.min(100, (allocatedRowsCount / totalLeadsCount) * 100)}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.progressBarRemaining,
                          { width: `${Math.min(100, (remainingRowsCount / totalLeadsCount) * 100)}%` },
                        ]}
                      />
                    </View>

                    {/* Remaining Assignment Controls */}
                    {remainingRowsCount > 0 && (
                      <View style={styles.remainingActionRow}>
                        <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '800', marginBottom: 4 }}>
                          Assign remaining {remainingRowsCount} leads to:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {activeTeam.map(usr => (
                              <TouchableOpacity
                                key={usr.id}
                                style={styles.assignRemainingBtn}
                                onPress={() => handleAssignRemainingToMember(usr.id)}
                              >
                                <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '800' }}>
                                  + Assign {remainingRowsCount} to {usr.name.split(' ')[0]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.splitRemainingBtn} onPress={handleSplitRemainingEvenly}>
                          <Text style={{ color: '#818cf8', fontSize: 10, fontWeight: '900' }}>
                            ⚖️ Split {remainingRowsCount} Remaining Evenly Across Selected Reps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* ERROR NOTIFICATION BANNER */}
                {validation.hasConflict && (
                  <View style={{ backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1.5, borderColor: '#f43f5e', padding: 12, borderRadius: 12, marginVertical: 10 }}>
                    <Text style={{ color: '#fda4af', fontSize: 12, fontWeight: '900', marginBottom: 4 }}>
                      ⚠️ BATCH ALLOCATION CONFLICT ERROR
                    </Text>
                    <Text style={{ color: '#fecdd3', fontSize: 11, fontWeight: '600', lineHeight: 16 }}>
                      {validation.message}
                    </Text>
                    <TouchableOpacity
                      style={{ backgroundColor: '#f43f5e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-end', marginTop: 8 }}
                      onPress={handleAutoFixRanges}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>
                        ✨ Auto-Adjust Non-Overlapping Ranges
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Batch Rules List */}
                {batchRules.map((rule, idx) => {
                  const isConflicting = validation.conflictingRuleIds.includes(rule.id);
                  return (
                    <View key={rule.id} style={[styles.ruleCard, isConflicting && { borderColor: '#f43f5e', borderWidth: 2, backgroundColor: 'rgba(244,63,94,0.08)' }]}>
                      <View style={styles.ruleCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.ruleIdx, isConflicting && { color: '#f43f5e' }]}>Batch Rule #{idx + 1}</Text>
                          {isConflicting && (
                            <View style={{ backgroundColor: 'rgba(244,63,94,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#f43f5e', fontSize: 9, fontWeight: '900' }}>⚠️ CONFLICT</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveBatchRule(rule.id)}>
                          <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: '800' }}>Remove ✕</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Range Inputs */}
                      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>From Row</Text>
                          <TextInput
                            style={[styles.inputField, isConflicting && { borderColor: '#f43f5e' }]}
                            value={rule.fromRow === '' ? '' : String(rule.fromRow)}
                            onChangeText={v => {
                              const cleaned = v.replace(/[^0-9]/g, '');
                              handleUpdateBatchRule(rule.id, { fromRow: cleaned === '' ? '' : Number(cleaned) });
                            }}
                            placeholder="e.g. 1"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>To Row (Max {totalLeadsCount})</Text>
                          <TextInput
                            style={[styles.inputField, isConflicting && { borderColor: '#f43f5e' }]}
                            value={rule.toRow === '' ? '' : String(rule.toRow)}
                            onChangeText={v => {
                              const cleaned = v.replace(/[^0-9]/g, '');
                              handleUpdateBatchRule(rule.id, { toRow: cleaned === '' ? '' : Number(cleaned) });
                            }}
                            placeholder={`Max ${totalLeadsCount}`}
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                    {/* Assignee Selector */}
                    <Text style={styles.fieldLabel}>Assignee (TL / Sales Rep)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {activeTeam.map(usr => {
                          const isSel = rule.assigneeId === usr.id;
                          return (
                            <TouchableOpacity
                              key={usr.id}
                              style={[
                                styles.userChip,
                                isSel && { backgroundColor: usr.color + '22', borderColor: usr.color },
                              ]}
                              onPress={() => handleUpdateBatchRule(rule.id, { assigneeId: usr.id, assigneeName: `${usr.name} (${usr.role})`, role: usr.role })}
                            >
                              <Text style={[styles.userChipText, isSel && { color: usr.color, fontWeight: '900' }]}>
                                {usr.name} ({usr.role})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                );
              })}

                <TouchableOpacity style={styles.addRuleBtn} onPress={handleAddBatchRule}>
                  <Text style={styles.addRuleBtnText}>+ Add Custom Batch Range</Text>
                </TouchableOpacity>

                {/* 📊 LIVE BREAKDOWN: WHO GOT HOW MANY LEADS */}
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.breakdownTitle}>👥 Lead Distribution Breakdown</Text>
                        <View style={styles.breakdownBadge}>
                          <Text style={styles.breakdownBadgeText}>Live</Text>
                        </View>
                      </View>
                      <Text style={styles.breakdownSub}>
                        Who got how many leads from total {totalLeadsCount} leads
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.breakdownTotalAllocated}>
                        {allocatedRowsCount} / {totalLeadsCount}
                      </Text>
                      <Text style={styles.breakdownPctText}>
                        {totalLeadsCount > 0 ? Math.round((allocatedRowsCount / totalLeadsCount) * 100) : 0}% Allocated
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 8, marginTop: 10 }}>
                    {assigneeLeadBreakdown.map(member => {
                      const pct = totalLeadsCount > 0 ? Math.round((member.totalLeads / totalLeadsCount) * 100) : 0;
                      const hasLeads = member.totalLeads > 0;
                      const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <View
                          key={member.id}
                          style={[
                            styles.memberBreakdownRow,
                            hasLeads && { borderColor: member.color + '55', backgroundColor: '#090d16' },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              <View style={[styles.memberAvatar, { backgroundColor: hasLeads ? member.color : '#1e293b' }]}>
                                <Text style={[styles.memberAvatarText, { color: hasLeads ? '#ffffff' : '#94a3b8' }]}>{initials}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.memberBreakdownName} numberOfLines={1}>{member.name}</Text>
                                <Text style={styles.memberBreakdownRole}>{member.role}</Text>
                              </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.memberLeadCount, hasLeads && { color: '#10b981' }]}>
                                {member.totalLeads.toLocaleString()} Leads
                              </Text>
                              <Text style={styles.memberShareText}>{pct}% share</Text>
                            </View>
                          </View>

                          {/* Mini Progress Bar */}
                          <View style={styles.memberProgressBarBg}>
                            <View
                              style={[
                                styles.memberProgressBarFill,
                                { width: `${pct}%`, backgroundColor: hasLeads ? (member.color || '#4f46e5') : 'transparent' },
                              ]}
                            />
                          </View>

                          {/* Batch Ranges */}
                          {hasLeads && member.ranges.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                              {member.ranges.map((rng, rIdx) => (
                                <View key={rIdx} style={[styles.rangePill, { borderColor: member.color + '44' }]}>
                                  <Text style={[styles.rangePillText, { color: member.color }]}>{rng}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {remainingRowsCount > 0 ? (
                    <View style={styles.remainingBreakdownNotice}>
                      <Text style={styles.remainingBreakdownText}>
                        ⚠️ {remainingRowsCount} Leads unassigned ({totalLeadsCount > 0 ? Math.round((remainingRowsCount / totalLeadsCount) * 100) : 0}%)
                      </Text>
                      <TouchableOpacity
                        style={styles.assignRemainingSmallBtn}
                        onPress={() => handleAssignRemainingToMember(remainingAssigneeId)}
                      >
                        <Text style={styles.assignRemainingSmallText}>Assign All →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.allAssignedNotice}>
                      <Text style={styles.allAssignedNoticeText}>✓ 100% of dataset is fully assigned!</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 👤 2. DIRECT ASSIGNMENT FLOW */}
          {mode === 'DIRECT_ASSIGN' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 Direct Single User Assignment</Text>
              <Text style={styles.cardSub}>Assign all {totalLeadsCount} incoming leads to a single Team Leader or Sales Rep</Text>

              <View style={{ gap: 8, marginTop: 10 }}>
                {activeTeam.map(usr => {
                  const isSel = selectedUser.id === usr.id;
                  return (
                    <TouchableOpacity
                      key={usr.id}
                      style={[
                        styles.assigneeCard,
                        isSel && { backgroundColor: usr.color + '22', borderColor: usr.color },
                      ]}
                      onPress={() => setSelectedUser(usr)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.assigneeName, isSel && { color: usr.color }]}>{usr.name}</Text>
                        <Text style={styles.assigneeRole}>{usr.role} • {usr.leadsCount} Active Leads</Text>
                      </View>
                      {isSel && <Text style={{ color: usr.color, fontWeight: '900', fontSize: 16 }}>✓ Selected</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ⏱️ 3. LEAD POOL & REALTIME CLAIM WINDOW FLOW */}
          {mode === 'LEAD_POOL' && (
            <View>
              <View style={styles.card}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>⏱️ Lead Pool Engine (Claim Window)</Text>
                    <Text style={styles.cardSub}>Enable real-time claim popup for all eligible Team Leaders &amp; Sales Reps</Text>
                  </View>
                  <Switch value={poolEnabled} onValueChange={setPoolEnabled} trackColor={{ false: '#1e293b', true: '#10b981' }} />
                </View>

                {poolEnabled && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>Claim Window Time Limit (Minutes)</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {[5, 15, 30, 60].map(mins => (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.timeChip,
                            poolTimeMinutes === mins && styles.timeChipActive,
                          ]}
                          onPress={() => setPoolTimeMinutes(mins)}
                        >
                          <Text style={[styles.timeChipText, poolTimeMinutes === mins && styles.timeChipTextActive]}>
                            {mins} mins
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.poolExplainer}>
                      ℹ️ Google Sheets Live Sync Stream: Whenever a new lead is generated in connected Google Sheets, a Claim Window will pop up on eligible users' screens. If a user claims within {poolTimeMinutes} minutes, it is assigned directly to them; if unclaimed after {poolTimeMinutes} minutes, it auto-rotates to the next rep.
                    </Text>
                  </View>
                )}
              </View>

              {/* Real-time Claim Window Simulator Card */}
              <View style={styles.claimWindowCard}>
                <View style={styles.claimHeaderRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.claimHeaderTitle}>LIVE POOL CLAIM WINDOW</Text>
                  <Text style={styles.claimTimerText}>⏱️ 14m 32s left</Text>
                </View>
                <Text style={styles.claimLeadName}>Spectro Analytical Labs Pvt Ltd</Text>
                <Text style={styles.claimLeadSub}>Value: ₹2,38,950 • Source: Google Sheets Live • City: Greater Noida</Text>

                <TouchableOpacity
                  style={[styles.claimBtn, poolClaimedSuccess && { backgroundColor: '#10b981' }]}
                  onPress={handleSimulateClaimLead}
                  disabled={poolClaimedSuccess}
                >
                  <Text style={styles.claimBtnText}>
                    {poolClaimedSuccess ? '✓ Lead Claimed & Added to Pipeline!' : '✋ Claim Lead Now →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>

        {/* ── FOOTER ACTIONS ───────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, (mode === 'BATCHWISE' && validation.hasConflict) && { opacity: 0.45 }]}
            onPress={handleConfirmAllocation}
            disabled={submitting || (mode === 'BATCHWISE' && validation.hasConflict)}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmBtnText}>
                {mode === 'BATCHWISE' ? '🚀 Confirm Batch Allocation →' : mode === 'DIRECT_ASSIGN' ? `👤 Assign to ${selectedUser.name} →` : '⏱️ Save Lead Pool Settings →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ⚡ SLEEK NATIVE SUCCESS MODAL */}
        <Modal visible={allocationSuccessModalOpen} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(3,7,18,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 2, borderColor: '#10b981', padding: 20, width: '100%', maxWidth: 360, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: '#34d399', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 28, color: '#34d399', fontWeight: '900' }}>✓</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 4 }}>
                {successDetails.title}
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 14 }}>
                Lead distribution rules committed to database.
              </Text>

              <View style={{ backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, width: '100%', marginBottom: 16 }}>
                {successDetails.items.map((line, i) => (
                  <Text key={i} style={{ fontSize: 11, color: '#34d399', fontWeight: '700', marginVertical: 2, fontFamily: 'monospace' }}>
                    {line}
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                style={{ backgroundColor: '#10b981', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                onPress={handleDoneSuccessModal}
              >
                <Text style={{ color: '#030712', fontSize: 13, fontWeight: '900' }}>Done &amp; Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: 'rgba(79,70,229,0.2)', borderWidth: 1, borderColor: '#818cf8', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#818cf8' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1e293b', borderWidth: 1.5, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },

  customBatchCard: { backgroundColor: '#090d16', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)', padding: 12, marginBottom: 12 },
  customBatchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customBatchTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  customBatchSub: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  presetRow: { flexDirection: 'row', gap: 6, marginVertical: 6 },
  presetChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  presetChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  presetText: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  presetTextActive: { color: '#ffffff' },
  batchInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: '#ffffff', fontSize: 12, fontWeight: '800' },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  memberChipActive: { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: '#6366f1' },
  memberChipText: { fontSize: 10, fontWeight: '700', color: '#cbd5e1' },
  memberChipTextActive: { color: '#ffffff', fontWeight: '800' },
  distributeBtn: { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  distributeBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  remainingTelemetryBox: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginTop: 10 },
  remainingTelemetryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  telemetryText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  telemetryHighlight: { fontSize: 10, fontWeight: '900', color: '#f59e0b' },
  progressBarContainer: { height: 6, backgroundColor: '#0b1329', borderRadius: 3, overflow: 'hidden', flexDirection: 'row', marginBottom: 6 },
  progressBarAllocated: { height: '100%', backgroundColor: '#10b981' },
  progressBarRemaining: { height: '100%', backgroundColor: '#f59e0b' },
  remainingActionRow: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 6, marginTop: 4 },
  assignRemainingBtn: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 7, paddingVertical: 5, paddingHorizontal: 8, alignItems: 'center' },
  splitRemainingBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', marginTop: 6 },

  modeTabBar: { flexDirection: 'row', backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  modeTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  modeTabActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  modeTabText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  modeTabTextActive: { color: '#ffffff' },

  scrollContent: { padding: 14, paddingBottom: 40 },
  card: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  cardSub: { fontSize: 10, color: '#64748b', marginTop: 2 },

  totalBadgeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginVertical: 10 },
  totalBadgeLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  totalBadgeValue: { fontSize: 14, fontWeight: '900', color: '#38bdf8' },

  ruleCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginBottom: 8 },
  ruleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleIdx: { fontSize: 11, fontWeight: '900', color: '#818cf8' },
  fieldLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  inputField: { backgroundColor: '#090d16', borderWidth: 1.5, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: '#ffffff', fontWeight: '800' },
  userChip: { backgroundColor: '#090d16', borderWidth: 1.5, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  userChipText: { fontSize: 10, color: '#cbd5e1', fontWeight: '700' },

  addRuleBtn: { backgroundColor: '#4338ca', borderWidth: 1.5, borderColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginVertical: 6, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  addRuleBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  toggleTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  toggleSub: { fontSize: 10, color: '#64748b', marginTop: 1 },

  breakdownCard: { backgroundColor: '#020617', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', padding: 12, marginTop: 8 },
  breakdownHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  breakdownTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  breakdownBadge: { backgroundColor: 'rgba(99,102,241,0.25)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#6366f1' },
  breakdownBadgeText: { fontSize: 9, fontWeight: '900', color: '#818cf8' },
  breakdownSub: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  breakdownTotalAllocated: { fontSize: 11, fontWeight: '900', color: '#10b981' },
  breakdownPctText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  memberBreakdownRow: { backgroundColor: '#0b1329', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 9 },
  memberAvatar: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 11, fontWeight: '900' },
  memberBreakdownName: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  memberBreakdownRole: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  memberLeadCount: { fontSize: 11, fontWeight: '900', color: '#cbd5e1' },
  memberShareText: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  memberProgressBarBg: { height: 4, backgroundColor: '#020617', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  memberProgressBarFill: { height: '100%', borderRadius: 2 },
  rangePill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: 'rgba(15,23,42,0.6)' },
  rangePillText: { fontSize: 8, fontWeight: '800' },
  remainingBreakdownNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 8, padding: 8, marginTop: 10 },
  remainingBreakdownText: { fontSize: 10, fontWeight: '800', color: '#fbbf24', flex: 1 },
  assignRemainingSmallBtn: { backgroundColor: 'rgba(245,158,11,0.25)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.5)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  assignRemainingSmallText: { fontSize: 9, fontWeight: '900', color: '#fef3c7' },
  allAssignedNotice: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 8, padding: 8, marginTop: 10, alignItems: 'center' },
  allAssignedNoticeText: { fontSize: 10, fontWeight: '900', color: '#34d399' },

  assigneeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12 },
  assigneeName: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  assigneeRole: { fontSize: 10, color: '#64748b', marginTop: 2 },

  timeChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  timeChipActive: { backgroundColor: '#10b981', borderColor: '#34d399' },
  timeChipText: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  timeChipTextActive: { color: '#ffffff' },

  poolExplainer: { fontSize: 10, color: '#94a3b8', lineHeight: 15, backgroundColor: '#020617', borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' },

  claimWindowCard: { backgroundColor: '#090d16', borderRadius: 14, borderWidth: 1.5, borderColor: '#34d399', padding: 14, marginTop: 4 },
  claimHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  claimHeaderTitle: { fontSize: 10, fontWeight: '900', color: '#34d399', letterSpacing: 0.5, flex: 1 },
  claimTimerText: { fontSize: 11, fontWeight: '900', color: '#fbbf24' },
  claimLeadName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  claimLeadSub: { fontSize: 10, color: '#64748b', marginTop: 2, marginBottom: 10 },
  claimBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  claimBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  footer: { flexDirection: 'row', gap: 8, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingHorizontal: 14, paddingTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1.5, borderColor: '#475569', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#f1f5f9', fontSize: 13, fontWeight: '800' },
  confirmBtn: { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  previewSheetBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, borderWidth: 1.5, borderColor: '#334155' },
  previewSheetBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: '900' },
});

