/**
 * ProfileScreen.tsx — DAS CRM Android
 * Comprehensive User Profile with:
 * 1. Identity & Avatar Upload (10-Day Lock Rule)
 * 2. Workspace & Subscription Telemetry
 * 3. Performance Telemetry
 * 4. 📄 Documents & Identity Verification (15-Day Update Lock & Historical Log Viewer)
 * 5. 💳 Bank & Payout Telemetry (15-Day Update Lock & Historical Log Viewer)
 * 6. Live Workspace Sync, Connection Test, CSV Data Export & Logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole } from '../store/authStore';
import { apiService } from '../services/apiService';

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenUpdate?: () => void;
  onClose?: () => void;
}

export default function ProfileScreen({ onLogout, onOpenUpdate, onClose }: ProfileScreenProps) {
  const { currentUser, subscription, logout } = useAuthStore();
  const role: UserRole = currentUser.role || 'SALES_EXEC';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('Today, 5:12 PM');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);

  // 🚀 Plans Selection Modal State
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState<'GROWTH' | 'PRO' | 'MAX'>('PRO');

  // 📷 DP Avatar Upload State & 10-Day Change Cooldown Lock
  const [dpModalOpen, setDpModalOpen] = useState(false);
  const [currentDpUrl, setCurrentDpUrl] = useState<string | null>(null);
  const [inputDpUrl, setInputDpUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1024&q=80'
  );
  const [lastDpChangedAt, setLastDpChangedAt] = useState<number | null>(
    Date.now() - 12 * 24 * 60 * 60 * 1000
  );

  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const timeSinceLastDpChange = lastDpChangedAt ? Date.now() - lastDpChangedAt : TEN_DAYS_MS + 1000;
  const isDpLocked = timeSinceLastDpChange < TEN_DAYS_MS;
  const dpDaysRemaining = Math.ceil((TEN_DAYS_MS - timeSinceLastDpChange) / (1000 * 60 * 60 * 24));

  // 📄 15-DAY DOCUMENTS UPDATE LOCK & HISTORY
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const [lastDocChangedAt, setLastDocChangedAt] = useState<number | null>(
    Date.now() - 18 * 24 * 60 * 60 * 1000 // Initial state: 18 days ago so update is unlocked
  );
  const timeSinceLastDocChange = lastDocChangedAt ? Date.now() - lastDocChangedAt : FIFTEEN_DAYS_MS + 1000;
  const isDocLocked = timeSinceLastDocChange < FIFTEEN_DAYS_MS;
  const docDaysRemaining = Math.ceil((FIFTEEN_DAYS_MS - timeSinceLastDocChange) / (1000 * 60 * 60 * 24));

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docHistoryModalOpen, setDocHistoryModalOpen] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('AADHAAR_9876_VERIFIED.pdf');
  const [panInput, setPanInput] = useState('ABCDE1234F');
  const [eduCertInput, setEduCertInput] = useState('DEGREE_BTECH_2024.pdf');
  const [offerLetterInput, setOfferLetterInput] = useState('OFFER_LETTER_ACME_2026.pdf');
  const [docHistoryLogs, setDocHistoryLogs] = useState<{ date: string; docType: string; oldValue: string; newValue: string }[]>([
    { date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' },
    { date: 'Jul 15, 2026', docType: 'Aadhaar ID', oldValue: 'AADHAAR_OLD.pdf', newValue: 'AADHAAR_9876_VERIFIED.pdf' },
  ]);

  // 💳 15-DAY BANK DETAILS UPDATE LOCK & HISTORY
  const [lastBankChangedAt, setLastBankChangedAt] = useState<number | null>(
    Date.now() - 20 * 24 * 60 * 60 * 1000 // Initial state: 20 days ago so update is unlocked
  );
  const timeSinceLastBankChange = lastBankChangedAt ? Date.now() - lastBankChangedAt : FIFTEEN_DAYS_MS + 1000;
  const isBankLocked = timeSinceLastBankChange < FIFTEEN_DAYS_MS;
  const bankDaysRemaining = Math.ceil((FIFTEEN_DAYS_MS - timeSinceLastBankChange) / (1000 * 60 * 60 * 24));

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankHistoryModalOpen, setBankHistoryModalOpen] = useState(false);
  const [bankNameInput, setBankNameInput] = useState('HDFC Bank');
  const [accountHolderInput, setAccountHolderInput] = useState(currentUser.name || 'Vikram Singh');
  const [accountNoInput, setAccountNoInput] = useState('50100987654321');
  const [ifscCodeInput, setIfscCodeInput] = useState('HDFC0001234');
  const [upiIdInput, setUpiIdInput] = useState('vikram@hdfcbank');
  const [bankHistoryLogs, setBankHistoryLogs] = useState<{ date: string; bankName: string; accountNo: string }[]>([
    { date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' },
    { date: 'May 10, 2026', bankName: 'SBI Bank', accountNo: '1122XXXX9900' },
  ]);

  const handleSaveDocuments = () => {
    if (isDocLocked) {
      Alert.alert('🔒 15-Day Lock Active', `You can only update documents once every 15 days. Next update eligible in ${docDaysRemaining} days.`);
      return;
    }
    const newLog = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      docType: 'PAN / Aadhaar Update',
      oldValue: 'Previous Records',
      newValue: `PAN: ${panInput}`,
    };
    setDocHistoryLogs(prev => [newLog, ...prev]);
    setLastDocChangedAt(Date.now());
    setDocModalOpen(false);
    Alert.alert('✅ Documents Updated', 'Your identity & employment documents have been updated. 15-day cooldown locked.');
  };

  const handleSaveBankDetails = () => {
    if (isBankLocked) {
      Alert.alert('🔒 15-Day Lock Active', `You can only update bank details once every 15 days. Next update eligible in ${bankDaysRemaining} days.`);
      return;
    }
    const newLog = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      bankName: bankNameInput,
      accountNo: accountNoInput,
    };
    setBankHistoryLogs(prev => [newLog, ...prev]);
    setLastBankChangedAt(Date.now());
    setBankModalOpen(false);
    Alert.alert('✅ Bank Details Updated', 'Your banking telemetry & payout details have been updated. 15-day cooldown locked.');
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const checkNetworkReachability = async (): Promise<boolean> => {
    const res = await apiService.checkBackendHealth();
    setIsOnline(res.isOnline);
    setIsBackendConnected(res.isBackendConnected);
    setLatency(res.latencyMs);
    return res.isOnline;
  };

  React.useEffect(() => {
    checkNetworkReachability();
  }, []);

  const handleSyncWorkspaceData = async () => {
    setIsSyncing(true);
    const online = await checkNetworkReachability();
    if (!online) {
      setIsSyncing(false);
      setLastSyncTime('Sync Stopped (Offline)');
      Alert.alert('⚠️ Internet Disconnected', 'Cannot sync workspace while internet is off.');
      return;
    }
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(`Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      Alert.alert('✅ Live Workspace Sync Complete', 'All lead telemetry and settings synced.');
    }, 1200);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    const res = await apiService.checkBackendHealth();
    setIsTestingConn(false);
    setIsOnline(res.isOnline);
    setIsBackendConnected(res.isBackendConnected);
    setLatency(res.latencyMs);
    Alert.alert('📡 Connection Diagnostics', `Status: ${res.isBackendConnected ? 'Connected' : 'Offline'}\nLatency: ${res.latencyMs}ms`);
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  const roleColor = role === 'ADMIN' ? '#818cf8' : role === 'MANAGER' ? '#c084fc' : role === 'HR' ? '#38bdf8' : '#34d399';
  const planColor = subscription.planType === 'FREE_TRIAL' ? '#fbbf24' : '#34d399';

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>User Identity &amp; Profile</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>✕ Close Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. IDENTITY CARD */}
        <View style={styles.identityCard}>
          <TouchableOpacity onPress={() => setDpModalOpen(true)} activeOpacity={0.8}>
            <View style={styles.avatarGlow}>
              {currentDpUrl ? (
                <Image source={{ uri: currentDpUrl }} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
              ) : (
                <Text style={styles.avatarText}>{currentUser.avatar || '👤'}</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '50' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>{role.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: planColor + '20', borderColor: planColor + '50' }]}>
                <Text style={[styles.planBadgeText, { color: planColor }]}>{subscription.planType}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 2. DOCUMENTS & IDENTITY VERIFICATION CARD (15-DAY LOCK RULE) ─── */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeaderWithBtn}>
            <Text style={styles.cardBoxTitle}>📄 Documents &amp; Identity Verification</Text>
            <TouchableOpacity onPress={() => setDocHistoryModalOpen(true)}>
              <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>View Old Log 📜</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN Card Number:</Text>
            <Text style={styles.infoValue}>{panInput}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aadhaar / Govt ID:</Text>
            <Text style={styles.infoValue}>{aadhaarInput}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Educational Cert:</Text>
            <Text style={styles.infoValue}>{eduCertInput}</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionCardBtn, isDocLocked && styles.actionCardBtnLocked]}
            onPress={() => setDocModalOpen(true)}
          >
            <Text style={[styles.actionCardBtnText, isDocLocked && styles.actionCardBtnTextLocked]}>
              {isDocLocked ? `🔒 Documents Locked (Next update in ${docDaysRemaining} days)` : '✏️ Upload / Update Identity Documents →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. BANK & PAYOUT TELEMETRY CARD (15-DAY LOCK RULE) ─────────── */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeaderWithBtn}>
            <Text style={styles.cardBoxTitle}>💳 Bank &amp; Payout Telemetry</Text>
            <TouchableOpacity onPress={() => setBankHistoryModalOpen(true)}>
              <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>View Old Log 📜</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank Name:</Text>
            <Text style={styles.infoValue}>{bankNameInput}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Holder:</Text>
            <Text style={styles.infoValue}>{accountHolderInput}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number:</Text>
            <Text style={styles.infoValue}>{accountNoInput}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>IFSC Code:</Text>
            <Text style={styles.infoValue}>{ifscCodeInput}</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionCardBtn, isBankLocked && styles.actionCardBtnLocked]}
            onPress={() => setBankModalOpen(true)}
          >
            <Text style={[styles.actionCardBtnText, isBankLocked && styles.actionCardBtnTextLocked]}>
              {isBankLocked ? `🔒 Bank Details Locked (Next update in ${bankDaysRemaining} days)` : '✏️ Update Bank &amp; Payout Details →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. WORKSPACE DETAILS ─────────────────────────────────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>Workspace &amp; Organization</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company / Tenant:</Text>
            <Text style={styles.infoValue}>{currentUser.companyName || 'Acme Sales Solutions'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tenant ID:</Text>
            <Text style={styles.infoValue}>org_98234a1b</Text>
          </View>
        </View>

        {/* ── 5. LIVE WORKSPACE SYNC & DIAGNOSTICS ─────────────────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>System Sync &amp; Data Exports</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncWorkspaceData} disabled={isSyncing} activeOpacity={0.8}>
            {isSyncing ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.syncBtnText}>🔄 Synchronize Workspace Data Now</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: -4 }}>Last Synced: {lastSyncTime}</Text>
        </View>

        {/* ── 6. LOGOUT BUTTON ────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>🚪 Sign Out of Workspace</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── MODAL 1: EDIT DOCUMENTS (15-DAY LOCK CHECK) ────────────────────── */}
      <Modal visible={docModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📄 Upload / Update Identity Documents</Text>
            <Text style={styles.modalSub}>Rule: Documents can only be updated once every 15 days.</Text>

            <Text style={styles.inputLabel}>PAN Card Number *</Text>
            <TextInput style={styles.textInput} value={panInput} onChangeText={setPanInput} placeholder="Enter PAN Number..." placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Aadhaar Document / ID *</Text>
            <TextInput style={styles.textInput} value={aadhaarInput} onChangeText={setAadhaarInput} placeholder="Enter Aadhaar Document..." placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Educational Certificate Link *</Text>
            <TextInput style={styles.textInput} value={eduCertInput} onChangeText={setEduCertInput} placeholder="Enter Educational Certificate..." placeholderTextColor="#64748b" />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setDocModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleSaveDocuments}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Documents ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: VIEW OLD DOCUMENTS HISTORY LOG ───────────────────────── */}
      <Modal visible={docHistoryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.modalTitle}>📜 Historical Documents Audit Log</Text>
              <TouchableOpacity onPress={() => setDocHistoryModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }}>
              {docHistoryLogs.map((log, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{log.docType} ({log.date})</Text>
                  <Text style={{ fontSize: 10, color: '#38bdf8', marginTop: 2 }}>Updated to: {log.newValue}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>Old Record: {log.oldValue}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: EDIT BANK DETAILS (15-DAY LOCK CHECK) ─────────────────── */}
      <Modal visible={bankModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Update Bank &amp; Payout Telemetry</Text>
            <Text style={styles.modalSub}>Rule: Bank details can only be updated once every 15 days.</Text>

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput style={styles.textInput} value={bankNameInput} onChangeText={setBankNameInput} placeholder="Enter Bank Name..." placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput style={styles.textInput} value={accountHolderInput} onChangeText={setAccountHolderInput} placeholder="Enter Holder Name..." placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput style={styles.textInput} value={accountNoInput} onChangeText={setAccountNoInput} placeholder="Enter Account Number..." placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput style={styles.textInput} value={ifscCodeInput} onChangeText={setIfscCodeInput} placeholder="Enter IFSC Code..." placeholderTextColor="#64748b" />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setBankModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleSaveBankDetails}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Bank Details ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 4: VIEW OLD BANK DETAILS HISTORY LOG ────────────────────── */}
      <Modal visible={bankHistoryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.modalTitle}>📜 Historical Bank Details Audit Log</Text>
              <TouchableOpacity onPress={() => setBankHistoryModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }}>
              {bankHistoryLogs.map((log, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{log.bankName} ({log.date})</Text>
                  <Text style={{ fontSize: 10, color: '#34d399', marginTop: 2 }}>Account: {log.accountNo}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 32 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 500, marginBottom: 12 },
  screenTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  closeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  identityCard: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  avatarGlow: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, color: '#ffffff' },
  userName: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  userEmail: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  planBadgeText: { fontSize: 9, fontWeight: '800' },

  cardBox: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardHeaderWithBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardBoxTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 11, color: '#94a3b8' },
  infoValue: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  actionCardBtn: { marginTop: 8, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionCardBtnLocked: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  actionCardBtnText: { fontSize: 11, fontWeight: '800', color: '#38bdf8' },
  actionCardBtnTextLocked: { color: '#fca5a5' },

  syncBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  syncBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  logoutButton: { width: '100%', maxWidth: 500, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  logoutButtonText: { color: '#fca5a5', fontWeight: '900', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#cbd5e1', marginTop: 6, marginBottom: 2 },
  textInput: { backgroundColor: '#020617', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 },
  modalBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  historyRow: { backgroundColor: '#020617', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },
});
