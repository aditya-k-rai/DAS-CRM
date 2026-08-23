/**
 * TeamLeaderControlScreen.tsx — DAS CRM Android
 * Dedicated Full Screen Inspector for Team Leaders (TEAM_LEADER role)
 * Features:
 * 1. Name, Email, Number, Role (Button to Upgrade), Assigned Under (Button to Change).
 * 2. Employees Assigned Under (Change or add any with lead & revenue telemetry).
 * 3. Lead Status Audit (Got & Distributed, Connected, Negotiated, Meeting Done, Won) -> Opens distribution log showing to whom & when.
 * 4. Attendance button -> Redirects to Attendance section with TL name selected.
 * 5. Pending Leave Request Button -> Inspect Application and approve or decline with decision Note.
 * 6. Lock Screen Toggle.
 * 7. Delete (10-day grace period where screen is locked, notifies purge date, and exposes Revert Note Request input for 10 days).
 * 8. Share Roles & Responsibilities Report button.
 * 9. Documents & Bank Details Telemetry buttons.
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

export default function TeamLeaderControlScreen({ employee, onBack, onUpdateEmployee }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);

  // 👥 Subordinates Allocation Modal State
  const [subordinatesModalOpen, setSubordinatesModalOpen] = useState(false);
  const [subordinatesList, setSubordinatesList] = useState([
    { id: 'sub-1', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000', leads: 25 },
    { id: 'sub-2', name: 'Meera Kapoor', role: 'Sales Exec', calls: 65, revenue: '₹1,85,000', leads: 15 },
  ]);
  const [newSubNameInput, setNewSubNameInput] = useState('');

  // 🎯 Lead Distribution Audit Modal State
  const [leadAuditModalOpen, setLeadAuditModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'GOT' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING' | 'WON'>('GOT');

  // 📅 Leave Decision Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  // 🗑️ 10-Day Deletion Engine State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  // 📜 Roles & Responsibilities Report Modal State
  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);

  // 📄 Docs & Bank Details Modals
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Manager A (Amit Shah)',
    'Manager B (Neha Joshi)',
  ];

  const MOCK_LEAD_DISTRIBUTION = [
    { id: 'dist-1', leadName: 'Acme Corp SLA Proposal', distributedTo: 'Amit Patel (Sales Exec)', timestamp: 'Today, 10:15 AM', status: 'GOT' },
    { id: 'dist-2', leadName: 'LogiTech Enterprise Bot', distributedTo: 'Meera Kapoor (Sales Exec)', timestamp: 'Yesterday, 04:30 PM', status: 'CONNECTED' },
    { id: 'dist-3', leadName: 'Sunita Logistics CRM Contract', distributedTo: 'Amit Patel (Sales Exec)', timestamp: 'Aug 20, 2026', status: 'MEETING' },
    { id: 'dist-4', leadName: 'Sethi Ent License Rollout', distributedTo: 'Meera Kapoor (Sales Exec)', timestamp: 'Aug 18, 2026', status: 'WON' },
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

  const handleAddSubordinate = () => {
    if (!newSubNameInput.trim()) {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⚠️ Name Required',
        message: 'Please enter rep name.',
        type: 'WARNING',
      });
      return;
    }
    const newRep = {
      id: `sub-${Date.now()}`,
      name: newSubNameInput.trim(),
      role: 'Sales Exec',
      calls: 0,
      revenue: '₹0',
      leads: 0,
    };
    setSubordinatesList(prev => [...prev, newRep]);
    setNewSubNameInput('');
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '✅ Rep Added',
      message: `Added ${newRep.name} under ${employee.name}'s team.`,
      type: 'SUCCESS',
    });
  };

  const handleRemoveSubordinate = (id: string, name: string) => {
    setSubordinatesList(prev => prev.filter(s => s.id !== id));
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '🗑️ Rep Removed',
      message: `Removed ${name} from ${employee.name}'s team.`,
      type: 'WARNING',
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

  const handleShareRolesReport = () => {
    setRolesReportModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '📜 TL Report Shared',
      message: `Generated & exported TL Governance & Responsibility Report for ${employee.name}.`,
      type: 'SUCCESS',
    });
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
          <Text style={styles.roleTagText}>TEAM LEADER CONTROL</Text>
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

        {/* Employees Assigned Under TL Card */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.cardTitle}>👥 Employees Assigned Under {employee.name}</Text>
            <TouchableOpacity style={styles.actionChipBtn} onPress={() => setSubordinatesModalOpen(true)}>
              <Text style={styles.actionChipBtnText}>Add / Change Staff ✏️</Text>
            </TouchableOpacity>
          </View>

          {subordinatesList.map((sub) => (
            <View key={sub.id} style={styles.subRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{sub.name} ({sub.role})</Text>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>{sub.calls} Calls • {sub.leads} Leads</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>{sub.revenue}</Text>
            </View>
          ))}
        </View>

        {/* Lead Distribution Audit Section */}
        <Text style={styles.sectionTitle}>📊 Lead Distribution &amp; Status Audit</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#38bdf8' }]} onPress={() => { setLeadCategory('GOT'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>45</Text>
            <Text style={styles.statLbl}>Got &amp; Distributed →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#22c55e' }]} onPress={() => { setLeadCategory('CONNECTED'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#22c55e' }]}>28</Text>
            <Text style={styles.statLbl}>Connected →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#818cf8' }]} onPress={() => { setLeadCategory('NEGOTIATED'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#818cf8' }]}>10</Text>
            <Text style={styles.statLbl}>Negotiated →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#c084fc' }]} onPress={() => { setLeadCategory('MEETING'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>5</Text>
            <Text style={styles.statLbl}>Meeting Done →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.statCardFull, { borderColor: '#34d399' }]} onPress={() => { setLeadCategory('WON'); setLeadAuditModalOpen(true); }}>
          <Text style={[styles.statVal, { color: '#34d399' }]}>2 Deals Won</Text>
          <Text style={styles.statLbl}>Total Revenue Deals Closed →</Text>
        </TouchableOpacity>

        {/* Operational Actions */}
        <Text style={styles.sectionTitle}>⚙️ Team Governance &amp; Operations</Text>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={styles.actionCard} onPress={handleRedirectToAttendance}>
            <Text style={styles.actionCardTitle}>⏱️ Attendance Section (View {employee.name} Selected) →</Text>
            <Text style={styles.actionCardSub}>Redirects to attendance portal with TL pre-selected in filter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#fbbf24' }]} onPress={() => setLeaveModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Approve Note) →</Text>
            <Text style={styles.actionCardSub}>Inspect application; approve/decline with mandatory note</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtnHalf, { flex: 1 }]} onPress={handleToggleLock}>
              <Text style={styles.actionBtnHalfText}>{employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtnHalf, styles.deleteBtn, { flex: 1 }]} onPress={() => setDeleteModalOpen(true)}>
              <Text style={styles.deleteBtnText}>🗑️ Delete (10-Day Grace)</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#818cf8' }]} onPress={() => setRolesReportModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#818cf8' }]}>📋 Share Roles &amp; Responsibilities Report →</Text>
            <Text style={styles.actionCardSub}>Generate and share TL SLA, lead distribution &amp; team targets report</Text>
          </TouchableOpacity>
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

      {/* ── MODAL: SUBORDINATES ALLOCATION ───────────────────────────────── */}
      <Modal visible={subordinatesModalOpen} transparent animationType="slide" onRequestClose={() => setSubordinatesModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Subordinate Reps under {employee.name}</Text>
              <TouchableOpacity onPress={() => setSubordinatesModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 200 }}>
              {subordinatesList.map((sub) => (
                <View key={sub.id} style={styles.subCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{sub.name}</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>{sub.calls} Calls • {sub.leads} Leads</Text>
                  </View>
                  <TouchableOpacity style={{ backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }} onPress={() => handleRemoveSubordinate(sub.id, sub.name)}>
                    <Text style={{ color: '#fca5a5', fontSize: 10, fontWeight: '800' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 10, fontWeight: '800', color: '#818cf8', marginTop: 10 }}>Add New Sales Exec under {employee.name}:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter rep full name..."
              placeholderTextColor="#64748b"
              value={newSubNameInput}
              onChangeText={setNewSubNameInput}
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]} onPress={handleAddSubordinate}>
              <Text style={styles.modalBtnText}>+ Add Rep to Team →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: LEAD DISTRIBUTION AUDIT ───────────────────────────────── */}
      <Modal visible={leadAuditModalOpen} transparent animationType="slide" onRequestClose={() => setLeadAuditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Lead Distribution Log — {leadCategory}</Text>
              <TouchableOpacity onPress={() => setLeadAuditModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {MOCK_LEAD_DISTRIBUTION.map((log) => (
                <View key={log.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{log.leadName}</Text>
                    <Text style={{ fontSize: 10, color: '#38bdf8', marginTop: 2 }}>Distributed To: {log.distributedTo}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Time: {log.timestamp}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 10 }]} onPress={() => setLeadAuditModalOpen(false)}>
              <Text style={styles.modalBtnText}>Close Audit →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ROLES & RESPONSIBILITIES REPORT ────────────────────────── */}
      <Modal visible={rolesReportModalOpen} transparent animationType="slide" onRequestClose={() => setRolesReportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📜 TL Governance Report</Text>
              <TouchableOpacity onPress={() => setRolesReportModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: '#94a3b8', marginVertical: 8 }}>
              • Rep Target Audit: 2 Active Reps Assigned{'\n'}
              • Lead SLA Response Time: &lt;15 mins avg{'\n'}
              • Weekly Pipeline Audit: ₹4,05,000 Total Open Pipeline{'\n'}
              • Conversion Target Compliance: 14.8% SLA Verified
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]} onPress={handleShareRolesReport}>
              <Text style={styles.modalBtnText}>Share TL SLA Report →</Text>
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
              Duration: 2 Days (Casual Leave){'\n'}
              Dates: Aug 28 - Aug 29, 2026
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
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>PAN Card: {employee.documents?.pan || 'PQRST3456U'}</Text>
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
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Bank: {employee.bankDetails?.bankName || 'Kotak Bank'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Account No: {employee.bankDetails?.accountNo || '66778899001122'}</Text>
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
  roleTag: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  roleTagText: { fontSize: 10, fontWeight: '900', color: '#fbbf24' },
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
  cardBox: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  actionChipBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  actionChipBtnText: { fontSize: 10, color: '#818cf8', fontWeight: '800' },
  subRow: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  subCardRow: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { width: '100%', maxWidth: 500, fontSize: 12, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  statsGrid: { width: '100%', maxWidth: 500, flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, padding: 12 },
  statCardFull: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
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
  leadCardRow: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 8 },
  modalItemBtn: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginTop: 8 },
  modalItemBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  textInput: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', color: '#ffffff', padding: 12, fontSize: 12, marginTop: 8 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },
});
