/**
 * SalesExecControlScreen.tsx — DAS CRM Android
 * Dedicated Full Screen Inspector for Sales Executives (SALES_EXEC role)
 * Features:
 * 1. Name, Email, Number, Role (Button to Upgrade), Assigned Under (Button to Change).
 * 2. Lead Status Buttons (Total Lead he Got, Connected, Negotiated, Won) -> Opens full Lead Collection page modal.
 * 3. Attendance button -> Redirects to Attendance section with his name pre-selected in workforce filter.
 * 4. Pending Leave Request Button -> Inspect Application and approve or decline with decision Note.
 * 5. Lock Screen Toggle.
 * 6. Delete (10-day grace period where screen is locked, notifies purge date, and exposes Revert Note Request input for 10 days).
 * 7. Documents & Bank Details Telemetry buttons.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { EmployeeProfile } from './EmployeesScreen';
import ToastBanner, { ToastConfig } from '../components/ToastBanner';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function SalesExecControlScreen({ employee, onBack, onUpdateEmployee }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);

  // 🎯 Lead Collection Modal State
  const [leadCollectionModalOpen, setLeadCollectionModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'GOT' | 'CONNECTED' | 'NEGOTIATED' | 'WON'>('GOT');

  // 📅 Leave Decision Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  // 🗑️ 10-Day Deletion Engine State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  // 📄 Docs & Bank Details Modals
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Manager A (Amit Shah)',
    'Manager B (Neha Joshi)',
    'Team Leader (Priya Sharma)',
  ];

  const MOCK_LEADS = [
    { id: 'lead-1', name: 'Rajesh Varma', company: 'TechCorp', phone: '+91 98765 43210', value: '₹5,20,000', status: 'GOT', date: 'Today, 10:15 AM' },
    { id: 'lead-2', name: 'Priya Sharma', company: 'LogiTech', phone: '+91 98123 45678', value: '₹3,50,000', status: 'CONNECTED', date: 'Yesterday, 4:45 PM' },
    { id: 'lead-3', name: 'Sunita Kapoor', company: 'Sunita Logistics', phone: '+91 97222 33344', value: '₹8,90,000', status: 'NEGOTIATED', date: 'Aug 20, 2026' },
    { id: 'lead-4', name: 'Vikram Sethi', company: 'Sethi Ent', phone: '+91 98777 66655', value: '₹4,20,000', status: 'WON', date: 'Aug 18, 2026' },
  ];

  const handleRoleUpgrade = (newRole: EmployeeProfile['role']) => {
    onUpdateEmployee({ ...employee, role: newRole });
    setUpgradeRoleModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '⚡ Role Upgraded',
      message: `${employee.name} upgraded to ${newRole.replace('_', ' ')}.`,
      type: 'SUCCESS',
    });
  };

  const handleSupervisorChange = (sup: string) => {
    onUpdateEmployee({ ...employee, assignedManager: sup });
    setChangeSupervisorModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '✏️ Supervisor Updated',
      message: `${employee.name} assigned under ${sup}.`,
      type: 'SUCCESS',
    });
  };

  const handleToggleLock = () => {
    const isLocked = !employee.isLocked;
    onUpdateEmployee({ ...employee, isLocked });
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: isLocked ? '🔒 Screen Locked' : '🔓 Screen Unlocked',
      message: `${employee.name} account screen ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`,
      type: isLocked ? 'WARNING' : 'SUCCESS',
    });
  };

  const handleInitiate10DayDelete = () => {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 10);
    const dateStr = purgeDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    onUpdateEmployee({ ...employee, isLocked: true, deletionScheduledAt: dateStr });
    setDeleteModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '🗑️ 10-Day Purge Scheduled',
      message: `Account locked. Data will be purged on ${dateStr}.`,
      type: 'WARNING',
    });
  };

  const handleRequestRevert = () => {
    if (!revertNote.trim()) {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⚠️ Revert Note Required',
        message: 'Please enter a note explaining why deletion should be reverted.',
        type: 'WARNING',
      });
      return;
    }
    onUpdateEmployee({ ...employee, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote });
    setDeleteModalOpen(false);
    setRevertNote('');
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '↺ Deletion Reverted',
      message: `Deletion reverted for ${employee.name}. Note: "${revertNote}"`,
      type: 'SUCCESS',
    });
  };

  const handleApproveDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⚠️ Note Required',
        message: 'Please enter a decision note.',
        type: 'WARNING',
      });
      return;
    }
    setLeaveModalOpen(false);
    setLeaveNote('');
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: approved ? '🟢 Leave Approved' : '🔴 Leave Declined',
      message: `Leave for ${employee.name} ${approved ? 'APPROVED' : 'DECLINED'}. Note: "${leaveNote}"`,
      type: approved ? 'SUCCESS' : 'WARNING',
    });
  };

  const handleRedirectToAttendance = () => {
    try {
      navigation.navigate('Attendance', { preSelectedEmpId: employee.id, preSelectedEmpName: employee.name });
    } catch {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⏱️ Attendance Portal',
        message: `Redirecting to Attendance Section with ${employee.name} selected.`,
        type: 'INFO',
      });
    }
  };

  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Directory</Text>
        </TouchableOpacity>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>SALES EXECUTIVE CONTROL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 30 }]} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.profileName}>{employee.name}</Text>
              {employee.isLocked && <Text style={styles.lockedPill}>🔒 LOCKED</Text>}
            </View>
            <Text style={styles.profileMeta}>✉️ Email: {employee.email}</Text>
            <Text style={styles.profileMeta}>📞 Number: {employee.phone}</Text>
            <Text style={styles.profileMeta}>
              Assigned Under: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{employee.assignedManager}</Text>
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => setUpgradeRoleModalOpen(true)}>
              <Text style={styles.upgradeBtnText}>Upgrade Role ⚡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeSupBtn} onPress={() => setChangeSupervisorModalOpen(true)}>
              <Text style={styles.changeSupBtnText}>Assigned Under (Change) ✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {employee.deletionScheduledAt && (
          <View style={styles.deletionNoticeBox}>
            <Text style={styles.deletionNoticeText}>
              ⚠️ 10-DAY GRACE DELETION ACTIVE: Account locked. Scheduled for purge on {employee.deletionScheduledAt}.
            </Text>
          </View>
        )}

        {/* Lead Status Buttons -> Opens Lead Collection Page Modal */}
        <Text style={styles.sectionTitle}>🎯 Lead Collection &amp; Status Portal</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { borderColor: '#38bdf8' }]}
            onPress={() => { setLeadCategory('GOT'); setLeadCollectionModalOpen(true); }}
          >
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>{employee.leads?.totalReceived || 35}</Text>
            <Text style={styles.statLbl}>Total Lead Got →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderColor: '#22c55e' }]}
            onPress={() => { setLeadCategory('CONNECTED'); setLeadCollectionModalOpen(true); }}
          >
            <Text style={[styles.statVal, { color: '#22c55e' }]}>{employee.leads?.connected || 22}</Text>
            <Text style={styles.statLbl}>Connected →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { borderColor: '#818cf8' }]}
            onPress={() => { setLeadCategory('NEGOTIATED'); setLeadCollectionModalOpen(true); }}
          >
            <Text style={[styles.statVal, { color: '#818cf8' }]}>{employee.leads?.inNegotiation || 8}</Text>
            <Text style={styles.statLbl}>Negotiated →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderColor: '#34d399' }]}
            onPress={() => { setLeadCategory('WON'); setLeadCollectionModalOpen(true); }}
          >
            <Text style={[styles.statVal, { color: '#34d399' }]}>{employee.leads?.won || 2}</Text>
            <Text style={styles.statLbl}>Won Deals →</Text>
          </TouchableOpacity>
        </View>

        {/* Operational Actions */}
        <Text style={styles.sectionTitle}>⚙️ Executive Operations &amp; Governance</Text>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={styles.actionCard} onPress={handleRedirectToAttendance}>
            <Text style={styles.actionCardTitle}>⏱️ Attendance Section (View {employee.name} Selected) →</Text>
            <Text style={styles.actionCardSub}>Redirects to attendance portal with staff member pre-selected in filter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#fbbf24' }]} onPress={() => setLeaveModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Approve Note) →</Text>
            <Text style={styles.actionCardSub}>Inspect 3-day leave application; approve/decline with mandatory note</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtnHalf, { flex: 1 }]} onPress={handleToggleLock}>
              <Text style={styles.actionBtnHalfText}>{employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtnHalf, styles.deleteBtn, { flex: 1 }]} onPress={() => setDeleteModalOpen(true)}>
              <Text style={styles.deleteBtnText}>🗑️ Delete (10-Day Grace)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compliance Buttons */}
        <Text style={styles.sectionTitle}>📄 Documents &amp; Bank Details Telemetry</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.docBankBtn, { flex: 1 }]} onPress={() => setDocumentsModalOpen(true)}>
            <Text style={styles.docBankBtnText}>📄 View Documents →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.docBankBtn, { flex: 1 }]} onPress={() => setBankDetailsModalOpen(true)}>
            <Text style={styles.docBankBtnText}>💳 View Bank Details →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── MODAL: LEAD COLLECTION PAGE ───────────────────────────────────── */}
      <Modal visible={leadCollectionModalOpen} transparent animationType="slide" onRequestClose={() => setLeadCollectionModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 Lead Collection — {leadCategory} LEADS</Text>
              <TouchableOpacity onPress={() => setLeadCollectionModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {MOCK_LEADS.map((lead) => (
                <View key={lead.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>{lead.name}</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>{lead.company} • {lead.phone}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Logged: {lead.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>{lead.value}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#38bdf8', marginTop: 2 }}>{leadCategory}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 10 }]} onPress={() => setLeadCollectionModalOpen(false)}>
              <Text style={styles.modalBtnText}>Close Lead Collection →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ROLE UPGRADE ───────────────────────────────────────────── */}
      <Modal visible={upgradeRoleModalOpen} transparent animationType="slide" onRequestClose={() => setUpgradeRoleModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚡ Upgrade Role for {employee.name}</Text>
            {(['SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR'] as const).map((r) => (
              <TouchableOpacity key={r} style={styles.modalItemBtn} onPress={() => handleRoleUpgrade(r)}>
                <Text style={styles.modalItemBtnText}>{r.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setUpgradeRoleModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 10, fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: CHANGE SUPERVISOR ──────────────────────────────────────── */}
      <Modal visible={changeSupervisorModalOpen} transparent animationType="slide" onRequestClose={() => setChangeSupervisorModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✏️ Change Assigned Supervisor</Text>
            {SUPERVISORS.map((sup, i) => (
              <TouchableOpacity key={i} style={styles.modalItemBtn} onPress={() => handleSupervisorChange(sup)}>
                <Text style={styles.modalItemBtnText}>{sup}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setChangeSupervisorModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 10, fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: PENDING LEAVE APPLICATION ──────────────────────────────── */}
      <Modal visible={leaveModalOpen} transparent animationType="slide" onRequestClose={() => setLeaveModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📅 Pending Leave Application Inspection</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 6 }}>
              Applicant: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{employee.name}</Text>{'\n'}
              Duration: 3 Days (Medical Leave){'\n'}
              Dates: Aug 25 - Aug 27, 2026
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter decision note..."
              placeholderTextColor="#64748b"
              value={leaveNote}
              onChangeText={setLeaveNote}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleApproveDeclineLeave(false)}>
                <Text style={styles.modalBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleApproveDeclineLeave(true)}>
                <Text style={styles.modalBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: 10-DAY GRACE DELETE & REVERT ───────────────────────────── */}
      <Modal visible={deleteModalOpen} transparent animationType="slide" onRequestClose={() => setDeleteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🗑️ Account Deletion (10-Day Grace Period)</Text>
            {employee.deletionScheduledAt ? (
              <View>
                <Text style={{ fontSize: 11, color: '#fbbf24', marginVertical: 6 }}>
                  Scheduled for purge on {employee.deletionScheduledAt}. Account locked. Enter note to revert:
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason to revert deletion..."
                  placeholderTextColor="#64748b"
                  value={revertNote}
                  onChangeText={setRevertNote}
                />
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#22c55e', marginTop: 10 }]} onPress={handleRequestRevert}>
                  <Text style={styles.modalBtnText}>↺ Request to Revert Deletion →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ef4444', marginTop: 10 }]} onPress={handleInitiate10DayDelete}>
                <Text style={styles.modalBtnText}>Initiate 10-Day Purge →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setDeleteModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 10, fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: DOCUMENTS TELEMETRY ────────────────────────────────────── */}
      <Modal visible={documentsModalOpen} transparent animationType="slide" onRequestClose={() => setDocumentsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📄 Official Documents Telemetry</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>PAN Card: {employee.documents?.pan || 'ABCDE1234F'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Aadhaar ID: {employee.documents?.aadhaar || 'AADHAAR_VERIFIED.pdf'}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', marginTop: 12 }]} onPress={() => setDocumentsModalOpen(false)}>
              <Text style={styles.modalBtnText}>Close Documents →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: BANK DETAILS TELEMETRY ─────────────────────────────────── */}
      <Modal visible={bankDetailsModalOpen} transparent animationType="slide" onRequestClose={() => setBankDetailsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Bank Account Details Telemetry</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Bank: {employee.bankDetails?.bankName || 'HDFC Bank'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Account No: {employee.bankDetails?.accountNo || '50100987654321'}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', marginTop: 12 }]} onPress={() => setBankDetailsModalOpen(false)}>
              <Text style={styles.modalBtnText}>Close Bank Details →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ToastBanner toast={toastConfig} onDismiss={() => setToastConfig(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  roleTag: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  roleTagText: { fontSize: 10, fontWeight: '900', color: '#34d399' },
  content: { padding: 16, alignItems: 'center' },
  profileCard: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  profileName: { fontSize: 17, fontWeight: '900', color: '#ffffff' },
  profileMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  lockedPill: { backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  upgradeBtn: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  upgradeBtnText: { fontSize: 10, fontWeight: '900', color: '#818cf8' },
  changeSupBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  changeSupBtnText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },
  deletionNoticeBox: { width: '100%', maxWidth: 500, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 12, padding: 10, marginBottom: 12 },
  deletionNoticeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  sectionTitle: { width: '100%', maxWidth: 500, fontSize: 12, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  statsGrid: { width: '100%', maxWidth: 500, flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, padding: 12 },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginTop: 2 },
  actionCard: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 8 },
  actionCardTitle: { fontSize: 12, fontWeight: '900', color: '#38bdf8' },
  actionCardSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  actionBtnHalf: { backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionBtnHalfText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
  deleteBtnText: { color: '#fca5a5', fontWeight: '900', fontSize: 11 },
  docBankBtn: { backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  docBankBtnText: { color: '#38bdf8', fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#0d1527', borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.35)', padding: 18, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },
  leadCardRow: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalItemBtn: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginTop: 8 },
  modalItemBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  textInput: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', color: '#ffffff', padding: 12, fontSize: 12, marginTop: 8 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },
});
