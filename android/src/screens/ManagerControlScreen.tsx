/**
 * ManagerControlScreen.tsx — DAS CRM Android
 * Dedicated Full Screen Inspector for Department Managers (MANAGER role)
 * Features:
 * 1. Name, Email, Number, Role (Button to Upgrade), Assigned Under (Button to Change).
 * 2. Employees Assigned Under (Change or add any with lead & revenue telemetry).
 * 3. Department Pipeline Lead Audit (Total Dept Leads, Connected, Negotiated, Meeting Done, Won) -> Opens distribution log showing to whom & when.
 * 4. Attendance button -> Redirects to Attendance section with Manager name selected.
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
import { LeadAllocationEngineModal } from '../components/LeadAllocationEngineModal';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function ManagerControlScreen({ employee, onBack, onUpdateEmployee }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);

  // 👥 Department Staff Allocation Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([
    { id: 'dept-1', name: 'Priya Sharma', role: 'Team Leader', pipeline: '₹3,85,000', leads: 45 },
    { id: 'dept-2', name: 'Rohan Kumar', role: 'Sales Exec', pipeline: '₹2,20,000', leads: 25 },
  ]);
  const [newStaffNameInput, setNewStaffNameInput] = useState('');
  const [newStaffRoleInput, setNewStaffRoleInput] = useState<'Team Leader' | 'Sales Exec'>('Team Leader');

  // 🎯 Department Pipeline Audit Modal State
  const [leadAuditModalOpen, setLeadAuditModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING' | 'WON'>('TOTAL');

  // 📅 Leave Decision Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  // 🗑️ 10-Day Deletion Engine State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  // 📋 Roles & Responsibilities Report Modal State
  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);

  // 📄 Docs & Bank Details Modals
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  // ⚡ Lead Allocation Engine Modal State
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationSourceType, setAllocationSourceType] = useState<'EXCEL_CSV' | 'GOOGLE_SHEETS'>('EXCEL_CSV');

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Super Admin',
  ];

  const MOCK_DEPT_DISTRIBUTION = [
    { id: 'dept-dist-1', leadName: 'Global Infra CRM Deployment', distributedTo: 'Priya Sharma (Team Leader)', timestamp: 'Today, 09:30 AM', status: 'TOTAL' },
    { id: 'dept-dist-2', leadName: 'SmartRetail POS Suite', distributedTo: 'Rohan Kumar (Sales Exec)', timestamp: 'Yesterday, 02:15 PM', status: 'CONNECTED' },
    { id: 'dept-dist-3', leadName: 'Apex Financial AI Automation', distributedTo: 'Priya Sharma (Team Leader)', timestamp: 'Aug 21, 2026', status: 'MEETING' },
    { id: 'dept-dist-4', leadName: 'Metro Logistics Cloud Hub', distributedTo: 'Rohan Kumar (Sales Exec)', timestamp: 'Aug 19, 2026', status: 'WON' },
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

  const handleAddStaff = () => {
    if (!newStaffNameInput.trim()) {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⚠️ Name Required',
        message: 'Please enter staff name.',
        type: 'WARNING',
      });
      return;
    }
    const newStaff = {
      id: `dept-${Date.now()}`,
      name: newStaffNameInput.trim(),
      role: newStaffRoleInput,
      pipeline: '₹0',
      leads: 0,
    };
    setStaffList(prev => [...prev, newStaff]);
    setNewStaffNameInput('');
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '✅ Department Staff Added',
      message: `Added ${newStaff.name} under ${employee.name}'s department.`,
      type: 'SUCCESS',
    });
  };

  const handleRemoveStaff = (id: string, name: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '🗑️ Staff Removed',
      message: `Removed ${name} from ${employee.name}'s department.`,
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
      title: '📋 Manager Report Shared',
      message: `Generated & exported Department Manager Governance Report for ${employee.name}.`,
      type: 'SUCCESS',
    });
  };

  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Directory</Text>
        </TouchableOpacity>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>DEPARTMENT MANAGER CONTROL</Text>
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

        {/* Department Staff Assigned Under Manager Card */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.cardTitle}>👥 Department Staff Assigned Under {employee.name}</Text>
            <TouchableOpacity style={styles.actionChipBtn} onPress={() => setStaffModalOpen(true)}>
              <Text style={styles.actionChipBtnText}>Add / Change Staff ✏️</Text>
            </TouchableOpacity>
          </View>

          {staffList.map((st) => (
            <View key={st.id} style={styles.subRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{st.name} ({st.role})</Text>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>{st.leads} Dept Leads Managed</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#38bdf8' }}>{st.pipeline} Pipeline</Text>
            </View>
          ))}
        </View>

        {/* Department Pipeline Lead Audit Section */}
        <Text style={styles.sectionTitle}>📊 Department Pipeline Lead Audit</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#38bdf8' }]} onPress={() => { setLeadCategory('TOTAL'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>140</Text>
            <Text style={styles.statLbl}>Total Dept Leads →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#22c55e' }]} onPress={() => { setLeadCategory('CONNECTED'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#22c55e' }]}>85</Text>
            <Text style={styles.statLbl}>Connected →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#818cf8' }]} onPress={() => { setLeadCategory('NEGOTIATED'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#818cf8' }]}>32</Text>
            <Text style={styles.statLbl}>Negotiated →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#c084fc' }]} onPress={() => { setLeadCategory('MEETING'); setLeadAuditModalOpen(true); }}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>18</Text>
            <Text style={styles.statLbl}>Meeting Done →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.statCardFull, { borderColor: '#34d399' }]} onPress={() => { setLeadCategory('WON'); setLeadAuditModalOpen(true); }}>
          <Text style={[styles.statVal, { color: '#34d399' }]}>14 Won Deals</Text>
          <Text style={styles.statLbl}>Department Closed Revenue Deals →</Text>
        </TouchableOpacity>

        {/* Operational Actions */}
        <Text style={styles.sectionTitle}>⚙️ Manager Operations &amp; Governance</Text>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={styles.actionCard} onPress={handleRedirectToAttendance}>
            <Text style={styles.actionCardTitle}>⏱️ Attendance Portal (View {employee.name} Selected) →</Text>
            <Text style={styles.actionCardSub}>Redirects to attendance portal with Manager pre-selected in filter</Text>
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

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#c084fc' }]} onPress={() => setRolesReportModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#c084fc' }]}>📋 Share Manager Roles &amp; Responsibilities Report →</Text>
            <Text style={styles.actionCardSub}>Generate and share Manager SLA, department targets &amp; P&amp;L telemetry</Text>
          </TouchableOpacity>
        </View>

        {/* ⚡ Manager Lead Flow Controls (Matching Admin/Manager Diagram) */}
        <Text style={styles.sectionTitle}>⚡ Manager Lead Flow &amp; Allocation Controls</Text>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#818cf8' }]} onPress={() => { setAllocationSourceType('EXCEL_CSV'); setAllocationModalOpen(true); }}>
            <Text style={[styles.actionCardTitle, { color: '#818cf8' }]}>📦 Allocated Leads (Excel / Imported Lead Flow) →</Text>
            <Text style={styles.actionCardSub}>Batchwise Allocation (Rows 1-100 to TL A, 101-300 to Sales Rep C, custom batch rules)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#34d399' }]} onPress={() => { setAllocationSourceType('GOOGLE_SHEETS'); setAllocationModalOpen(true); }}>
            <Text style={[styles.actionCardTitle, { color: '#34d399' }]}>🟢 Upcoming Leads (Google Sheet Lead Flow) →</Text>
            <Text style={styles.actionCardSub}>Direct User Assignment &amp; Live Lead Pool Claim Window settings</Text>
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

      {/* ── MODAL: LEAD ALLOCATION & DISTRIBUTION ENGINE ────────────── */}
      <LeadAllocationEngineModal
        visible={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        totalLeadsCount={214}
        sourceType={allocationSourceType}
      />

      {/* ── MODAL: DEPARTMENT STAFF ALLOCATION ────────────────────────────── */}
      <Modal visible={staffModalOpen} transparent animationType="slide" onRequestClose={() => setStaffModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Department Staff under {employee.name}</Text>
              <TouchableOpacity onPress={() => setStaffModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 200 }}>
              {staffList.map((st) => (
                <View key={st.id} style={styles.subCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{st.name} ({st.role})</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>{st.pipeline} Pipeline • {st.leads} Leads</Text>
                  </View>
                  <TouchableOpacity style={{ backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }} onPress={() => handleRemoveStaff(st.id, st.name)}>
                    <Text style={{ color: '#fca5a5', fontSize: 10, fontWeight: '800' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 10, fontWeight: '800', color: '#c084fc', marginTop: 10 }}>Add New Staff under {employee.name}:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter staff full name..."
              placeholderTextColor="#64748b"
              value={newStaffNameInput}
              onChangeText={setNewStaffNameInput}
            />

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {(['Team Leader', 'Sales Exec'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectChip, newStaffRoleInput === r && styles.roleSelectChipActive]}
                  onPress={() => setNewStaffRoleInput(r)}
                >
                  <Text style={[styles.roleSelectChipText, newStaffRoleInput === r && { color: '#ffffff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 10 }]} onPress={handleAddStaff}>
              <Text style={styles.modalBtnText}>+ Add Staff to Department →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: DEPARTMENT PIPELINE LEAD AUDIT ─────────────────────────── */}
      <Modal visible={leadAuditModalOpen} transparent animationType="slide" onRequestClose={() => setLeadAuditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Dept Pipeline Audit — {leadCategory}</Text>
              <TouchableOpacity onPress={() => setLeadAuditModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {MOCK_DEPT_DISTRIBUTION.map((log) => (
                <View key={log.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{log.leadName}</Text>
                    <Text style={{ fontSize: 10, color: '#c084fc', marginTop: 2 }}>Distributed To: {log.distributedTo}</Text>
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
              <Text style={styles.modalTitle}>📋 Manager Governance Report</Text>
              <TouchableOpacity onPress={() => setRolesReportModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: '#94a3b8', marginVertical: 8 }}>
              • Department Size: 2 Active Teams (TLs &amp; Reps){'\n'}
              • Quarterly Revenue Target: ₹25,00,000 Target{'\n'}
              • Department Win Rate: 22.4% SLA Verified{'\n'}
              • Operational Risk Audit: 0 SLA Breaches Recorded
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]} onPress={handleShareRolesReport}>
              <Text style={styles.modalBtnText}>Share Manager Report →</Text>
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
              Duration: 4 Days (Annual Leave){'\n'}
              Dates: Sep 01 - Sep 04, 2026
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
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>PAN Card: {employee.documents?.pan || 'LMNOP6789V'}</Text>
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
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Bank: {employee.bankDetails?.bankName || 'ICICI Bank'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Account No: {employee.bankDetails?.accountNo || '99887766554433'}</Text>
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  backBtn: { backgroundColor: 'rgba(30, 41, 59, 0.8)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  backBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  roleTag: { backgroundColor: 'rgba(192, 132, 252, 0.18)', borderWidth: 1.5, borderColor: 'rgba(192, 132, 252, 0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  roleTagText: { fontSize: 10, fontWeight: '900', color: '#c084fc', letterSpacing: 0.4 },
  content: { padding: 16, alignItems: 'center' },
  profileCard: { width: '100%', maxWidth: 500, backgroundColor: '#0d1527', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.3)', padding: 18, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  profileName: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  profileMeta: { fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: '600' },
  lockedPill: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: 9, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)' },
  upgradeBtn: { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderWidth: 1.5, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  upgradeBtnText: { fontSize: 11, fontWeight: '900', color: '#a5b4fc', letterSpacing: 0.3 },
  changeSupBtn: { backgroundColor: 'rgba(51, 65, 85, 0.6)', borderWidth: 1.5, borderColor: '#475569', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  changeSupBtnText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },
  deletionNoticeBox: { width: '100%', maxWidth: 500, backgroundColor: 'rgba(245, 158, 11, 0.18)', borderWidth: 1.5, borderColor: 'rgba(245, 158, 11, 0.5)', borderRadius: 14, padding: 12, marginBottom: 14 },
  deletionNoticeText: { fontSize: 11, fontWeight: '800', color: '#fbbf24', lineHeight: 16 },
  cardBox: { width: '100%', maxWidth: 500, backgroundColor: '#0d1527', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.3)', padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff', letterSpacing: 0.3 },
  actionChipBtn: { backgroundColor: 'rgba(192, 132, 252, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(192, 132, 252, 0.5)' },
  actionChipBtnText: { fontSize: 10, color: '#c084fc', fontWeight: '900' },
  subRow: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  subCardRow: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleSelectChip: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6 },
  roleSelectChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  roleSelectChipText: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  sectionTitle: { width: '100%', maxWidth: 500, fontSize: 12, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
  statsGrid: { width: '100%', maxWidth: 500, flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#0d1527', borderRadius: 16, borderWidth: 1.5, padding: 14, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  statCardFull: { width: '100%', maxWidth: 500, backgroundColor: '#0d1527', borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12, shadowColor: '#34d399', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 10, fontWeight: '800', color: '#cbd5e1', marginTop: 3 },
  actionCard: { width: '100%', maxWidth: 500, backgroundColor: '#0d1527', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.35)', padding: 14, marginBottom: 10, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  actionCardTitle: { fontSize: 12, fontWeight: '900', color: '#38bdf8', letterSpacing: 0.2 },
  actionCardSub: { fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: '500' },
  actionBtnHalf: { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#334155', shadowColor: '#818cf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  actionBtnHalfText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 0.3 },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.6)', shadowColor: '#ef4444', shadowOpacity: 0.3 },
  deleteBtnText: { color: '#fca5a5', fontWeight: '900', fontSize: 11, letterSpacing: 0.3 },
  docBankBtn: { backgroundColor: '#0d1527', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  docBankBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11, letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#0d1527', borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.35)', padding: 18, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },
  leadCardRow: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 8 },
  modalItemBtn: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1.5, borderColor: '#334155', padding: 12, marginTop: 8 },
  modalItemBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  textInput: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1.5, borderColor: '#334155', color: '#ffffff', padding: 12, fontSize: 12, marginTop: 8 },
  modalBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
});
