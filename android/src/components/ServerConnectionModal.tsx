import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { getApiBase, setApiBase, testApiEndpoint, getCandidateApiUrls, normalizeApiUrl } from '../config/api';
import { offlineSyncEngine } from '../services/offlineSyncEngine';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ServerConnectionModal({ visible, onClose }: Props) {
  const { isDark } = useTheme();
  const [currentUrl, setCurrentUrl] = useState(getApiBase());
  const [inputUrl, setInputUrl] = useState(getApiBase());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [candidateResults, setCandidateResults] = useState<{ url: string; status: 'idle' | 'testing' | 'ok' | 'fail'; latency?: number }[]>([]);

  useEffect(() => {
    if (visible) {
      const active = getApiBase();
      setCurrentUrl(active);
      setInputUrl(active);
      setTestResult(null);

      const candidates = getCandidateApiUrls();
      setCandidateResults(candidates.map(c => ({ url: c, status: 'idle' })));
    }
  }, [visible]);

  const handleTestUrl = async (urlToTest: string) => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testApiEndpoint(urlToTest);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleAutoDetect = async () => {
    setIsTesting(true);
    setTestResult(null);
    const candidates = getCandidateApiUrls();

    setCandidateResults(candidates.map(c => ({ url: c, status: 'testing' })));

    let foundWorkingUrl: string | null = null;
    let bestLatency = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const res = await testApiEndpoint(c);

      setCandidateResults(prev => prev.map((item, idx) => {
        if (idx === i) {
          return {
            url: c,
            status: res.success ? 'ok' : 'fail',
            latency: res.latencyMs,
          };
        }
        return item;
      }));

      if (res.success && !foundWorkingUrl) {
        foundWorkingUrl = c;
        bestLatency = res.latencyMs;
      }
    }

    setIsTesting(false);

    if (foundWorkingUrl) {
      setInputUrl(foundWorkingUrl);
      setTestResult({ success: true, latencyMs: bestLatency });
    } else {
      setTestResult({ success: false, error: 'No reachable candidate server found.' });
    }
  };

  const handleSaveAndConnect = async () => {
    const cleanUrl = normalizeApiUrl(inputUrl);
    setApiBase(cleanUrl);
    setCurrentUrl(cleanUrl);
    await offlineSyncEngine.checkNetworkStatus();
    onClose();
  };

  const bg = isDark ? '#0f172a' : '#ffffff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: bg, borderColor }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🌐</Text>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Backend Server Connection</Text>
                <Text style={[styles.subTitle, { color: subTextColor }]}>Configure host IP &amp; live sync endpoint</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: subTextColor, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Active URL Status */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionLabel, { color: subTextColor }]}>CURRENT ACTIVE BACKEND</Text>
              <Text style={[styles.activeUrlText, { color: textColor }]}>{currentUrl}</Text>
            </View>

            {/* URL Input Box */}
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Server API URL:</Text>
              <TextInput
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="http://192.168.X.X:3001/api/v1"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#090d16' : '#ffffff',
                    color: textColor,
                    borderColor: borderColor,
                  },
                ]}
              />
            </View>

            {/* Test Result Indicator */}
            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  {
                    backgroundColor: testResult.success ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: testResult.success ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.testResultText,
                    { color: testResult.success ? '#34d399' : '#ef4444' },
                  ]}
                >
                  {testResult.success
                    ? `✓ Connected successfully (${testResult.latencyMs}ms latency)`
                    : `⚠️ Connection Failed: ${testResult.error || 'Server unreachable'}`}
                </Text>
              </View>
            )}

            {/* Quick Actions (Test Single & Auto Detect) */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.testBtn, isTesting && { opacity: 0.6 }]}
                onPress={() => handleTestUrl(inputUrl)}
                disabled={isTesting}
                activeOpacity={0.7}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.testBtnText}>⚡ Ping Test</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.autoDetectBtn, isTesting && { opacity: 0.6 }]}
                onPress={handleAutoDetect}
                disabled={isTesting}
                activeOpacity={0.7}
              >
                <Text style={styles.autoDetectBtnText}>🔍 Auto-Detect Server</Text>
              </TouchableOpacity>
            </View>

            {/* Candidate URLs Quick Selector */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionLabel, { color: subTextColor, marginBottom: 8 }]}>QUICK PRESETS &amp; PROBED CANDIDATES</Text>
              {candidateResults.map((c, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.candidateRow,
                    {
                      backgroundColor: cardBg,
                      borderColor: inputUrl === c.url ? '#6366f1' : borderColor,
                      borderWidth: inputUrl === c.url ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setInputUrl(c.url);
                    handleTestUrl(c.url);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                      {c.url}
                    </Text>
                    <Text style={[styles.candidateHint, { color: subTextColor }]}>
                      {c.url.includes('192.168.29.26')
                        ? 'Wi-Fi Local Host (Developer PC)'
                        : c.url.includes('10.0.2.2')
                        ? 'Android Studio Emulator'
                        : c.url.includes('localhost')
                        ? 'Local loopback'
                        : 'Custom / Expo host'}
                    </Text>
                  </View>
                  {c.status === 'testing' && <ActivityIndicator size="small" color="#6366f1" />}
                  {c.status === 'ok' && (
                    <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '700' }}>✓ {c.latency}ms</Text>
                  )}
                  {c.status === 'fail' && <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>✕ Failed</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Device Help Tip */}
            <View style={[styles.tipBox, { borderColor }]}>
              <Text style={[styles.tipText, { color: subTextColor }]}>
                💡 <Text style={{ fontWeight: '700', color: textColor }}>Physical Device Tip:</Text> Ensure your Android phone and computer are on the same Wi-Fi network. If on Mobile Data (LTE), use an ngrok or public cloud URL.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAndConnect}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>✓ Save &amp; Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  section: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeUrlText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  testResultBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  testResultText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  autoDetectBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoDetectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  candidateUrl: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  candidateHint: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  tipBox: {
    marginTop: 12,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  tipText: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
