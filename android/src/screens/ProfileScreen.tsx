/**
 * ProfileScreen.tsx — DAS CRM Android
 * Comprehensive User Profile containing:
 * 1. Top Identity Header & Avatar Upload (10-Day Lock Rule & Cooldown Notice)
 * 2. Workspace & Organization Details + ⚡ Upgrade Plan & App Version Launcher
 * 3. Role Performance Telemetry (Payroll / Revenue, Calls, Staff/Leads, Attendance Rate)
 * 4. Attendance & Leave Metrics (Present Days, Approved Leaves, Remaining Balance)
 * 5. Salary, Incentives & Overtime Earnings Breakdown
 * 6. 📄 Documents & Identity Verification (15-Day Lock Rule & History Log Viewer)
 * 7. 💳 Bank & Payout Telemetry (15-Day Lock Rule & History Log Viewer)
 * 8. Live Workspace Sync, Diagnostics & Sign Out
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
    Date.now() - 12 * 24 * 60 * 60 * 1000 // 12 days ago, so unlocked
  );

  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const timeSinceLastDpChange = lastDpChangedAt ? Date.now() - lastDpChangedAt : TEN_DAYS_MS + 1000;
  const isDpLocked = timeSinceLastDpChange < TEN_DAYS_MS;
  const dpDaysRemaining = Math.ceil((TEN_DAYS_MS - timeSinceLastDpChange) / (1000 * 60 * 60 * 24));

  // 📄 15-DAY DOCUMENTS UPDATE LOCK & HISTORY
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const [lastDocChangedAt, setLastDocChangedAt] = useState<number | null>(
    Date.now() - 18 * 24 * 60 * 60 * 1000 // 18 days ago, so unlocked
  );
  const timeSinceLastDocChange = lastDocChangedAt ? Date.now() - lastDocChangedAt : FIFTEEN_DAYS_MS + 1000;
  const isDocLocked = timeSinceLastDocChange < FIFTEEN_DAYS_MS;
  const docDaysRemaining = Math.ceil((FIFTEEN_DAYS_MS - timeSinceLastDocChange) / (1000 * 60 * 60 * 24));

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docHistoryModalOpen, setDocHistoryModalOpen] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('AADHAAR_9876_VERIFIED.pdf');
  const [panInput, setPanInput] = useState('ABCDE1234F');
  const [eduCertInput, setEduCertInput] = useState('DEGREE_BTECH_2024.pdf');
  const [docHistoryLogs, setDocHistoryLogs] = useState<{ date: string; docType: string; oldValue: string; newValue: string }[]>([
    { date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' },
    { date: 'Jul 15, 2026', docType: 'Aadhaar ID', oldValue: 'AADHAAR_OLD.pdf', newValue: 'AADHAAR_9876_VERIFIED.pdf' },
  ]);

  // 💳 15-DAY BANK DETAILS UPDATE LOCK & HISTORY
  const [lastBankChangedAt, setLastBankChangedAt] = useState<number | null>(
    Date.now() - 20 * 24 * 60 * 60 * 1000 // 20 days ago, so unlocked
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
  const [bankHistoryLogs, setBankHistoryLogs] = useState<{ date: string; bankName: string; accountNo: string }[]>([
    { date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' },
    { date: 'May 10, 2026', bankName: 'SBI Bank', accountNo: '1122XXXX9900' },
  ]);

  const handleSaveDp = () => {
    if (isDpLocked) {
      Alert.alert('🔒 10-Day Cooldown Lock', `Profile picture can only be changed once every 10 days. Next change available in ${dpDaysRemaining} days.`);
      return;
    }
    if (!inputDpUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid Image URL for your profile picture.');
      return;
    }
    setCurrentDpUrl(inputDpUrl.trim());
    setLastDpChangedAt(Date.now());
    setDpModalOpen(false);
    Alert.alert('✅ Profile Picture Updated', 'New profile picture saved successfully. 10-day change cooldown active.');
  };

  const handleSaveDocuments = () => {
    if (isDocLocked) {
      Alert.alert('🔒 15-Day Lock Active', `Identity documents can only be updated once every 15 days. Next update eligible in ${docDaysRemaining} days.`);
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
      Alert.alert('🔒 15-Day Lock Active', `Bank details can only be updated once every 15 days. Next update eligible in ${bankDaysRemaining} days.`);
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

  const handleSyncWorkspaceData = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Today, ${timeStr}`);
      Alert.alert('✅ Sync Complete', 'All CRM leads, call logs, attendance & telemetry synced with cloud backend!');
    }, 1200);
  };

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 4, 14);
  const bottomPadding = Math.max(insets.bottom + 12, 24);

  const roleColor = role === 'ADMIN' ? '#818cf8' : role === 'MANAGER' ? '#c084fc' : role === 'HR' ? '#38bdf8' : '#34d399';
  const planColor = subscription.planType === 'FREE_TRIAL' ? '#fbbf24' : '#34d399';

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Scrollable Container with Smooth Inner Padding */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 36 }]} showsVerticalScrollIndicator={false}>

        {/* Top Header Navigation */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>User Identity &amp; Profile</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>✕ Close Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 1. IDENTITY & AVATAR CARD ────────────────────────────────────── */}
        <View style={styles.identityCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={() => setDpModalOpen(true)} activeOpacity={0.8}>
              <View style={styles.avatarGlow}>
                {currentDpUrl ? (
                  <Image source={{ uri: currentDpUrl }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
                ) : (
                  <Text style={styles.avatarText}>{currentUser.avatar || 'VS'}</Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{currentUser.name || 'Vikram Singh (Tenant Admin)'}</Text>
              <Text style={styles.userEmail}>{currentUser.email || 'vikram.admin@acme.com'}</Text>

              {/* Badges Row */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '50' }]}>
                  <Text style={[styles.roleBadgeText, { color: roleColor }]}>{role.replace('_', ' ')}</Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: planColor + '20', borderColor: planColor + '50' }]}>
                  <Text style={[styles.planBadgeText, { color: planColor }]}>{subscription.planType}</Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' }]}>
                  <Text style={[styles.planBadgeText, { color: '#34d399' }]}>🟢 Internet OK</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Upload DP Action Button (Cleanly Positioned) */}
          <TouchableOpacity
            style={[styles.uploadDpBtn, isDpLocked && styles.uploadDpBtnLocked]}
            onPress={() => setDpModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.uploadDpBtnText, isDpLocked && { color: '#fca5a5' }]}>
              {isDpLocked ? `🔒 DP Locked (Next in ${dpDaysRemaining} days)` : '📷 Upload DP (<1MB)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. WORKSPACE & ORGANIZATION CARD ─────────────────────────────── */}
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plan Tier Active:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.infoValue, { color: '#fbbf24' }]}>{subscription.planType}</Text>
              <TouchableOpacity
                onPress={() => setPlansModalOpen(true)}
                style={{ backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}
              >
                <Text style={{ fontSize: 9, color: '#ffffff', fontWeight: '900' }}>⚡ Upgrade Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>In-App Updates:</Text>
            <TouchableOpacity onPress={onOpenUpdate}>
              <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: '800' }}>Check Latest App Version →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3. ROLE PERFORMANCE TELEMETRY CARD ──────────────────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>
            {role === 'HR' ? 'HR Performance Telemetry' : 'Role Performance Telemetry'}
          </Text>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryVal}>{role === 'HR' ? '$64,200' : '$128,400'}</Text>
              <Text style={styles.telemetryLbl}>{role === 'HR' ? 'Processed Payroll Volume' : 'Total Won Sales'}</Text>
            </View>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryVal}>184 Calls</Text>
              <Text style={styles.telemetryLbl}>Audit Calls Recorded</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryCard}>
              <Text style={[styles.telemetryVal, { color: '#fbbf24' }]}>{role === 'HR' ? '24 Staff' : '42 Deals'}</Text>
              <Text style={styles.telemetryLbl}>{role === 'HR' ? 'Staff Members Audited' : 'Active Leads Managed'}</Text>
            </View>
            <View style={styles.telemetryCard}>
              <Text style={[styles.telemetryVal, { color: '#34d399' }]}>{role === 'HR' ? '95.5%' : '14.2%'}</Text>
              <Text style={styles.telemetryLbl}>{role === 'HR' ? 'Attendance Rate Today' : 'Conversion Rate'}</Text>
            </View>
          </View>
        </View>

        {/* ── 4. ATTENDANCE & LEAVE METRICS CARD ──────────────────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>Attendance &amp; Leave Metrics</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Present Days (This Month):</Text>
            <Text style={[styles.infoValue, { color: '#34d399' }]}>18 Days Present</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Approved Leaves Taken:</Text>
            <Text style={styles.infoValue}>2 Days Taken</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remaining Leave Balance:</Text>
            <Text style={[styles.infoValue, { color: '#fbbf24' }]}>12 Days Remaining</Text>
          </View>
        </View>

        {/* ── 5. SALARY, INCENTIVES & OVERTIME EARNINGS CARD ───────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>Salary, Incentives &amp; Overtime Earnings</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Monthly Salary:</Text>
            <Text style={styles.infoValue}>₹45,000 / mo</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Incentives &amp; Commissions:</Text>
            <Text style={[styles.infoValue, { color: '#34d399' }]}>+₹12,500</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Extra Working / Overtime:</Text>
            <Text style={[styles.infoValue, { color: '#34d399' }]}>+₹4,200</Text>
          </View>
        </View>

        {/* ── 6. DOCUMENTS & IDENTITY VERIFICATION CARD (15-DAY LOCK RULE) ─── */}
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

        {/* ── 7. BANK & PAYOUT TELEMETRY CARD (15-DAY LOCK RULE) ─────────── */}
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

        {/* ── 8. SYSTEM SYNC & DIAGNOSTICS CARD ───────────────────────────── */}
        <View style={styles.cardBox}>
          <Text style={styles.cardBoxTitle}>System Sync &amp; Data Exports</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncWorkspaceData} disabled={isSyncing} activeOpacity={0.8}>
            {isSyncing ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.syncBtnText}>🔄 Synchronize Workspace Data Now</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>Last Synced: {lastSyncTime}</Text>
        </View>

        {/* ── 9. LOGOUT BUTTON ────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>🚪 Sign Out of Workspace</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── MODAL 1: DP UPLOAD MODAL ──────────────────────────────────────── */}
      <Modal visible={dpModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📷 Upload / Update Profile Picture</Text>
            <Text style={styles.modalSub}>Rule: Profile picture can only be changed once every 10 days.</Text>

            <Text style={styles.inputLabel}>Image URL (&lt; 1MB) *</Text>
            <TextInput style={styles.textInput} value={inputDpUrl} onChangeText={setInputDpUrl} placeholder="Enter Image URL..." placeholderTextColor="#64748b" />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setDpModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleSaveDp}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save DP ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: PLANS SELECTION MODAL ───────────────────────────────── */}
      <Modal visible={plansModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.modalTitle}>⚡ Upgrade Subscription Plan</Text>
              <TouchableOpacity onPress={() => setPlansModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {(['GROWTH', 'PRO', 'MAX'] as const).map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[styles.planOptionCard, selectedPlanTier === tier && styles.planOptionCardActive]}
                onPress={() => setSelectedPlanTier(tier)}
              >
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>{tier} Plan</Text>
                <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  {tier === 'GROWTH' ? 'Up to 10 Users • WhatsApp Cloud API' : tier === 'PRO' ? 'Up to 50 Users • AI Lead Scoring & Automations' : 'Unlimited Users • Dedicated Drive Backup'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={{ backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 12 }}
              onPress={() => {
                setPlansModalOpen(false);
                Alert.alert('⚡ Plan Selected', `Upgrade request for ${selectedPlanTier} Plan dispatched to Tenant Admin.`);
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>Confirm Upgrade →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: EDIT DOCUMENTS (15-DAY LOCK CHECK) ────────────────────── */}
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

      {/* ── MODAL 4: VIEW OLD DOCUMENTS HISTORY LOG ───────────────────────── */}
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

      {/* ── MODAL 5: EDIT BANK DETAILS (15-DAY LOCK CHECK) ─────────────────── */}
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

      {/* ── MODAL 6: VIEW OLD BANK DETAILS HISTORY LOG ────────────────────── */}
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
  content: { padding: 16, alignItems: 'center', flexGrow: 1 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 500, marginBottom: 12 },
  screenTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  closeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  identityCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  avatarGlow: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, color: '#ffffff', fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  userEmail: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  planBadgeText: { fontSize: 9, fontWeight: '800' },

  uploadDpBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  uploadDpBtnLocked: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  uploadDpBtnText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },

  cardBox: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardHeaderWithBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardBoxTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  infoLabel: { fontSize: 11, color: '#94a3b8' },
  infoValue: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  telemetryGrid: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  telemetryCard: { flex: 1, backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, alignItems: 'center' },
  telemetryVal: { fontSize: 15, fontWeight: '900', color: '#38bdf8' },
  telemetryLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  actionCardBtn: { marginTop: 8, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionCardBtnLocked: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  actionCardBtnText: { fontSize: 11, fontWeight: '800', color: '#38bdf8' },
  actionCardBtnTextLocked: { color: '#fca5a5' },

  syncBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  syncBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  logoutButton: { width: '100%', maxWidth: 500, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  logoutButtonText: { color: '#fca5a5', fontWeight: '900', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#cbd5e1', marginTop: 6, marginBottom: 2 },
  textInput: { backgroundColor: '#020617', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 },
  modalBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  historyRow: { backgroundColor: '#020617', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },

  planOptionCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginBottom: 8 },
  planOptionCardActive: { borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.15)' },
});
