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
}

export const WorkflowAutomationsScreen: React.FC<WorkflowAutomationsScreenProps> = ({ onClose }) => {
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

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <Text style={styles.moduleSub}>Toggle triggers for auto-nudge, call reminders, WhatsApp dispatches &amp; lead reassignment.</Text>

          {/* Form */}
          {showNewRuleForm && (
            <View style={styles.formCard}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>⚡ Register New Automation Bot Trigger</Text>
              <TextInput style={styles.inputField} placeholder="Rule Name (e.g. SLA 15-Min Followup)" placeholderTextColor="#64748b" value={newRuleName} onChangeText={setNewRuleName} />
              <TextInput style={styles.inputField} placeholder="Trigger Event (e.g. On New Inbound Lead)" placeholderTextColor="#64748b" value={newRuleTrigger} onChangeText={setNewRuleTrigger} />

              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Select Automated Action:</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['SEND_WHATSAPP', 'SEND_EMAIL', 'CREATE_TASK', 'REASSIGN_LEAD'] as const).map((act) => (
                    <TouchableOpacity
                      key={act}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' }, newRuleAction === act && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                      onPress={() => setNewRuleAction(act)}
                    >
                      <Text style={{ fontSize: 7, fontWeight: '900', color: newRuleAction === act ? '#ffffff' : '#94a3b8' }}>{act}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Select Delay Timer:</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['IMMEDIATELY', '15_MINS', '1_HOUR', '24_HOURS'] as const).map((del) => (
                    <TouchableOpacity
                      key={del}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' }, newRuleDelay === del && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                      onPress={() => setNewRuleDelay(del)}
                    >
                      <Text style={{ fontSize: 7, fontWeight: '900', color: newRuleDelay === del ? '#ffffff' : '#94a3b8' }}>{del}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingVertical: 8, alignItems: 'center', marginTop: 4 }]} onPress={handleCreateAutomationRule}>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>⚡ Save &amp; Activate Bot Rule →</Text>
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
                <Text style={styles.itemSub}>Trigger: {rule.trigger} • Delay: {rule.delay} • {rule.triggersCount} executions</Text>
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

        {/* Execution Audit Log */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <Text style={styles.moduleTitle}>🤖 Bot Execution Audit History</Text>
          <Text style={styles.moduleSub}>Real-time log of automated bot triggers dispatched by DAS CRM background workers.</Text>

          {botLogs.map((log) => (
            <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#020617' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>{log.ruleName}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8' }}>Target: {log.leadName} • {log.time}</Text>
              </View>
              <Text style={{ fontSize: 9, fontWeight: '900', color: log.status === 'EXECUTED' ? '#34d399' : '#94a3b8' }}>{log.status}</Text>
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
  itemName: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  actionBadge: { fontSize: 7, fontWeight: '900', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  itemSub: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
});
