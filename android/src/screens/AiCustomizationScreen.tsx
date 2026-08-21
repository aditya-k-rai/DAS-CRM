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

interface AiCustomizationScreenProps {
  onClose?: () => void;
}

export const AiCustomizationScreen: React.FC<AiCustomizationScreenProps> = ({ onClose }) => {
  const [aiEngineEnabled, setAiEngineEnabled] = useState(true);
  const [aiPersona, setAiPersona] = useState<'CONSULTATIVE' | 'AGGRESSIVE' | 'SUPPORT' | 'CUSTOM'>('CONSULTATIVE');
  const [aiMinScoreThreshold, setAiMinScoreThreshold] = useState('75');
  const [aiAutoNudgeMins, setAiAutoNudgeMins] = useState('15');
  const [aiIncludeCatalog, setAiIncludeCatalog] = useState(true);
  const [aiGstTaxCalc, setAiGstTaxCalc] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    'You are Antigravity AI, a top 1% consultative sales executive for DAS CRM Enterprise Suite. Speak politely, highlight 18% GST tax breakdown, and answer questions accurately.'
  );

  const handleSaveAiRules = () => {
    Alert.alert('✅ AI Customization Saved', 'Gemini 1.5 Pro sales assistant rules & system instructions updated live!');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>🤖 AI Customization &amp; Rules</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.moduleTitle}>🤖 Gemini 1.5 Pro Sales Assistant</Text>
              <Text style={styles.moduleSub}>In-depth control for persona, auto-nudge &amp; GST prompt.</Text>
            </View>
            <Switch
              value={aiEngineEnabled}
              onValueChange={setAiEngineEnabled}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 6 }}>Select AI Sales Persona:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['CONSULTATIVE', 'AGGRESSIVE', 'SUPPORT', 'CUSTOM'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, aiPersona === p && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setAiPersona(p)}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '900', color: '#94a3b8' }, aiPersona === p && { color: '#ffffff' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Min Lead Score Threshold:</Text>
                <TextInput style={styles.inputField} value={aiMinScoreThreshold} onChangeText={setAiMinScoreThreshold} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Auto-Nudge (Mins):</Text>
                <TextInput style={styles.inputField} value={aiAutoNudgeMins} onChangeText={setAiAutoNudgeMins} keyboardType="numeric" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>Include Product Catalog Specs in Replies</Text>
              <Switch value={aiIncludeCatalog} onValueChange={setAiIncludeCatalog} trackColor={{ false: '#334155', true: '#10b981' }} thumbColor="#ffffff" />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>Compute 18% GST Tax Breakdown Automatically</Text>
              <Switch value={aiGstTaxCalc} onValueChange={setAiGstTaxCalc} trackColor={{ false: '#334155', true: '#10b981' }} thumbColor="#ffffff" />
            </View>

            <View>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Custom AI System Instructions Prompt:</Text>
              <TextInput style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]} value={aiSystemPrompt} onChangeText={setAiSystemPrompt} multiline />
            </View>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34d399', paddingVertical: 12, alignItems: 'center', marginTop: 4 }]} onPress={handleSaveAiRules}>
              <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>💾 Save AI Rules &amp; Persona Settings →</Text>
            </TouchableOpacity>
          </View>
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
});
