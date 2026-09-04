/**
 * DealsPipelineScreen.tsx — DAS CRM Android
 * Full Enterprise Deals Pipeline, Revenue Goals & Target Telemetry Portal.
 * Features:
 * 1. Expanded Deals Dataset across multiple pipeline stages.
 * 2. Revenue Goals & Target Telemetry (Monthly Target Progress Bar, Rep Target Cards).
 * 3. Interactive Modal to set & update custom Monthly & Quarterly Revenue Targets.
 * 4. Stage Transition Shifter Buttons & New Deal Registration Form.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DealItem {
  id: string;
  name: string;
  val: string;
  rawVal: number;
  stage: 'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON';
  company: string;
  owner: string;
  expectedClose: string;
}

interface DealsPipelineScreenProps {
  onClose?: () => void;
}

export const DealsPipelineScreen: React.FC<DealsPipelineScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  // 🎯 Revenue Goal State
  const [monthlyGoal, setMonthlyGoal] = useState<number>(1500000); // $1,500,000 Goal
  const [quarterlyGoal, setQuarterlyGoal] = useState<number>(4500000); // $4,500,000 Goal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [inputMonthlyGoal, setInputMonthlyGoal] = useState('1500000');
  const [inputQuarterlyGoal, setInputQuarterlyGoal] = useState('4500000');

  // 💼 Deals List
  const [dealsList, setDealsList] = useState<DealItem[]>([
    { id: '1', name: 'TechCorp Solutions (50 Seats)', val: '$128,400', rawVal: 128400, stage: 'QUALIFIED', company: 'TechCorp', owner: 'Rajesh Kumar', expectedClose: 'Aug 30, 2026' },
    { id: '2', name: 'LogiTech Freight Integration', val: '$412,000', rawVal: 412000, stage: 'PROPOSAL', company: 'LogiTech', owner: 'Priya Sharma', expectedClose: 'Sep 15, 2026' },
    { id: '3', name: 'Sunita Logistics Custom Webhooks', val: '$89,000', rawVal: 89000, stage: 'NEW_LEAD', company: 'Sunita', owner: 'Amit Patel', expectedClose: 'Aug 28, 2026' },
    { id: '4', name: 'Apex Retail Multi-Branch License', val: '$250,000', rawVal: 250000, stage: 'CLOSED_WON', company: 'Apex Retail', owner: 'Rajesh Kumar', expectedClose: 'Aug 20, 2026' },
    { id: '5', name: 'Global Infra Cloud Migration Suite', val: '$320,000', rawVal: 320000, stage: 'NEGOTIATION', company: 'Global Infra', owner: 'Priya Sharma', expectedClose: 'Sep 05, 2026' },
    { id: '6', name: 'SmartCity IoT Sensor Analytics Platform', val: '$195,000', rawVal: 195000, stage: 'QUALIFIED', company: 'SmartCity', owner: 'Amit Patel', expectedClose: 'Sep 10, 2026' },
    { id: '7', name: 'Metro Financial AI Bot Suite', val: '$175,000', rawVal: 175000, stage: 'PROPOSAL', company: 'Metro Financial', owner: 'Rajesh Kumar', expectedClose: 'Aug 31, 2026' },
    { id: '8', name: 'NextGen Pharma Compliance Automation', val: '$510,000', rawVal: 510000, stage: 'CLOSED_WON', company: 'NextGen Pharma', owner: 'Priya Sharma', expectedClose: 'Aug 15, 2026' },
  ]);

  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealOwner, setNewDealOwner] = useState('Rajesh Kumar');
  const [newDealStage, setNewDealStage] = useState<'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON'>('NEW_LEAD');

  const STAGE_PROBABILITIES: Record<string, number> = {
    NEW_LEAD: 15,
    QUALIFIED: 40,
    PROPOSAL: 70,
    NEGOTIATION: 85,
    CLOSED_WON: 100,
  };

  const handleShiftDealStage = (dealId: string, nextStage: 'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON') => {
    setDealsList((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d))
    );
  };

  const handleCreateNewDeal = () => {
    if (!newDealTitle.trim() || !newDealCompany.trim()) {
      Alert.alert('Missing Info', 'Please enter deal title and company name.');
      return;
    }
    const valNum = parseFloat(newDealValue.replace(/[^\d.]/g, '')) || 0;
    const newDeal: DealItem = {
      id: `deal_${Date.now()}`,
      name: newDealTitle.trim(),
      company: newDealCompany.trim(),
      val: `$${valNum.toLocaleString()}`,
      rawVal: valNum,
      stage: newDealStage,
      owner: newDealOwner,
      expectedClose: 'Next Month',
    };
    setDealsList([newDeal, ...dealsList]);
    setNewDealTitle('');
    setNewDealCompany('');
    setNewDealValue('');
    setShowNewDealForm(false);
    Alert.alert('✅ Deal Registered', `Created new enterprise deal "${newDeal.name}" assigned to ${newDeal.owner}!`);
  };

  const handleSaveGoalTargets = () => {
    const mVal = parseFloat(inputMonthlyGoal) || 1500000;
    const qVal = parseFloat(inputQuarterlyGoal) || 4500000;
    setMonthlyGoal(mVal);
    setQuarterlyGoal(qVal);
    setGoalModalOpen(false);
    Alert.alert('🎯 Targets Updated', `Monthly Target set to $${mVal.toLocaleString()} and Quarterly Target set to $${qVal.toLocaleString()}.`);
  };

  const totalPipelineValue = dealsList.reduce((acc, d) => acc + d.rawVal, 0);
  const weightedValue = dealsList.reduce((acc, d) => acc + (d.rawVal * (STAGE_PROBABILITIES[d.stage] / 100)), 0);
  const totalWonValue = dealsList.filter(d => d.stage === 'CLOSED_WON').reduce((acc, d) => acc + d.rawVal, 0);

  const goalProgressPercent = Math.min(100, Math.round((totalWonValue / monthlyGoal) * 100));

  return (
    <View style={[styles.container, { paddingTop: onClose ? 0 : topPadding }]}>
      {/* Top Header Navigation Bar */}
      <View style={styles.topHeader}>
        {onClose ? (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <Text style={styles.headerTitle}>💼 Deals, Goals &amp; Targets Portal</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 36 }]} showsVerticalScrollIndicator={false}>

        {/* ── 🎯 REVENUE GOALS & TARGET TELEMETRY CARD ───────────────────── */}
        <View style={styles.goalCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>🎯 Revenue Goals &amp; Target Progress</Text>
            <TouchableOpacity style={styles.editGoalBtn} onPress={() => setGoalModalOpen(true)}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#fbbf24' }}>Set Goals ✏️</Text>
            </TouchableOpacity>
          </View>

          {/* Goal Progress Bar */}
          <View style={{ marginVertical: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '800' }}>Monthly Target (${monthlyGoal.toLocaleString()})</Text>
              <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>${totalWonValue.toLocaleString()} ({goalProgressPercent}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${goalProgressPercent}%` }]} />
            </View>
          </View>

          {/* Rep Target Telemetry Grid */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#818cf8', marginTop: 8, marginBottom: 4 }}>Rep Target Performance Telemetry:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={styles.repTargetChip}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Rajesh K.</Text>
              <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '900' }}>$760k (95% Target)</Text>
            </View>
            <View style={styles.repTargetChip}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Priya S.</Text>
              <Text style={{ fontSize: 9, color: '#38bdf8', fontWeight: '900' }}>$922k (88% Target)</Text>
            </View>
            <View style={styles.repTargetChip}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>Amit P.</Text>
              <Text style={{ fontSize: 9, color: '#fbbf24', fontWeight: '900' }}>$284k (72% Target)</Text>
            </View>
          </View>
        </View>

        {/* ── PIPELINE SUMMARY CARDS ───────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.summaryValue}>${totalPipelineValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Pipeline Value ({dealsList.length} Deals)</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1e293b' }}>
            <Text style={[styles.summaryValue, { color: '#34d399' }]}>${Math.round(weightedValue).toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Weighted Forecast</Text>
          </View>
        </View>

        {/* ── DEALS KANBAN & STAGE SHIFTER ─────────────────────────────────── */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>💼 Deals Pipeline Kanban ({dealsList.length} Active Deals)</Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5 }]}
              onPress={() => setShowNewDealForm(!showNewDealForm)}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff' }}>
                {showNewDealForm ? '✕ Close Form' : '➕ Register Deal'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>Tap stage shifter chips to transition enterprise deals across pipeline stages.</Text>

          {/* Create Deal Form */}
          {showNewDealForm && (
            <View style={styles.formCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>💼 Register New Enterprise Deal</Text>
              <TextInput style={styles.inputField} placeholder="Deal Title (e.g. Acme Corp CRM)" placeholderTextColor="#64748b" value={newDealTitle} onChangeText={setNewDealTitle} />
              <TextInput style={styles.inputField} placeholder="Company Name" placeholderTextColor="#64748b" value={newDealCompany} onChangeText={setNewDealCompany} />
              <TextInput style={styles.inputField} placeholder="Deal Value (e.g. $150,000)" placeholderTextColor="#64748b" value={newDealValue} onChangeText={setNewDealValue} keyboardType="numeric" />

              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Assign Deal Owner:</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {['Rajesh Kumar', 'Priya Sharma', 'Amit Patel'].map((own) => (
                    <TouchableOpacity
                      key={own}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, newDealOwner === own && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                      onPress={() => setNewDealOwner(own)}
                    >
                      <Text style={{ fontSize: 8, fontWeight: '900', color: newDealOwner === own ? '#ffffff' : '#94a3b8' }}>{own}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                {(['NEW_LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'] as const).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, newDealStage === stg && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setNewDealStage(stg)}
                  >
                    <Text style={{ fontSize: 7, fontWeight: '900', color: newDealStage === stg ? '#ffffff' : '#94a3b8' }}>{stg.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingVertical: 8, alignItems: 'center', marginTop: 4 }]} onPress={handleCreateNewDeal}>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>💾 Create Deal Record →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Deals Items List */}
          {dealsList.map((deal) => (
            <View key={deal.id} style={[styles.itemRow, styles.borderBottom]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.itemName}>{deal.name}</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>Owner: {deal.owner} • Close: {deal.expectedClose}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#818cf8' }}>{deal.val}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                  Stage: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{deal.stage.replace('_', ' ')}</Text>
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>Win Prob: {STAGE_PROBABILITIES[deal.stage]}%</Text>
              </View>

              {/* Stage Shifter Chips */}
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {(['NEW_LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'] as const).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, deal.stage === stg && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => handleShiftDealStage(deal.id, stg)}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: deal.stage === stg ? '#ffffff' : '#94a3b8' }}>{stg.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── MODAL: SET REVENUE GOAL & TARGETS ─────────────────────────────── */}
      <Modal visible={goalModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎯 Set Revenue Goals &amp; Targets</Text>
            <Text style={styles.modalSub}>Define organizational revenue targets for current period.</Text>

            <Text style={styles.inputLabel}>Monthly Target Goal ($) *</Text>
            <TextInput
              style={styles.textInput}
              value={inputMonthlyGoal}
              onChangeText={setInputMonthlyGoal}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Quarterly Target Goal ($) *</Text>
            <TextInput
              style={styles.textInput}
              value={inputQuarterlyGoal}
              onChangeText={setInputQuarterlyGoal}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', flex: 1 }]} onPress={() => setGoalModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', flex: 1 }]} onPress={handleSaveGoalTargets}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Goals ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DealsPipelineScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#090d16', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14 },
  goalCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  editGoalBtn: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  progressBarTrack: { width: '100%', height: 8, backgroundColor: '#020617', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  progressBarFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 4 },
  repTargetChip: { flex: 1, backgroundColor: '#020617', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', padding: 8, alignItems: 'center' },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, flexDirection: 'row' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#38bdf8' },
  summaryLabel: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 8, lineHeight: 14 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  formCard: { backgroundColor: '#020617', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#4f46e5', gap: 6, marginVertical: 8 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#cbd5e1', marginTop: 6, marginBottom: 2 },
  textInput: { backgroundColor: '#020617', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 },
  modalBtn: { paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
});
