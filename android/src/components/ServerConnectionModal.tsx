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
import {
  getApiBase,
  setApiBase,
  testApiEndpoint,
  normalizeApiUrl,
  findFastestReachableEndpoint,
  getExpoHostIp,
  PROD_CLOUD_API_URL,
  CURRENT_LAN_API_URL,
  EMULATOR_API_URL,
  LOCALHOST_API_URL,
} from '../config/api';
import { offlineSyncEngine, SyncEngineState } from '../services/offlineSyncEngine';
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
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [syncState, setSyncState] = useState<SyncEngineState>(offlineSyncEngine.getState());

  const expoHostIp = getExpoHostIp();
  const expoMetroUrl = expoHostIp ? `http://${expoHostIp}:3001/api/v1` : null;

  useEffect(() => {
    if (visible) {
      const active = getApiBase();
      setCurrentUrl(active);
      setInputUrl(active);
      setTestResult(null);
      setSyncState(offlineSyncEngine.getState());
      // Run quick health ping on active endpoint
      handleTestUrl(active);
    }
  }, [visible]);

  const handleTestUrl = async (urlToTest: string) => {
    setIsTesting(true);
    setTestResult(null);
    const cleanUrl = normalizeApiUrl(urlToTest);
    const res = await testApiEndpoint(cleanUrl, 3000);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    setTestResult(null);
    const fastest = await findFastestReachableEndpoint(2500);
    setIsAutoDetecting(false);
    if (fastest) {
      setInputUrl(fastest);
      setCurrentUrl(fastest);
      handleTestUrl(fastest);
    } else {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: 'No active backend server detected among candidate URLs. Ensure your backend server is running on port 3001.',
      });
    }
  };

  const handleSetDefaultCloud = () => {
    setInputUrl(PROD_CLOUD_API_URL);
    handleTestUrl(PROD_CLOUD_API_URL);
  };

  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    handleTestUrl(url);
  };

  const handleSaveAndConnect = async () => {
    const cleanUrl = normalizeApiUrl(inputUrl);
    setApiBase(cleanUrl);
    setCurrentUrl(cleanUrl);
    await offlineSyncEngine.checkNetworkStatus();
    onClose();
  };

  const isHttps = inputUrl.toLowerCase().startsWith('https://');
  const isDefaultCloud = normalizeApiUrl(inputUrl) === normalizeApiUrl(PROD_CLOUD_API_URL);

  const bg = isDark ? '#090d16' : '#ffffff';
  const cardBg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: bg, borderColor }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconCircle}>
                <Text style={{ fontSize: 18 }}>🌐</Text>
              </View>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Cloud Connection &amp; Diagnostics</Text>
                <Text style={[styles.subTitle, { color: subTextColor }]}>Backend Gateway &amp; Enterprise Network Status</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: subTextColor, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Active Endpoint Status Card */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.sectionLabel, { color: subTextColor }]}>ACTIVE ENTERPRISE BACKEND</Text>
                <View style={[styles.securityBadge, { backgroundColor: isHttps ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)', borderColor: isHttps ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)' }]}>
                  <Text style={[styles.securityBadgeText, { color: isHttps ? '#34d399' : '#f59e0b' }]}>
                    {isHttps ? '🔒 TLS 1.3 SECURE' : '🔓 HTTP GATEWAY'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.activeUrlText, { color: textColor }]} numberOfLines={2}>
                {currentUrl}
              </Text>
            </View>

            {/* Offline Engine Diagnostics */}
            <View style={[styles.diagRow, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: subTextColor }]}>NETWORK</Text>
                <Text style={[styles.diagVal, { color: syncState.isOnline ? '#34d399' : '#ef4444' }]}>
                  {syncState.isOnline ? '🟢 Online' : '🔴 Offline'}
                </Text>
              </View>
              <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />
              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: subTextColor }]}>BACKEND API</Text>
                <Text style={[styles.diagVal, { color: syncState.isBackendConnected ? '#34d399' : '#f59e0b' }]}>
                  {syncState.isBackendConnected ? '🟢 Reachable' : '⚠️ Unreachable'}
                </Text>
              </View>
              <View style={[styles.diagDivider, { backgroundColor: borderColor }]} />
              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: subTextColor }]}>QUEUE</Text>
                <Text style={[styles.diagVal, { color: syncState.pendingCount === 0 ? '#34d399' : '#6366f1' }]}>
                  {syncState.pendingCount === 0 ? '✓ 0 Synced' : `${syncState.pendingCount} Queued`}
                </Text>
              </View>
            </View>

            {/* URL Input Box */}
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Server Gateway URL:</Text>
                {!isDefaultCloud && (
                  <TouchableOpacity onPress={handleSetDefaultCloud} activeOpacity={0.7}>
                    <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: '700' }}>↺ Reset to Cloud Default</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="http://192.168.29.26:3001/api/v1"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
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
                    backgroundColor: testResult.success ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    borderColor: testResult.success ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)',
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
                    ? `✓ Connection Healthy • Response Time: ${testResult.latencyMs}ms`
                    : `⚠️ Gateway Unreachable • ${testResult.error || 'Server did not respond'}`}
                </Text>
              </View>
            )}

            {/* Action Buttons: Auto-Detect & Ping */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.autoDetectBtn, isAutoDetecting && { opacity: 0.6 }]}
                onPress={handleAutoDetect}
                disabled={isAutoDetecting || isTesting}
                activeOpacity={0.75}
              >
                {isAutoDetecting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.autoDetectBtnText}>⚡ Auto-Detect Server</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testBtn, isTesting && { opacity: 0.6 }]}
                onPress={() => handleTestUrl(inputUrl)}
                disabled={isTesting || isAutoDetecting}
                activeOpacity={0.75}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.testBtnText}>🔍 Ping Test</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={{ marginTop: 18 }}>
              <Text style={[styles.sectionLabel, { color: subTextColor, marginBottom: 8 }]}>QUICK PRESETS</Text>
              
              {/* Preset: Dynamic Expo Metro Bundler (if detected) */}
              {expoMetroUrl && (
                <TouchableOpacity
                  style={[
                    styles.candidateRow,
                    {
                      backgroundColor: cardBg,
                      borderColor: normalizeApiUrl(inputUrl) === normalizeApiUrl(expoMetroUrl) ? '#6366f1' : borderColor,
                      borderWidth: normalizeApiUrl(inputUrl) === normalizeApiUrl(expoMetroUrl) ? 2 : 1,
                      marginBottom: 8,
                    },
                  ]}
                  onPress={() => handleSelectPreset(expoMetroUrl)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                      {expoMetroUrl}
                    </Text>
                    <Text style={[styles.candidateHint, { color: subTextColor }]}>
                      ⚡ Expo Metro Bundler Host (Detected Dev Server)
                    </Text>
                  </View>
                  <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '800' }}>Select →</Text>
                </TouchableOpacity>
              )}

              {/* Preset: Android Studio Emulator */}
              <TouchableOpacity
                style={[
                  styles.candidateRow,
                  {
                    backgroundColor: cardBg,
                    borderColor: normalizeApiUrl(inputUrl) === normalizeApiUrl(EMULATOR_API_URL) ? '#6366f1' : borderColor,
                    borderWidth: normalizeApiUrl(inputUrl) === normalizeApiUrl(EMULATOR_API_URL) ? 2 : 1,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => handleSelectPreset(EMULATOR_API_URL)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                    {EMULATOR_API_URL}
                  </Text>
                  <Text style={[styles.candidateHint, { color: subTextColor }]}>
                    📱 Android Studio Emulator Loopback (10.0.2.2:3001)
                  </Text>
                </View>
                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '800' }}>Select →</Text>
              </TouchableOpacity>

              {/* Preset: Wi-Fi LAN */}
              <TouchableOpacity
                style={[
                  styles.candidateRow,
                  {
                    backgroundColor: cardBg,
                    borderColor: normalizeApiUrl(inputUrl) === normalizeApiUrl(CURRENT_LAN_API_URL) ? '#6366f1' : borderColor,
                    borderWidth: normalizeApiUrl(inputUrl) === normalizeApiUrl(CURRENT_LAN_API_URL) ? 2 : 1,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => handleSelectPreset(CURRENT_LAN_API_URL)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                    {CURRENT_LAN_API_URL}
                  </Text>
                  <Text style={[styles.candidateHint, { color: subTextColor }]}>
                    📶 Host Computer Wi-Fi LAN IP
                  </Text>
                </View>
                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '800' }}>Select →</Text>
              </TouchableOpacity>

              {/* Preset: Localhost */}
              <TouchableOpacity
                style={[
                  styles.candidateRow,
                  {
                    backgroundColor: cardBg,
                    borderColor: normalizeApiUrl(inputUrl) === normalizeApiUrl(LOCALHOST_API_URL) ? '#6366f1' : borderColor,
                    borderWidth: normalizeApiUrl(inputUrl) === normalizeApiUrl(LOCALHOST_API_URL) ? 2 : 1,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => handleSelectPreset(LOCALHOST_API_URL)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                    {LOCALHOST_API_URL}
                  </Text>
                  <Text style={[styles.candidateHint, { color: subTextColor }]}>
                    💻 Localhost (iOS Simulator / Desktop / Web)
                  </Text>
                </View>
                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '800' }}>Select →</Text>
              </TouchableOpacity>

              {/* Preset: Production Cloud */}
              <TouchableOpacity
                style={[
                  styles.candidateRow,
                  {
                    backgroundColor: cardBg,
                    borderColor: normalizeApiUrl(inputUrl) === normalizeApiUrl(PROD_CLOUD_API_URL) ? '#6366f1' : borderColor,
                    borderWidth: normalizeApiUrl(inputUrl) === normalizeApiUrl(PROD_CLOUD_API_URL) ? 2 : 1,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => handleSelectPreset(PROD_CLOUD_API_URL)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.candidateUrl, { color: textColor }]} numberOfLines={1}>
                      {PROD_CLOUD_API_URL}
                    </Text>
                    {isDefaultCloud && (
                      <View style={[styles.activePill, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                        <Text style={{ fontSize: 9, color: '#818cf8', fontWeight: '800' }}>CLOUD</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.candidateHint, { color: subTextColor }]}>
                    ☁️ Production Cloud Backend (HTTPS Cluster)
                  </Text>
                </View>
                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '800' }}>Select →</Text>
              </TouchableOpacity>
            </View>

            {/* Enterprise Security Tip */}
            <View style={[styles.tipBox, { borderColor }]}>
              <Text style={[styles.tipText, { color: subTextColor }]}>
                🔒 <Text style={{ fontWeight: '700', color: textColor }}>Enterprise Grade Sync:</Text> DAS CRM uses end-to-end encrypted tunnels with auto-failover, real-time lead push, and offline-first queue replication.
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
              <Text style={styles.saveBtnText}>✓ Apply &amp; Connect</Text>
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
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  securityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  activeUrlText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  diagItem: {
    flex: 1,
    alignItems: 'center',
  },
  diagLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  diagVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  diagDivider: {
    width: 1,
    height: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  autoDetectBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoDetectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
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
    marginTop: 3,
  },
  activePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
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
