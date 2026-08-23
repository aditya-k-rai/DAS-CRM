/**
 * SalesExecControlScreen.tsx — DAS CRM Android
 * Dedicated Full Screen Inspector for Sales Executives (SALES_EXEC role)
 * Includes: Name, Email, Phone, Role Upgrade, Change Supervisor, Lead Collection Status Pages (Got, Connected, Negotiated, Won),
 * Attendance, Pending Leave with Note, Account Lock, 10-day Grace Period Delete Engine with Revert Note, Documents & Bank details buttons.
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
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { EmployeeProfile } from './EmployeesScreen';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function SalesExecControlScreen({ employee, onBack, onUpdateEmployee }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);
  const [leadPreviewModalOpen, setLeadPreviewModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'GOT' | 'CONNECTED' | 'NEGOTIATED' | 'WON'>('GOT');

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Manager A (Amit Shah)',
    'Manager B (Neha Joshi)',
    'Team Leader (Priya Sharma)',
  ];

  const handleRoleUpgrade = (newRole: EmployeeProfile['role']) => {
    onUpdateEmployee({ ...employee, role: newRole });
    setUpgradeRoleModalOpen(false);
    Alert.alert('⚡ Role Upgraded', `${employee.name} upgraded to ${newRole.replace('_', ' ')}.`);
  };

  const handleSupervisorChange = (sup: string) => {
    onUpdateEmployee({ ...employee, assignedManager: sup });
    setChangeSupervisorModalOpen(false);
    Alert.alert('✏️ Supervisor Updated', `${employee.name} assigned under ${sup}.`);
  };

  const handleToggleLock = () => {
    const isLocked = !employee.isLocked;
    onUpdateEmployee({ ...employee, isLocked });
    Alert.alert(isLocked ? '🔒 Screen Locked' : '🔓 Screen Unlocked', `${employee.name} account screen ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`);
  };

  const handleInitiate10DayDelete = () => {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 10);
    const dateStr = purgeDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    onUpdateEmployee({ ...employee, isLocked: true, deletionScheduledAt: dateStr });
    setDeleteModalOpen(false);
    Alert.alert('🗑️ 10-Day Purge Scheduled', `Account locked. Data will be purged on ${dateStr}. Revert note request is open for 10 days.`);
  };

  const handleRequestRevert = () => {
    if (!revertNote.trim()) {
      Alert.alert('Revert Note Required', 'Please enter a note explaining why deletion should be reverted.');
      return;
    }
    onUpdateEmployee({ ...employee, isLocked: false, deletionScheduledAt: null });
    setDeleteModalOpen(false);
    setRevertNote('');
    Alert.alert('↺ Deletion Reverted', `Deletion reverted for ${employee.name}.\nNote: "${revertNote}"`);
  };

  const handleApproveDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      Alert.alert('Note Required', 'Please enter a decision note.');
      return;
    }
    setLeaveModalOpen(false);
    setLeaveNote('');
    Alert.alert(approved ? '🟢 Leave Approved' : '🔴 Leave Declined', `Leave for ${employee.name} ${approved ? 'APPROVED' : 'DECLINED'}.\nNote: "${leaveNote}"`);
  };

  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Directory</Text>
        </TouchableOpacity>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>SALES EXECUTIVE CONTROL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 30 }]} showsVerticalScrollIndicator={false}>
        {/* Profile Details Card */}
        <View style={styles.profileCard}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Image source={{ uri: employee.avatarUrl }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.empName}>{employee.name}</Text>
                {employee.isLocked && <Text style={styles.lockBadge}>🔒 LOCKED</Text>}
              </View>
              <Text style={styles.empMeta}>📧 Email: {employee.email}</Text>
              <Text style={styles.empMeta}>📞 Number: {employee.phone}</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={styles.chipBtn} onPress={() => setUpgradeRoleModalOpen(true)}>
                  <Text style={styles.chipBtnText}>Upgrade Role ⚡</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.chipBtn, { backgroundColor: 'rgba(56,189,248,0.2)', borderColor: '#38bdf8' }]} onPress={() => setChangeSupervisorModalOpen(true)}>
                  <Text style={[styles.chipBtnText, { color: '#38bdf8' }]}>Assigned Under (Change) ✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.supBox}>
            <Text style={styles.supLabel}>Assigned Under Supervisor:</Text>
            <Text style={styles.supVal}>👤 {employee.assignedManager}</Text>
          </View>

          {employee.deletionScheduledAt && (
            <View style={styles.purgeNotice}>
              <Text style={styles.purgeNoticeText}>
                ⚠️ 10-Day Grace Deletion Period Active: Scheduled for purge on {employee.deletionScheduledAt}. Account locked.
              </Text>
            </View>
          )}
        </View>

        {/* Lead Status Collections Section */}
        <Text style={styles.sectionTitle}>🎯 Lead Collection Pages &amp; Pipeline Status</Text>
        <View style={styles.grid2}>
          <TouchableOpacity style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.4)' }]} onPress={() => { setLeadCategory('GOT'); setLeadPreviewModalOpen(true); }}>
            <Text style={styles.statVal}>{employee.leads.totalReceived}</Text>
            <Text style={styles.statLbl}>Total Leads Got →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: 'rgba(251,191,36,0.4)' }]} onPress={() => { setLeadCategory('CONNECTED'); setLeadPreviewModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>{employee.leads.connected}</Text>
            <Text style={styles.statLbl}>Connected Leads →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.4)' }]} onPress={() => { setLeadCategory('NEGOTIATED'); setLeadPreviewModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>{employee.leads.inNegotiation}</Text>
            <Text style={styles.statLbl}>Negotiated Leads →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: 'rgba(52,211,153,0.4)' }]} onPress={() => { setLeadCategory('WON'); setLeadPreviewModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>{employee.leads.won}</Text>
            <Text style={styles.statLbl}>Won Deals →</Text>
          </TouchableOpacity>
        </View>

        {/* Operational Controls Section */}
        <Text style={styles.sectionTitle}>⚙️ Sales Executive Controls</Text>
        <View style={{ gap: 10, width: '100%', maxWidth: 600 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Attendance')}>
            <Text style={styles.actionBtnText}>⏱️ Attendance Portal (View {employee.name} Selected) →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]} onPress={() => setLeaveModalOpen(true)}>
            <Text style={[styles.actionBtnText, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Approve Note) →</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={handleToggleLock}>
              <Text style={styles.actionBtnText}>{employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]} onPress={() => setDeleteModalOpen(true)}>
              <Text style={[styles.actionBtnText, { color: '#fca5a5' }]}>🗑️ Delete (10-Day Grace)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Documents & Banking Section */}
        <View style={styles.docsCard}>
          <Text style={styles.sectionTitle}>📄 Documents &amp; Bank Details Telemetry</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#1e293b' }]} onPress={() => setDocumentsModalOpen(true)}>
              <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>📄 View Documents →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#1e293b' }]} onPress={() => setBankDetailsModalOpen(true)}>
              <Text style={[styles.actionBtnText, { color: '#34d399' }]}>💳 View Bank Details →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Sub Modals */}
      <Modal visible={upgradeRoleModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚡ Upgrade Role</Text>
            {(['SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR'] as const).map(r => (
              <TouchableOpacity key={r} style={[styles.roleOpt, employee.role === r && styles.roleOptActive]} onPress={() => handleRoleUpgrade(r)}>
                <Text style={styles.roleOptText}>{r.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setUpgradeRoleModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={changeSupervisorModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✏️ Change Assigned Supervisor</Text>
            {SUPERVISORS.map((sup, idx) => (
              <TouchableOpacity key={idx} style={[styles.roleOpt, employee.assignedManager === sup && styles.roleOptActive]} onPress={() => handleSupervisorChange(sup)}>
                <Text style={styles.roleOptText}>{sup}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setChangeSupervisorModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={leadPreviewModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎯 Lead Collection Page — {leadCategory}</Text>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.leadItem}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Lead #{i}09 • Enterprise</Text>
                <Text style={{ color: '#818cf8', fontWeight: '700', fontSize: 10 }}>{leadCategory}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.submitBtn} onPress={() => setLeadPreviewModalOpen(false)}>
              <Text style={styles.submitBtnText}>Close Lead Collection →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={leaveModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📅 Pending Leave Application Inspection</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter approval or decline note..."
              placeholderTextColor="#64748b"
              value={leaveNote}
              onChangeText={setLeaveNote}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#ef4444' }]} onPress={() => handleApproveDeclineLeave(false)}>
                <Text style={styles.submitBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#10b981' }]} onPress={() => handleApproveDeclineLeave(true)}>
                <Text style={styles.submitBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🗑️ Account Deletion (10-Day Grace Period)</Text>
            {employee.deletionScheduledAt ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: '#fcd34d', fontSize: 11 }}>Account is locked &amp; scheduled for purge. Revert note required:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason to revert deletion..."
                  placeholderTextColor="#64748b"
                  value={revertNote}
                  onChangeText={setRevertNote}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleRequestRevert}>
                  <Text style={styles.submitBtnText}>↺ Request Revert Deletion →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#ef4444' }]} onPress={handleInitiate10DayDelete}>
                <Text style={styles.submitBtnText}>Initiate 10-Day Purge →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setDeleteModalOpen(false)}>
              <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={documentsModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📄 Official Documents</Text>
            <Text style={{ color: '#ffffff', fontSize: 11 }}>PAN: {employee.documents.pan}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4 }}>Aadhaar: {employee.documents.aadhaar}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4 }}>Offer Letter: {employee.documents.offerLetter}</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setDocumentsModalOpen(false)}>
              <Text style={styles.submitBtnText}>Close Documents →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={bankDetailsModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Bank Account Details</Text>
            <Text style={{ color: '#ffffff', fontSize: 11 }}>Bank: {employee.bankDetails.bankName}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4 }}>Account: {employee.bankDetails.accountNo}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4 }}>IFSC: {employee.bankDetails.ifscCode}</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setBankDetailsModalOpen(false)}>
              <Text style={styles.submitBtnText}>Close Bank Details →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topBar: { backgroundColor: '#0f172a', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '800', fontSize: 11 },
  roleTag: { backgroundColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#34d399' },
  roleTagText: { color: '#34d399', fontSize: 9, fontWeight: '900' },
  content: { padding: 16, alignItems: 'center' },

  profileCard: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#34d399' },
  empName: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  lockBadge: { backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 8, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  empMeta: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  chipBtn: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)' },
  chipBtnText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },

  supBox: { backgroundColor: '#020617', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1e293b', marginTop: 10 },
  supLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  supVal: { fontSize: 12, color: '#38bdf8', fontWeight: '800', marginTop: 2 },
  purgeNotice: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, padding: 10, marginTop: 8 },
  purgeNoticeText: { color: '#fcd34d', fontSize: 10, fontWeight: '700' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, marginTop: 12, width: '100%', maxWidth: 600 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 600 },
  statCard: { width: '48%', backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b' },
  statVal: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  statLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '700' },

  actionBtn: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  docsCard: { width: '100%', maxWidth: 600, marginTop: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff', marginBottom: 10 },
  roleOpt: { backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },
  roleOptActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  roleOptText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  leadItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },
  textInput: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', padding: 10, fontSize: 11 },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
});
