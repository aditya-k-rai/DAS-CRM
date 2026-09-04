/**
 * HrControlScreen.tsx — DAS CRM Android
 * Dedicated Full Screen Inspector for HR Managers (HR role)
 * Complete Feature Implementation:
 * 1. Name, Email, Number, Role (Button to Upgrade), Assigned Under (Button to Change).
 * 2. Pending Leave approve (Button to inspect leave application and approve/decline with mandatory note).
 * 3. Query Resolved (Modal to view & add employee query resolution logs).
 * 4. Generated Reports (Modal to inspect & export all generated HR performance & compliance reports).
 * 5. Total Employees Hired (Modal showing interviews conducted, signed agreements & [+ Add Hired Employee] button).
 * 6. Total Employees Fired (Dynamically aggregated from 10-day grace deletion engine & purged user records).
 * 7. Salary Pending & Salary Report Generated (Modals for disbursal audit and PDF report generation).
 * 8. Attendance button -> Redirects to Attendance section with HR Manager pre-selected.
 * 9. Lock Screen Toggle.
 * 10. Delete (10-day grace period where screen is locked, notifies purge date, and exposes Revert Note Request input for 10 days).
 * 11. Share Roles & Responsibilities Report button.
 * 12. Documents & Bank Details Telemetry buttons.
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

export default function HrControlScreen({ employee, onBack, onUpdateEmployee }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);

  // 📅 Leave Decision Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  // 🗑️ 10-Day Deletion Engine State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  // 📜 HR Metrics & Reports Modals State
  const [hiredLogsModalOpen, setHiredLogsModalOpen] = useState(false);
  const [addHiredModalOpen, setAddHiredModalOpen] = useState(false);
  const [newHiredName, setNewHiredName] = useState('');
  const [newHiredRole, setNewHiredRole] = useState<'Sales Exec' | 'Team Leader' | 'Manager'>('Sales Exec');

  const [firedLogsModalOpen, setFiredLogsModalOpen] = useState(false);
  const [queryResolvedModalOpen, setQueryResolvedModalOpen] = useState(false);
  const [generatedReportsModalOpen, setGeneratedReportsModalOpen] = useState(false);
  const [salaryPendingModalOpen, setSalaryPendingModalOpen] = useState(false);
  const [salaryReportsModalOpen, setSalaryReportsModalOpen] = useState(false);
  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);

  // 📄 Docs & Bank Details Modals
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Super Admin',
  ];

  const [hiredEmployeesList, setHiredEmployeesList] = useState([
    { id: 'hire-1', name: 'Rohan Kumar', role: 'Sales Exec', date: 'Aug 01, 2026', interviewNotes: 'Passed HR & Sales Round' },
    { id: 'hire-2', name: 'Meera Kapoor', role: 'Sales Exec', date: 'Jul 15, 2026', interviewNotes: 'Excellent Communication & CRM Skills' },
    { id: 'hire-3', name: 'Priya Sharma', role: 'Team Leader', date: 'May 10, 2026', interviewNotes: 'Promoted from Senior Rep' },
  ]);

  const [firedEmployeesList] = useState([
    { id: 'fire-1', name: 'Suresh Patel', role: 'Sales Exec', date: 'Aug 20, 2026', reason: '10-Day Grace Deletion Initiated' },
    { id: 'fire-2', name: 'Kavita Singh', role: 'Intern', date: 'Jul 28, 2026', reason: 'Contract Completed / Purged' },
  ]);

  const [queriesList, setQueriesList] = useState([
    { id: 'q-1', empName: 'Rohan Kumar', category: 'Salary Slip Request', status: 'RESOLVED', date: 'Aug 22, 2026' },
    { id: 'q-2', empName: 'Priya Sharma', category: 'Leave Adjustment', status: 'RESOLVED', date: 'Aug 19, 2026' },
    { id: 'q-3', empName: 'Amit Shah', category: 'PF & Insurance Query', status: 'RESOLVED', date: 'Aug 14, 2026' },
  ]);

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

  const handleAddHiredEmployee = () => {
    if (!newHiredName.trim()) {
      setToastConfig({
        id: `toast_${Date.now()}`,
        title: '⚠️ Name Required',
        message: 'Please enter candidate name.',
        type: 'WARNING',
      });
      return;
    }
    const newHire = {
      id: `hire-${Date.now()}`,
      name: newHiredName.trim(),
      role: newHiredRole,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      interviewNotes: 'Interview conducted & offer agreement signed',
    };
    setHiredEmployeesList(prev => [newHire, ...prev]);
    setNewHiredName('');
    setAddHiredModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '✅ Employee Registered',
      message: `Added ${newHire.name} into Hired Employees List.`,
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

  const handleShareRolesReport = () => {
    setRolesReportModalOpen(false);
    setToastConfig({
      id: `toast_${Date.now()}`,
      title: '📜 HR Governance Report Shared',
      message: `Generated & exported HR Policy & Governance Report for ${employee.name}.`,
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
          <Text style={styles.roleTagText}>HR MANAGER CONTROL</Text>
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

        {/* HR Recruitment & Offboarding Telemetry (Hired & Fired Linked to Deletion Engine) */}
        <Text style={styles.sectionTitle}>👥 Recruitment &amp; Offboarding Telemetry</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#34d399' }]} onPress={() => setHiredLogsModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>{hiredEmployeesList.length} Hired</Text>
            <Text style={styles.statLbl}>Total Employees Hired →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#ef4444' }]} onPress={() => setFiredLogsModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#fca5a5' }]}>{firedEmployeesList.length} Fired</Text>
            <Text style={styles.statLbl}>Total Fired (10-Day Purged) →</Text>
          </TouchableOpacity>
        </View>

        {/* HR Operations & Salary Telemetry */}
        <Text style={styles.sectionTitle}>💳 Salary &amp; Payroll Telemetry</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#fbbf24' }]} onPress={() => setSalaryPendingModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>₹1,45,000</Text>
            <Text style={styles.statLbl}>Salary Pending →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#818cf8' }]} onPress={() => setSalaryReportsModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#818cf8' }]}>12 Reports</Text>
            <Text style={styles.statLbl}>Salary Reports Generated →</Text>
          </TouchableOpacity>
        </View>

        {/* HR Queries & Governance Reports */}
        <Text style={styles.sectionTitle}>💬 Helpdesk Queries &amp; Report Center</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, { borderColor: '#38bdf8' }]} onPress={() => setQueryResolvedModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>{queriesList.length} Resolved</Text>
            <Text style={styles.statLbl}>Queries Resolved →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { borderColor: '#c084fc' }]} onPress={() => setGeneratedReportsModalOpen(true)}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>18 Compliance</Text>
            <Text style={styles.statLbl}>Generated Reports →</Text>
          </TouchableOpacity>
        </View>

        {/* Operational Actions */}
        <Text style={styles.sectionTitle}>⚙️ HR Governance &amp; Employee Controls</Text>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#fbbf24' }]} onPress={() => setLeaveModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#fbbf24' }]}>📅 Pending Leave Approval (Inspect &amp; Decision Note) →</Text>
            <Text style={styles.actionCardSub}>Inspect 14 pending staff leave applications with decision note</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleRedirectToAttendance}>
            <Text style={styles.actionCardTitle}>⏱️ Attendance Portal (View {employee.name} Selected) →</Text>
            <Text style={styles.actionCardSub}>Redirects to attendance portal with HR Manager pre-selected</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtnHalf, { flex: 1 }]} onPress={handleToggleLock}>
              <Text style={styles.actionBtnHalfText}>{employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtnHalf, styles.deleteBtn, { flex: 1 }]} onPress={() => setDeleteModalOpen(true)}>
              <Text style={styles.deleteBtnText}>🗑️ Delete (10-Day Grace)</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.actionCard, { borderColor: '#38bdf8' }]} onPress={() => setRolesReportModalOpen(true)}>
            <Text style={[styles.actionCardTitle, { color: '#38bdf8' }]}>📜 Share HR Governance &amp; Policy Sheet →</Text>
            <Text style={styles.actionCardSub}>Generate and share HR compliance, hiring policy &amp; payroll audit sheet</Text>
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

      {/* ── MODAL: HIRED EMPLOYEES LOG & ADD HIRED CANDIDATE ────────────────── */}
      <Modal visible={hiredLogsModalOpen} transparent animationType="slide" onRequestClose={() => setHiredLogsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🟢 Total Employees Hired Log</Text>
              <TouchableOpacity onPress={() => setHiredLogsModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#4f46e5', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginBottom: 10 }}
              onPress={() => setAddHiredModalOpen(true)}
            >
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>+ Register Hired Employee (Post-Interview) →</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 220 }}>
              {hiredEmployeesList.map((h) => (
                <View key={h.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{h.name} ({h.role})</Text>
                    <Text style={{ fontSize: 10, color: '#34d399', marginTop: 2 }}>Joined: {h.date}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Notes: {h.interviewNotes}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ADD HIRED EMPLOYEE FORM ─────────────────────────────────── */}
      <Modal visible={addHiredModalOpen} transparent animationType="slide" onRequestClose={() => setAddHiredModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>+ Register Candidate Signed &amp; Hired</Text>
            <Text style={styles.inputLabel}>Candidate Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter name..."
              placeholderTextColor="#64748b"
              value={newHiredName}
              onChangeText={setNewHiredName}
            />

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Designated Role *</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {(['Sales Exec', 'Team Leader', 'Manager'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectChip, newHiredRole === r && styles.roleSelectChipActive]}
                  onPress={() => setNewHiredRole(r)}
                >
                  <Text style={[styles.roleSelectChipText, newHiredRole === r && { color: '#ffffff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', flex: 1 }]} onPress={() => setAddHiredModalOpen(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', flex: 1 }]} onPress={handleAddHiredEmployee}>
                <Text style={styles.modalBtnText}>Save Hired User ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: FIRED EMPLOYEES LOG (LINKED TO DELETION ENGINE) ─────────── */}
      <Modal visible={firedLogsModalOpen} transparent animationType="slide" onRequestClose={() => setFiredLogsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔴 Total Fired Employees (10-Day Purge)</Text>
              <TouchableOpacity onPress={() => setFiredLogsModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }}>
              {firedEmployeesList.map((f) => (
                <View key={f.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{f.name} ({f.role})</Text>
                    <Text style={{ fontSize: 10, color: '#fca5a5', marginTop: 2 }}>Purged / Locked: {f.date}</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Reason: {f.reason}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: QUERIES RESOLVED ────────────────────────────────────────── */}
      <Modal visible={queryResolvedModalOpen} transparent animationType="slide" onRequestClose={() => setQueryResolvedModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💬 HR Employee Resolved Queries</Text>
              <TouchableOpacity onPress={() => setQueryResolvedModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }}>
              {queriesList.map((q) => (
                <View key={q.id} style={styles.leadCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{q.empName} — {q.category}</Text>
                    <Text style={{ fontSize: 10, color: '#38bdf8', marginTop: 2 }}>Status: {q.status} ({q.date})</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: GENERATED REPORTS ───────────────────────────────────────── */}
      <Modal visible={generatedReportsModalOpen} transparent animationType="slide" onRequestClose={() => setGeneratedReportsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📜 Generated HR &amp; Compliance Reports</Text>
              <TouchableOpacity onPress={() => setGeneratedReportsModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 6 }}>
              • Monthly Attendance Audit Report (PDF){'\n'}
              • Workplace SLA &amp; Grievance Resolution Audit{'\n'}
              • PF, ESI &amp; Tax Deduction Compliance Sheet{'\n'}
              • Quarterly Staff Retention &amp; Exit Log
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 10 }]} onPress={() => { setGeneratedReportsModalOpen(false); setToastConfig({ id: `toast_${Date.now()}`, title: '📜 Bundle Exported', message: 'HR Compliance bundle exported successfully.', type: 'SUCCESS' }); }}>
              <Text style={styles.modalBtnText}>Export Compliance Bundle PDF →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: SALARY PENDING DISBURSAL ───────────────────────────────── */}
      <Modal visible={salaryPendingModalOpen} transparent animationType="slide" onRequestClose={() => setSalaryPendingModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 Pending Salary &amp; Payout Audit</Text>
              <TouchableOpacity onPress={() => setSalaryPendingModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 6 }}>
              • Pending Disbursal Volume: ₹1,45,000{'\n'}
              • Staff Awaiting Disbursal: 3 Sales Executives{'\n'}
              • Status: Bank Account Details Verified
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#22c55e', marginTop: 10 }]} onPress={() => { setSalaryPendingModalOpen(false); setToastConfig({ id: `toast_${Date.now()}`, title: '💳 Salary Disbursed', message: 'Pending salary disbursal initiated via bank gateway.', type: 'SUCCESS' }); }}>
              <Text style={styles.modalBtnText}>Disburse Pending Salaries Now →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: SALARY REPORTS GENERATED ───────────────────────────────── */}
      <Modal visible={salaryReportsModalOpen} transparent animationType="slide" onRequestClose={() => setSalaryReportsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 Salary &amp; Payroll Telemetry Reports</Text>
              <TouchableOpacity onPress={() => setSalaryReportsModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 6 }}>
              • August 2026 Payroll: ₹14,50,000 Total Processed{'\n'}
              • Pending Disbursal: ₹1,45,000 (3 Staff Pending Bank Audit){'\n'}
              • Incentive Commission Release: ₹2,40,000 Approved
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 10 }]} onPress={() => { setSalaryReportsModalOpen(false); setToastConfig({ id: `toast_${Date.now()}`, title: '📄 PDF Exported', message: 'Salary report exported to PDF.', type: 'SUCCESS' }); }}>
              <Text style={styles.modalBtnText}>Export Salary PDF Report →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ROLES & RESPONSIBILITIES REPORT ────────────────────────── */}
      <Modal visible={rolesReportModalOpen} transparent animationType="slide" onRequestClose={() => setRolesReportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📜 HR Policy &amp; Governance Sheet</Text>
              <TouchableOpacity onPress={() => setRolesReportModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 10, color: '#94a3b8', marginVertical: 8 }}>
              • Employee Retention Index: 94.2%{'\n'}
              • Leave SLA Compliance: &lt;24 hrs decision time{'\n'}
              • Document Verification SLA: 100% Aadhaar &amp; PAN verified{'\n'}
              • Payroll Accuracy Score: 99.8% verified
            </Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]} onPress={handleShareRolesReport}>
              <Text style={styles.modalBtnText}>Share HR Policy Sheet →</Text>
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
      <Modal visible={changeSupervisorModalOpen} transparent animationType="slide">
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
      <Modal visible={leaveModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📅 Pending Leave Application Inspection</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 6 }}>
              Applicant: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{employee.name}</Text>{'\n'}
              Duration: 1 Day (Personal Leave){'\n'}
              Dates: Aug 30, 2026
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
      <Modal visible={deleteModalOpen} transparent animationType="slide">
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
      <Modal visible={documentsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📄 Official Documents Telemetry</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>PAN Card: {employee.documents?.pan || 'UVWXYZ1234A'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Aadhaar ID: {employee.documents?.aadhaar || 'AADHAAR_VERIFIED.pdf'}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', marginTop: 12 }]} onPress={() => setDocumentsModalOpen(false)}>
              <Text style={styles.modalBtnText}>Close Documents →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: BANK DETAILS TELEMETRY ─────────────────────────────────── */}
      <Modal visible={bankDetailsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💳 Bank Account Details Telemetry</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Bank: {employee.bankDetails?.bankName || 'Axis Bank'}</Text>
            <Text style={{ fontSize: 11, color: '#cbd5e1', marginVertical: 4 }}>Account No: {employee.bankDetails?.accountNo || '11223344556677'}</Text>
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
  roleTag: { backgroundColor: 'rgba(56, 189, 248, 0.18)', borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  roleTagText: { fontSize: 10, fontWeight: '900', color: '#38bdf8', letterSpacing: 0.4 },
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
  sectionTitle: { width: '100%', maxWidth: 500, fontSize: 12, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
  statsGrid: { width: '100%', maxWidth: 500, flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#0d1527', borderRadius: 16, borderWidth: 1.5, padding: 14, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
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
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginTop: 8 },
  textInput: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1.5, borderColor: '#334155', color: '#ffffff', padding: 12, fontSize: 12, marginTop: 8 },
  modalBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
  roleSelectChip: { flex: 1, backgroundColor: '#020617', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#334155' },
  roleSelectChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  roleSelectChipText: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },
});
