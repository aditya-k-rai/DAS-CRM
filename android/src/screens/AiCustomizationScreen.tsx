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
  ActivityIndicator,
} from 'react-native';

interface AiCustomizationScreenProps {
  onClose?: () => void;
}

export const AiCustomizationScreen: React.FC<AiCustomizationScreenProps> = ({ onClose }) => {
  const [aiEngineEnabled, setAiEngineEnabled] = useState(true);
  const [aiModel, setAiModel] = useState<'GEMINI_PRO' | 'GEMINI_FLASH' | 'CLAUDE_SIM'>('GEMINI_PRO');
  const [aiPersona, setAiPersona] = useState<'CONSULTATIVE' | 'AGGRESSIVE' | 'SUPPORT' | 'CUSTOM'>('CONSULTATIVE');
  const [aiMinScoreThreshold, setAiMinScoreThreshold] = useState('75');
  const [aiAutoNudgeMins, setAiAutoNudgeMins] = useState('15');
  const [aiTemperature, setAiTemperature] = useState('0.7');
  const [aiMaxTokens, setAiMaxTokens] = useState('512');
  const [aiIncludeCatalog, setAiIncludeCatalog] = useState(true);
  const [aiGstTaxCalc, setAiGstTaxCalc] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    'You are Antigravity AI, a top 1% consultative sales executive for DAS CRM Enterprise Suite. Speak politely, highlight 18% GST tax breakdown, and answer questions accurately.'
  );

  // Live Test Sandbox State
  const [testLeadMsg, setTestLeadMsg] = useState('What is the cost of 25 enterprise user licenses?');
  const [testAiReply, setTestAiReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSaveAiRules = () => {
    Alert.alert('✅ AI Customization Saved', `Gemini 1.5 Pro sales assistant rules updated:\n\n• Model: ${aiModel}\n• Persona: ${aiPersona}\n• Min Score: ${aiMinScoreThreshold}\n• Auto-Nudge: ${aiAutoNudgeMins} mins`);
  };

  const handleTestAiResponse = () => {
    if (!testLeadMsg.trim()) return;
    setIsGenerating(true);
    setTestAiReply('');

    setTimeout(() => {
      setIsGenerating(false);
      let reply = '';
      if (aiPersona === 'CONSULTATIVE') {
        reply = `Hello! For 25 enterprise licenses of DAS CRM, the base cost is ₹2,50,000/year. Adding 18% GST (₹45,000), the total amount is ₹2,95,000. Would you like me to share our official proposal deck PDF on WhatsApp?`;
      } else if (aiPersona === 'AGGRESSIVE') {
        reply = `Hi! 25 licenses come to ₹2,95,000 incl. 18% GST. If you complete onboarding today, I can unlock a 15% festival discount immediately. Should I send the checkout link?`;
      } else {
        reply = `Thank you for asking! 25 licenses are available at ₹2,50,000 + 18% GST. Full 24/7 priority support and custom webhook ingestion are included.`;
      }
      setTestAiReply(reply);
    }, 900);
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
        <Text style={styles.headerTitle}>🤖 AI Customization &amp; Rules</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.moduleTitle}>🤖 Gemini 1.5 Pro Sales Assistant</Text>
              <Text style={styles.moduleSub}>In-depth control for persona, model version, auto-nudge &amp; GST prompt.</Text>
            </View>
            <Switch
              value={aiEngineEnabled}
              onValueChange={setAiEngineEnabled}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={{ gap: 12 }}>
            {/* AI Model Selector */}
            <View>
              <Text style={styles.labelTitle}>Select LLM Engine Model:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { key: 'GEMINI_PRO', label: 'Gemini 1.5 Pro' },
                  { key: 'GEMINI_FLASH', label: 'Gemini 1.5 Flash' },
                  { key: 'CLAUDE_SIM', label: 'Claude 3.5 Sonnet' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.chipBtn, aiModel === m.key && styles.chipBtnActive]}
                    onPress={() => setAiModel(m.key as any)}
                  >
                    <Text style={[styles.chipText, aiModel === m.key && styles.chipTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sales Persona */}
            <View>
              <Text style={styles.labelTitle}>Select AI Sales Persona:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['CONSULTATIVE', 'AGGRESSIVE', 'SUPPORT', 'CUSTOM'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chipBtn, aiPersona === p && styles.chipBtnActive]}
                    onPress={() => setAiPersona(p)}
                  >
                    <Text style={[styles.chipText, aiPersona === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSub}>Min Lead Score Threshold:</Text>
                <TextInput style={styles.inputField} value={aiMinScoreThreshold} onChangeText={setAiMinScoreThreshold} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSub}>Auto-Nudge (Mins):</Text>
                <TextInput style={styles.inputField} value={aiAutoNudgeMins} onChangeText={setAiAutoNudgeMins} keyboardType="numeric" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSub}>Temperature (0.1 - 1.0):</Text>
                <TextInput style={styles.inputField} value={aiTemperature} onChangeText={setAiTemperature} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSub}>Max Reply Tokens:</Text>
                <TextInput style={styles.inputField} value={aiMaxTokens} onChangeText={setAiMaxTokens} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>Include Product Catalog Specs in Replies</Text>
              <Switch value={aiIncludeCatalog} onValueChange={setAiIncludeCatalog} trackColor={{ false: '#334155', true: '#10b981' }} thumbColor="#ffffff" />
            </View>

            <View style={styles.switchRow}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>Compute 18% GST Tax Breakdown Automatically</Text>
              <Switch value={aiGstTaxCalc} onValueChange={setAiGstTaxCalc} trackColor={{ false: '#334155', true: '#10b981' }} thumbColor="#ffffff" />
            </View>

            <View>
              <Text style={styles.labelSub}>Custom AI System Instructions Prompt:</Text>
              <TextInput style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]} value={aiSystemPrompt} onChangeText={setAiSystemPrompt} multiline />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAiRules}>
              <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>💾 Save AI Rules &amp; Persona Settings →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live AI Test Sandbox */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <Text style={styles.moduleTitle}>🧪 Live AI Assistant Sandbox</Text>
          <Text style={styles.moduleSub}>Simulate inbound lead messages to test your prompt, persona &amp; GST tax breakdown live.</Text>

          <View style={{ gap: 8, marginTop: 8 }}>
            <TextInput
              style={[styles.inputField, { height: 50 }]}
              value={testLeadMsg}
              onChangeText={setTestLeadMsg}
              placeholder="Type test lead message..."
              placeholderTextColor="#64748b"
            />
            <TouchableOpacity style={styles.testBtn} onPress={handleTestAiResponse} disabled={isGenerating}>
              <Text style={styles.btnTextWhite}>{isGenerating ? '⏳ Generating AI Reply...' : '🤖 Test AI Assistant Response →'}</Text>
            </TouchableOpacity>

            {isGenerating && <ActivityIndicator color="#38bdf8" style={{ marginTop: 8 }} />}

            {testAiReply.length > 0 && (
              <View style={styles.testResultBox}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#38bdf8', marginBottom: 4 }}>🤖 AI Assistant Output ({aiPersona} Persona):</Text>
                <Text style={{ fontSize: 11, color: '#ffffff', lineHeight: 16 }}>{testAiReply}</Text>
              </View>
            )}
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
  labelTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 6 },
  labelSub: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  chipBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  chipBtnActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  chipText: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
  chipTextActive: { color: '#ffffff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  saveBtn: { backgroundColor: '#34d399', paddingVertical: 12, alignItems: 'center', borderRadius: 10, marginTop: 4 },
  testBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  btnTextWhite: { fontSize: 11, fontWeight: '900', color: '#ffffff' },
  testResultBox: { backgroundColor: '#020617', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#38bdf8', marginTop: 6 },
});
