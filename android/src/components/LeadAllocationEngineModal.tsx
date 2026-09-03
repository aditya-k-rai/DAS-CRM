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
  ScrollView, Alert, Switch, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AllocationMode = 'BATCHWISE' | 'DIRECT_ASSIGN' | 'LEAD_POOL';

export interface BatchRule {
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
  onAllocationComplete?: (result: {
    mode: AllocationMode;
    batchRules?: BatchRule[];
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
  totalCount: number
): ValidationConflict => {
  const conflictingRuleIds: string[] = [];

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.fromRow < 1 || r.fromRow > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${r.fromRow}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (r.toRow < 1 || r.toRow > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} To Row (${r.toRow}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (r.fromRow > r.toRow) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${r.fromRow}) cannot be greater than To Row (${r.toRow}).`,
        conflictingRuleIds: [r.id],
      };
    }
  }

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const r1 = rules[i];
      const r2 = rules[j];

      const overlapStart = Math.max(r1.fromRow, r2.fromRow);
      const overlapEnd = Math.min(r1.toRow, r2.toRow);

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
  visible, onClose, totalLeadsCount = 214, sourceType = 'EXCEL_CSV', isTeamLeaderMode = false, onAllocationComplete,
}) => {
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();
  const activeTeam = isTeamLeaderMode ? MOCK_TL_REPS : MOCK_TEAM;

  const [mode, setMode] = useState<AllocationMode>('BATCHWISE');

  // Batchwise Allocation State
  const [batchRules, setBatchRules] = useState<BatchRule[]>([
    { id: 'b-1', fromRow: 1, toRow: Math.min(100, totalLeadsCount), assigneeId: activeTeam[0].id, assigneeName: `${activeTeam[0].name} (${activeTeam[0].role})`, role: activeTeam[0].role },
    { id: 'b-2', fromRow: Math.min(101, totalLeadsCount), toRow: totalLeadsCount, assigneeId: activeTeam[1].id, assigneeName: `${activeTeam[1].name} (${activeTeam[1].role})`, role: activeTeam[1].role },
  ]);
  const [runLoop, setRunLoop] = useState(true);

  // Direct Assign State
  const [selectedUser, setSelectedUser] = useState(MOCK_TEAM[0]);

  // Lead Pool State
  const [poolEnabled, setPoolEnabled] = useState(true);
  const [poolTimeMinutes, setPoolTimeMinutes] = useState(30);
  const [poolClaimedSuccess, setPoolClaimedSuccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (totalLeadsCount > 0) {
      setBatchRules(prev => {
        if (prev.length === 0 || prev.length === 2) {
          const half = Math.max(1, Math.floor(totalLeadsCount / 2));
          return [
            { id: 'b-1', fromRow: 1, toRow: half, assigneeId: 'usr-1', assigneeName: 'Priya Sharma (TL A)', role: 'Team Leader' },
            { id: 'b-2', fromRow: Math.min(half + 1, totalLeadsCount), toRow: totalLeadsCount, assigneeId: 'usr-2', assigneeName: 'Rohan Kumar (Sales Rep C)', role: 'Sales Exec' },
          ];
        }
        let start = 1;
        const countPerRule = Math.max(1, Math.floor(totalLeadsCount / prev.length));
        return prev.map((rule, idx) => {
          const isLast = idx === prev.length - 1;
          const end = isLast ? totalLeadsCount : Math.min(start + countPerRule - 1, totalLeadsCount);
          const res = {
            ...rule,
            fromRow: start,
            toRow: Math.max(start, end),
          };
          start = Math.min(end + 1, totalLeadsCount);
          return res;
        });
      });
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

  const validation = validateBatchRules(batchRules, totalLeadsCount);

  const handleAddBatchRule = () => {
    const lastTo = batchRules[batchRules.length - 1]?.toRow || 0;
    if (lastTo >= totalLeadsCount) {
      Alert.alert('Limit Reached', `All ${totalLeadsCount} rows are already covered by existing batch rules.`);
      return;
    }
    const nextFrom = Math.min(lastTo + 1, totalLeadsCount);
    const nextTo = totalLeadsCount;
    const nextUser = MOCK_TEAM[batchRules.length % MOCK_TEAM.length];

    setBatchRules(prev => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        fromRow: nextFrom,
        toRow: nextTo,
        assigneeId: nextUser.id,
        assigneeName: `${nextUser.name} (${nextUser.role})`,
        role: nextUser.role,
      },
    ]);
  };

  const handleUpdateBatchRule = (id: string, patch: Partial<BatchRule>) => {
    setBatchRules(prev => {
      const targetIndex = prev.findIndex(r => r.id === id);
      if (targetIndex === -1) return prev;

      const rawUpdated = prev.map(r => r.id === id ? { ...r, ...patch } : r);

      // Cascade rule adjustments to keep ranges valid & contiguous
      return rawUpdated.map((rule, idx) => {
        let f = Math.min(Math.max(1, rule.fromRow), totalLeadsCount);
        let t = Math.min(Math.max(f, rule.toRow), totalLeadsCount);

        // If target rule's toRow was updated, auto-sync subsequent rule's fromRow & toRow
        if (idx > 0) {
          const prevRule = rawUpdated[idx - 1];
          if (prevRule.toRow < totalLeadsCount) {
            f = Math.min(prevRule.toRow + 1, totalLeadsCount);
            if (t < f) t = Math.min(f + 10, totalLeadsCount);
          }
        }

        return {
          ...rule,
          fromRow: f,
          toRow: Math.max(f, t),
        };
      });
    });
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

  const handleConfirmAllocation = () => {
    if (mode === 'BATCHWISE' && validation.hasConflict) {
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const items: string[] = [];

      if (mode === 'BATCHWISE') {
        batchRules.forEach(r => items.push(`• Rows ${r.fromRow}-${r.toRow} ➔ ${r.assigneeName}`));
        if (runLoop) items.push('• Continuous Loop Routing: Enabled');
      } else if (mode === 'DIRECT_ASSIGN') {
        items.push(`• All ${totalLeadsCount} leads assigned directly to ${selectedUser.name} (${selectedUser.role})`);
      } else if (mode === 'LEAD_POOL') {
        items.push(`• Live Lead Pool: ${poolEnabled ? 'ENABLED' : 'DISABLED'}`);
        items.push(`• Claim Window: ${poolTimeMinutes} minutes`);
      }

      setSuccessDetails({
        title: mode === 'BATCHWISE' ? '⚡ Batches Allocated Successfully!' : mode === 'DIRECT_ASSIGN' ? '👤 Direct Assignment Complete!' : '⏱️ Live Lead Pool Active!',
        items,
      });

      setAllocationSuccessModalOpen(true);
    }, 400);
  };

  const handleDoneSuccessModal = () => {
    setAllocationSuccessModalOpen(false);
    onAllocationComplete?.({
      mode,
      batchRules: mode === 'BATCHWISE' ? batchRules : undefined,
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
              <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }}>
                <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '800' }}>⏳ Auto-Deletes in 7 Days</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={{ backgroundColor: isSheetPreviewMode ? 'rgba(6,182,212,0.2)' : '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: isSheetPreviewMode ? '#06b6d4' : '#334155' }}
                onPress={() => setIsSheetPreviewMode(!isSheetPreviewMode)}
              >
                <Text style={{ color: isSheetPreviewMode ? '#22d3ee' : '#cbd5e1', fontSize: 10, fontWeight: '900' }}>
                  {isSheetPreviewMode ? 'Close Sheet Editor' : '👁️ Preview & Edit Sheet'}
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
              <Text style={[styles.modeTabText, mode === tab.id && styles.modeTabTextActive]}>
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
                            value={String(rule.fromRow)}
                            onChangeText={v => handleUpdateBatchRule(rule.id, { fromRow: Number(v) || 1 })}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>To Row (Max {totalLeadsCount})</Text>
                          <TextInput
                            style={[styles.inputField, isConflicting && { borderColor: '#f43f5e' }]}
                            value={String(rule.toRow)}
                            onChangeText={v => handleUpdateBatchRule(rule.id, { toRow: Number(v) || 1 })}
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

                {/* Loop Option Toggle */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>🔄 Run Loop Batching</Text>
                    <Text style={styles.toggleSub}>Automatically cycle batch rules continuously for new leads</Text>
                  </View>
                  <Switch value={runLoop} onValueChange={setRunLoop} trackColor={{ false: '#1e293b', true: '#4f46e5' }} />
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
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
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
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },

  modeTabBar: { flexDirection: 'row', backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
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
  inputField: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#ffffff', fontWeight: '700' },
  userChip: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  userChipText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },

  addRuleBtn: { backgroundColor: 'rgba(79,70,229,0.15)', borderWidth: 1, borderColor: 'rgba(79,70,229,0.3)', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginVertical: 6 },
  addRuleBtnText: { color: '#818cf8', fontSize: 11, fontWeight: '900' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  toggleTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  toggleSub: { fontSize: 10, color: '#64748b', marginTop: 1 },

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
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  confirmBtn: { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
