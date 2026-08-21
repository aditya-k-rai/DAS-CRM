import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export interface DealItem {
  id: string;
  name: string;
  val: string;
  rawVal: number;
  stage: 'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON';
  company: string;
  owner: string;
  expectedClose: string;
}

interface DealsPipelineScreenProps {
  onClose?: () => void;
}

export const DealsPipelineScreen: React.FC<DealsPipelineScreenProps> = ({ onClose }) => {
  const [dealsList, setDealsList] = useState<DealItem[]>([
    { id: '1', name: 'TechCorp Solutions (50 Seats)', val: '$128,400', rawVal: 128400, stage: 'QUALIFIED', company: 'TechCorp', owner: 'Rajesh Kumar', expectedClose: 'Aug 30, 2026' },
    { id: '2', name: 'LogiTech Freight Integration', val: '$412,000', rawVal: 412000, stage: 'PROPOSAL', company: 'LogiTech', owner: 'Priya Sharma', expectedClose: 'Sep 15, 2026' },
    { id: '3', name: 'Sunita Logistics Custom Webhooks', val: '$89,000', rawVal: 89000, stage: 'NEW_LEAD', company: 'Sunita', owner: 'Amit Patel', expectedClose: 'Aug 28, 2026' },
    { id: '4', name: 'Apex Retail Multi-Branch License', val: '$250,000', rawVal: 250000, stage: 'CLOSED_WON', company: 'Apex Retail', owner: 'Rajesh Kumar', expectedClose: 'Aug 20, 2026' },
  ]);

  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealOwner, setNewDealOwner] = useState('Rajesh Kumar');
  const [newDealStage, setNewDealStage] = useState<'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON'>('NEW_LEAD');

  const STAGE_PROBABILITIES: Record<string, number> = {
    NEW_LEAD: 10,
    QUALIFIED: 40,
    PROPOSAL: 70,
    CLOSED_WON: 100,
  };

  const handleShiftDealStage = (dealId: string, nextStage: 'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON') => {
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

  const totalPipelineValue = dealsList.reduce((acc, d) => acc + d.rawVal, 0);
  const weightedValue = dealsList.reduce((acc, d) => acc + (d.rawVal * (STAGE_PROBABILITIES[d.stage] / 100)), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>💼 Deals Pipeline Kanban</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.summaryValue}>${totalPipelineValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Pipeline Value</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1e293b' }}>
            <Text style={[styles.summaryValue, { color: '#34d399' }]}>${Math.round(weightedValue).toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Weighted Forecast</Text>
          </View>
        </View>

        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>💼 5-Stage Deals Kanban Pipeline</Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 4 }]}
              onPress={() => setShowNewDealForm(!showNewDealForm)}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff' }}>
                {showNewDealForm ? '✕ Close Form' : '➕ Create Deal'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>Tap stage shifter buttons to transition deals across pipeline stages.</Text>

          {/* Form */}
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
                {(['NEW_LEAD', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON'] as const).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, newDealStage === stg && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setNewDealStage(stg)}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: newDealStage === stg ? '#ffffff' : '#94a3b8' }}>{stg}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingVertical: 8, alignItems: 'center', marginTop: 4 }]} onPress={handleCreateNewDeal}>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>💾 Create Deal Record →</Text>
              </TouchableOpacity>
            </View>
          )}

          {dealsList.map((deal) => (
            <View key={deal.id} style={[styles.itemRow, styles.borderBottom, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.itemName}>{deal.name}</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>Owner: {deal.owner} • Close: {deal.expectedClose}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#818cf8' }}>{deal.val}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                  Stage: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{deal.stage}</Text>
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>Win Prob: {STAGE_PROBABILITIES[deal.stage]}%</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                {(['NEW_LEAD', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON'] as const).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, deal.stage === stg && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => handleShiftDealStage(deal.id, stg)}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: deal.stage === stg ? '#ffffff' : '#94a3b8' }}>{stg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, flexDirection: 'row' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#38bdf8' },
  summaryLabel: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 8, lineHeight: 14 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  formCard: { backgroundColor: '#020617', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#4f46e5', gap: 6, marginVertical: 8 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
});
