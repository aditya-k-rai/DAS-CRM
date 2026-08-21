import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  status: boolean;
}

interface WorkflowAutomationsScreenProps {
  onClose?: () => void;
}

export const WorkflowAutomationsScreen: React.FC<WorkflowAutomationsScreenProps> = ({ onClose }) => {
  const [automationsRules, setAutomationsRules] = useState<AutomationRule[]>([
    { id: '1', name: 'Auto-Send Welcome WhatsApp Message', trigger: 'On New Lead Ingestion', status: true },
    { id: '2', name: 'Schedule Follow-up Call Alert', trigger: 'Lead Inactive 24h', status: true },
    { id: '3', name: 'Nudge Unassigned Leads to Team Leader', trigger: 'Unassigned > 15 Mins', status: false },
  ]);

  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('');

  const handleCreateAutomationRule = () => {
    if (!newRuleName.trim() || !newRuleTrigger.trim()) {
      Alert.alert('Missing Info', 'Please enter automation rule name and trigger event.');
      return;
    }
    const newR: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim(),
      trigger: newRuleTrigger.trim(),
      status: true,
    };
    setAutomationsRules([newR, ...automationsRules]);
    setNewRuleName('');
    setNewRuleTrigger('');
    setShowNewRuleForm(false);
    Alert.alert('✅ Bot Trigger Activated', `Created automation rule "${newR.name}"!`);
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
        <Text style={styles.headerTitle}>⚡ Workflow Automations &amp; Bot Rules</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>⚡ Active Automation Rules &amp; Triggers</Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 4 }]}
              onPress={() => setShowNewRuleForm(!showNewRuleForm)}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff' }}>
                {showNewRuleForm ? '✕ Close Form' : '➕ Add Rule'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>Toggle triggers for auto-nudge, call reminders &amp; lead ingestion.</Text>

          {/* New Rule Form */}
          {showNewRuleForm && (
            <View style={styles.formCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>⚡ Register New Automation Bot Trigger</Text>
              <TextInput style={styles.inputField} placeholder="Rule Name (e.g. SLA 15-Min Followup)" placeholderTextColor="#64748b" value={newRuleName} onChangeText={setNewRuleName} />
              <TextInput style={styles.inputField} placeholder="Trigger Event (e.g. On New Inbound Lead)" placeholderTextColor="#64748b" value={newRuleTrigger} onChangeText={setNewRuleTrigger} />
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingVertical: 8, alignItems: 'center', marginTop: 4 }]} onPress={handleCreateAutomationRule}>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>⚡ Save &amp; Activate Bot Rule →</Text>
              </TouchableOpacity>
            </View>
          )}

          {automationsRules.map((rule) => (
            <View key={rule.id} style={[styles.itemRow, styles.borderBottom]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.itemName}>{rule.name}</Text>
                <Text style={styles.itemSub}>Trigger: {rule.trigger}</Text>
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
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});
