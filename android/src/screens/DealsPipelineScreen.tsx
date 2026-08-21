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
  stage: 'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON';
  company: string;
}

interface DealsPipelineScreenProps {
  onClose?: () => void;
}

export const DealsPipelineScreen: React.FC<DealsPipelineScreenProps> = ({ onClose }) => {
  const [dealsList, setDealsList] = useState<DealItem[]>([
    { id: '1', name: 'TechCorp Solutions', val: '$128,400', stage: 'QUALIFIED', company: 'TechCorp' },
    { id: '2', name: 'LogiTech Freight', val: '$412,000', stage: 'PROPOSAL', company: 'LogiTech' },
    { id: '3', name: 'Sunita Logistics', val: '$89,000', stage: 'NEW_LEAD', company: 'Sunita' },
  ]);

  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealStage, setNewDealStage] = useState<'NEW_LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON'>('NEW_LEAD');

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
      stage: newDealStage,
    };
    setDealsList([newDeal, ...dealsList]);
    setNewDealTitle('');
    setNewDealCompany('');
    setNewDealValue('');
    setShowNewDealForm(false);
    Alert.alert('✅ Deal Registered', `Created new enterprise deal "${newDeal.name}"!`);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>💼 Deals Pipeline Kanban</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
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

          {/* New Deal Form */}
          {showNewDealForm && (
            <View style={styles.formCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>💼 Register New Enterprise Deal</Text>
              <TextInput style={styles.inputField} placeholder="Deal Title (e.g. Acme Corp CRM)" placeholderTextColor="#64748b" value={newDealTitle} onChangeText={setNewDealTitle} />
              <TextInput style={styles.inputField} placeholder="Company Name" placeholderTextColor="#64748b" value={newDealCompany} onChangeText={setNewDealCompany} />
              <TextInput style={styles.inputField} placeholder="Deal Value (e.g. $150,000)" placeholderTextColor="#64748b" value={newDealValue} onChangeText={setNewDealValue} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {(['NEW_LEAD', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON'] as const).map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' }, newDealStage === stg && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
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
                <Text style={styles.itemName}>{deal.name} ({deal.company})</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#818cf8' }}>{deal.val}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>Stage: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{deal.stage}</Text></Text>
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
