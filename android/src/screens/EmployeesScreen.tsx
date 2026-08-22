/**
 * EmployeesScreen.tsx — DAS CRM Android
 * Complete Employee, Team Leader, Department Manager & HR Inspector Control Portal.
 * Features:
 * 1. Main Directory Card View: Displays Name, Role Badge, Assign Under, and [Inspect & Control →] button.
 * 2. 4 Role-Tailored Inspector Control Screens (SALES_EXEC, TEAM_LEADER, MANAGER, HR).
 * 3. 📄 Documents & 💳 Bank Details View Buttons (Bottom) for ALL Employees & Roles with Old Records Audit.
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
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC';
  assignedManager: string;
  status: 'ONLINE' | 'IN_CALL' | 'OFFLINE';
  avatarUrl: string;
  isLocked?: boolean;
  deletionScheduledAt?: string | null;
  deletionReason?: string | null;

  // Documents & Banking Telemetry (Bottom Buttons)
  documents: {
    pan: string;
    aadhaar: string;
    eduCert: string;
    offerLetter: string;
    lastUpdatedDate: string;
    historyLogs: { date: string; docType: string; oldValue: string; newValue: string }[];
  };

  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNo: string;
    ifscCode: string;
    upiId: string;
    lastUpdatedDate: string;
    historyLogs: { date: string; bankName: string; accountNo: string }[];
  };

  // Telemetry Metrics
  leads: {
    totalReceived: number;
    connected: number;
    inNegotiation: number;
    meetingScheduled: number;
    won: number;
    totalDistributed: number;
    distributionBreakdown: { targetName: string; targetRole: string; count: number; dateStr: string }[];
  };

  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
  };

  subordinates: { id: string; name: string; role: string; calls: number; revenue: string; leads: number }[];

  hrMetrics?: {
    pendingLeavesCount: number;
    queriesResolvedCount: number;
    reportsGeneratedCount: number;
    totalHiredCount: number;
    totalFiredCount: number;
    interviewsConductedCount: number;
    salaryPendingCount: number;
    salaryReportsCount: number;
  };
}

export default function EmployeesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const userRole: UserRole = normalizeRoleStr(currentUser.role);
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Employees Database
  const [employeesList, setEmployeesList] = useState<EmployeeProfile[]>([
    {
      id: 'emp-1',
      name: 'Amit Shah',
      email: 'amit.shah@acme.com',
      phone: '+91 98765 43210',
      role: 'MANAGER',
      assignedManager: 'Tenant Admin (Vikram Singh)',
      status: 'ONLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'ABCDE1234F',
        aadhaar: 'AADHAAR_9876_VERIFIED.pdf',
        eduCert: 'DEGREE_MBA_2022.pdf',
        offerLetter: 'OFFER_LETTER_MANAGER.pdf',
        lastUpdatedDate: 'Aug 01, 2026',
        historyLogs: [
          { date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' },
        ],
      },
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolder: 'Amit Shah',
        accountNo: '50100987654321',
        ifscCode: 'HDFC0001234',
        upiId: 'amit@hdfcbank',
        lastUpdatedDate: 'Jul 28, 2026',
        historyLogs: [
          { date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' },
        ],
      },
      leads: {
        totalReceived: 140,
        connected: 85,
        inNegotiation: 32,
        meetingScheduled: 18,
        won: 14,
        totalDistributed: 110,
        distributionBreakdown: [
          { targetName: 'Priya Sharma (TL)', targetRole: 'Team Leader', count: 45, dateStr: 'Today, 10:15 AM' },
          { targetName: 'Karan Verma (TL)', targetRole: 'Team Leader', count: 40, dateStr: 'Yesterday, 4:30 PM' },
          { targetName: 'Rohan Kumar (Exec)', targetRole: 'Sales Exec', count: 25, dateStr: 'Aug 20, 2:00 PM' },
        ],
      },
      attendance: { presentDays: 21, absentDays: 1, leaveDays: 1, todayInTime: '09:15 AM', todayOutTime: '06:30 PM', todayGps: '28.440743, 77.531117' },
      subordinates: [
        { id: 'sub-1', name: 'Priya Sharma', role: 'Team Leader', calls: 184, revenue: '$38,500', leads: 45 },
        { id: 'sub-2', name: 'Rohan Kumar', role: 'Sales Exec', calls: 84, revenue: '$22,000', leads: 25 },
      ],
    },
    {
      id: 'emp-2',
      name: 'Neha Joshi',
      email: 'neha.joshi@acme.com',
      phone: '+91 98123 76543',
      role: 'MANAGER',
      assignedManager: 'Tenant Admin (Vikram Singh)',
      status: 'ONLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'FGHIJ5678K',
        aadhaar: 'AADHAAR_5432_VERIFIED.pdf',
        eduCert: 'DEGREE_BTECH_2023.pdf',
        offerLetter: 'OFFER_LETTER_MGR_2026.pdf',
        lastUpdatedDate: 'Jul 15, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'ICICI Bank',
        accountHolder: 'Neha Joshi',
        accountNo: '33440099887766',
        ifscCode: 'ICIC0005678',
        upiId: 'neha@icici',
        lastUpdatedDate: 'Jun 10, 2026',
        historyLogs: [],
      },
      leads: {
        totalReceived: 120,
        connected: 70,
        inNegotiation: 28,
        meetingScheduled: 12,
        won: 10,
        totalDistributed: 95,
        distributionBreakdown: [
          { targetName: 'Sunita Verma (HR)', targetRole: 'HR Operations', count: 50, dateStr: 'Today, 11:00 AM' },
          { targetName: 'Ananya Roy (Exec)', targetRole: 'Sales Exec', count: 45, dateStr: 'Aug 21, 1:15 PM' },
        ],
      },
      attendance: { presentDays: 22, absentDays: 0, leaveDays: 1, todayInTime: '09:05 AM', todayOutTime: null, todayGps: '28.440743, 77.531117' },
      subordinates: [
        { id: 'sub-4', name: 'Sunita Verma', role: 'HR', calls: 142, revenue: '$29,000', leads: 50 },
        { id: 'sub-5', name: 'Ananya Roy', role: 'Sales Exec', calls: 65, revenue: '$18,500', leads: 45 },
      ],
    },
    {
      id: 'emp-3',
      name: 'Sunita Verma',
      email: 'sunita.hr@acme.com',
      phone: '+91 97654 32109',
      role: 'HR',
      assignedManager: 'Tenant Admin (Vikram Singh)',
      status: 'ONLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'KLMNO9012P',
        aadhaar: 'AADHAAR_1122_VERIFIED.pdf',
        eduCert: 'DEGREE_HR_2021.pdf',
        offerLetter: 'OFFER_LETTER_HR_2025.pdf',
        lastUpdatedDate: 'Aug 10, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Axis Bank',
        accountHolder: 'Sunita Verma',
        accountNo: '91802003344556',
        ifscCode: 'UTIB0009988',
        upiId: 'sunita@axis',
        lastUpdatedDate: 'May 02, 2026',
        historyLogs: [],
      },
      leads: { totalReceived: 25, connected: 15, inNegotiation: 5, meetingScheduled: 3, won: 2, totalDistributed: 20, distributionBreakdown: [] },
      attendance: { presentDays: 20, absentDays: 1, leaveDays: 2, todayInTime: '09:30 AM', todayOutTime: '06:15 PM', todayGps: '28.440743, 77.531117' },
      subordinates: [],
      hrMetrics: {
        pendingLeavesCount: 3,
        queriesResolvedCount: 42,
        reportsGeneratedCount: 18,
        totalHiredCount: 12,
        totalFiredCount: 2,
        interviewsConductedCount: 28,
        salaryPendingCount: 2,
        salaryReportsCount: 8,
      },
    },
    {
      id: 'emp-4',
      name: 'Priya Sharma',
      email: 'priya.sharma@acme.com',
      phone: '+91 99887 11223',
      role: 'TEAM_LEADER',
      assignedManager: 'Manager A (Amit Shah)',
      status: 'IN_CALL',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'PQRST3456U',
        aadhaar: 'AADHAAR_3344_VERIFIED.pdf',
        eduCert: 'DEGREE_BBA_2023.pdf',
        offerLetter: 'OFFER_LETTER_TL_2026.pdf',
        lastUpdatedDate: 'Jul 20, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Kotak Bank',
        accountHolder: 'Priya Sharma',
        accountNo: '66778899001122',
        ifscCode: 'KKBK0004455',
        upiId: 'priya@kotak',
        lastUpdatedDate: 'Jun 18, 2026',
        historyLogs: [],
      },
      leads: {
        totalReceived: 45,
        connected: 28,
        inNegotiation: 10,
        meetingScheduled: 5,
        won: 2,
        totalDistributed: 40,
        distributionBreakdown: [
          { targetName: 'Rohan Kumar', targetRole: 'Sales Exec', count: 25, dateStr: 'Today, 9:30 AM' },
          { targetName: 'Ananya Roy', targetRole: 'Sales Exec', count: 15, dateStr: 'Yesterday, 3:15 PM' },
        ],
      },
      attendance: { presentDays: 21, absentDays: 1, leaveDays: 0, todayInTime: '09:10 AM', todayOutTime: null, todayGps: '28.440743, 77.531117' },
      subordinates: [
        { id: 'sub-6', name: 'Rohan Kumar', role: 'Sales Exec', calls: 84, revenue: '$22,000', leads: 25 },
        { id: 'sub-7', name: 'Ananya Roy', role: 'Sales Exec', calls: 65, revenue: '$18,500', leads: 15 },
      ],
    },
    {
      id: 'emp-5',
      name: 'Rohan Kumar',
      email: 'rohan.exec@acme.com',
      phone: '+91 98111 22334',
      role: 'SALES_EXEC',
      assignedManager: 'Priya Sharma (Team Leader)',
      status: 'ONLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'VWXYZ7890A',
        aadhaar: 'AADHAAR_5566_VERIFIED.pdf',
        eduCert: 'DEGREE_BSC_2024.pdf',
        offerLetter: 'OFFER_LETTER_EXEC_2026.pdf',
        lastUpdatedDate: 'Aug 05, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'SBI Bank',
        accountHolder: 'Rohan Kumar',
        accountNo: '20201122334455',
        ifscCode: 'SBIN0001122',
        upiId: 'rohan@sbi',
        lastUpdatedDate: 'Jul 12, 2026',
        historyLogs: [],
      },
      leads: { totalReceived: 35, connected: 22, inNegotiation: 8, meetingScheduled: 3, won: 2, totalDistributed: 0, distributionBreakdown: [] },
      attendance: { presentDays: 22, absentDays: 0, leaveDays: 0, todayInTime: '09:00 AM', todayOutTime: '06:00 PM', todayGps: '28.440743, 77.531117' },
      subordinates: [],
    },
    {
      id: 'emp-6',
      name: 'Ananya Roy',
      email: 'ananya.exec@acme.com',
      phone: '+91 97222 33445',
      role: 'SALES_EXEC',
      assignedManager: 'Priya Sharma (Team Leader)',
      status: 'ONLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      documents: {
        pan: 'BCDEF1234G',
        aadhaar: 'AADHAAR_7788_VERIFIED.pdf',
        eduCert: 'DEGREE_BA_2024.pdf',
        offerLetter: 'OFFER_LETTER_EXEC_2026.pdf',
        lastUpdatedDate: 'Aug 02, 2026',
        historyLogs: [],
      },
      bankDetails: {
        bankName: 'Punjab National Bank',
        accountHolder: 'Ananya Roy',
        accountNo: '11223344556677',
        ifscCode: 'PUNB0003344',
        upiId: 'ananya@pnb',
        lastUpdatedDate: 'Jul 01, 2026',
        historyLogs: [],
      },
      leads: { totalReceived: 28, connected: 18, inNegotiation: 6, meetingScheduled: 2, won: 2, totalDistributed: 0, distributionBreakdown: [] },
      attendance: { presentDays: 19, absentDays: 2, leaveDays: 1, todayInTime: '09:20 AM', todayOutTime: null, todayGps: '28.440743, 77.531117' },
      subordinates: [],
    },
  ]);

  // Inspector Modal State
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfile | null>(null);

  // Sub-Modals
  const [roleUpgradeModalOpen, setRoleUpgradeModalOpen] = useState(false);
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [leadPreviewModalOpen, setLeadPreviewModalOpen] = useState(false);
  const [previewLeadCategory, setPreviewLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATION' | 'WON'>('TOTAL');

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [shareRolesModalOpen, setShareRolesModalOpen] = useState(false);

  const [hrTelemetryModalOpen, setHrTelemetryModalOpen] = useState(false);
  const [hrTelemetryCategory, setHrTelemetryCategory] = useState<string>('HIRED');

  // 📄 Documents & 💳 Bank Modals (Bottom Buttons)
  const [viewDocsModalOpen, setViewDocsModalOpen] = useState(false);
  const [viewBankModalOpen, setViewBankModalOpen] = useState(false);

  // Handlers
  const handleUpgradeRole = (newRole: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC') => {
    if (!inspectingEmp) return;
    setEmployeesList(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, role: newRole } : e));
    setInspectingEmp(prev => prev ? { ...prev, role: newRole } : null);
    setRoleUpgradeModalOpen(false);
    Alert.alert('✅ Role Upgraded', `${inspectingEmp.name}'s role upgraded to ${newRole.replace('_', ' ')}!`);
  };

  const handleChangeSupervisor = (newSupervisor: string) => {
    if (!inspectingEmp) return;
    setEmployeesList(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, assignedManager: newSupervisor } : e));
    setInspectingEmp(prev => prev ? { ...prev, assignedManager: newSupervisor } : null);
    setSupervisorModalOpen(false);
    Alert.alert('✅ Supervisor Changed', `${inspectingEmp.name} now reports under ${newSupervisor}.`);
  };

  const handleToggleLockScreen = () => {
    if (!inspectingEmp) return;
    const nextLocked = !inspectingEmp.isLocked;
    setEmployeesList(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: nextLocked } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: nextLocked } : null);
    Alert.alert(nextLocked ? '🔒 Account Locked' : '🔓 Account Unlocked', `Employee ${inspectingEmp.name} screen lock updated.`);
  };

  const handleInitiate10DayDeletion = () => {
    if (!inspectingEmp) return;
    const scheduledDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    setEmployeesList(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: true, deletionScheduledAt: scheduledDate } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: true, deletionScheduledAt: scheduledDate } : null);
    setDeleteModalOpen(false);
    Alert.alert('⚠️ 10-Day Purge Initiated', `Account locked. Data scheduled for permanent purge in 10 days.`);
  };

  const handleRequestRevertDeletion = () => {
    if (!inspectingEmp) return;
    if (!revertNote.trim()) {
      Alert.alert('Validation Error', 'Please enter a note explaining why deletion should be reverted.');
      return;
    }
    setEmployeesList(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote } : null);
    setDeleteModalOpen(false);
    setRevertNote('');
    Alert.alert('🎉 Deletion Reverted', `Account deletion canceled! Note logged: "${revertNote}"`);
  };

  const handleApproveOrDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      Alert.alert('Validation Error', 'Please enter a note for approving or declining the leave application.');
      return;
    }
    setLeaveModalOpen(false);
    setLeaveNote('');
    Alert.alert(approved ? '✅ Leave Approved' : '🔴 Leave Declined', `Leave request updated with note: "${leaveNote}"`);
  };

  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Organization Hierarchy &amp; Profile Control</Text>
          <Text style={styles.headerSubtitle}>
            Tap [Inspect &amp; Control →] on any Manager, TL, HR or Employee card to open dedicated role control tools.
          </Text>
        </View>

        {/* ── STAFF DIRECTORY CARDS (STRICT USER SPEC) ────────────────────────── */}
        <Text style={styles.sectionTitle}>All Staff Members ({employeesList.length})</Text>

        <View style={styles.cardBox}>
          {employeesList.map((emp, idx) => {
            const roleBadgeBg =
              emp.role === 'MANAGER'
                ? 'rgba(192,132,252,0.15)'
                : emp.role === 'TEAM_LEADER'
                ? 'rgba(251,191,36,0.15)'
                : emp.role === 'HR'
                ? 'rgba(56,189,248,0.15)'
                : 'rgba(52,211,153,0.15)';

            const roleBadgeColor =
              emp.role === 'MANAGER'
                ? '#c084fc'
                : emp.role === 'TEAM_LEADER'
                ? '#fbbf24'
                : emp.role === 'HR'
                ? '#38bdf8'
                : '#34d399';

            return (
              <View
                key={emp.id}
                style={[
                  styles.empRow,
                  idx < employeesList.length - 1 && styles.borderBottom,
                  emp.isLocked && { backgroundColor: 'rgba(239,68,68,0.05)' },
                  !!emp.deletionScheduledAt && { backgroundColor: 'rgba(245,158,11,0.05)' },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <View style={[styles.roleTag, { backgroundColor: roleBadgeBg }]}>
                      <Text style={[styles.roleTagText, { color: roleBadgeColor }]}>{emp.role.replace('_', ' ')}</Text>
                    </View>

                    {emp.isLocked && (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedBadgeText}>🔒 LOCKED</Text>
                      </View>
                    )}

                    {!!emp.deletionScheduledAt && (
                      <View style={styles.suspendedBadge}>
                        <Text style={styles.suspendedBadgeText}>⏳ 10-DAY PURGE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.supervisorText}>
                    👤 Assigned under: <Text style={{ color: '#818cf8', fontWeight: '700' }}>{emp.assignedManager}</Text>
                  </Text>
                </View>

                {/* Inspect and Control Button */}
                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => setInspectingEmp(emp)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inspectBtnText}>Inspect &amp; Control →</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 ROLE-TAILORED INSPECTOR CONTROL SCREEN MODAL                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!inspectingEmp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {inspectingEmp && (
            <View style={styles.modalContent}>
              
              {/* Header Info */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Image source={{ uri: inspectingEmp.avatarUrl }} style={styles.modalAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.modalName}>{inspectingEmp.name}</Text>
                      <TouchableOpacity
                        style={styles.actionChipBtn}
                        onPress={() => setRoleUpgradeModalOpen(true)}
                      >
                        <Text style={styles.actionChipBtnText}>Upgrade Role ⚡</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalEmail}>{inspectingEmp.email} • {inspectingEmp.phone}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>Assigned under: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{inspectingEmp.assignedManager}</Text></Text>
                      <TouchableOpacity
                        style={styles.actionChipBtn}
                        onPress={() => setSupervisorModalOpen(true)}
                      >
                        <Text style={styles.actionChipBtnText}>Change ✏️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setInspectingEmp(null)}>
                  <Text style={{ color: '#94a3b8', fontSize: 20, fontWeight: '800', padding: 4 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>

                {/* ── 1. SALES EXECUTIVE INSPECTOR SCREEN ──────────────────────────────── */}
                {inspectingEmp.role === 'SALES_EXEC' && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.inspectorSectionTitle}>🎯 Lead Performance &amp; Pipeline Status</Text>

                    <View style={styles.grid2Col}>
                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(99,102,241,0.4)' }]} onPress={() => { setPreviewLeadCategory('TOTAL'); setLeadPreviewModalOpen(true); }}>
                        <Text style={styles.leadStatVal}>{inspectingEmp.leads.totalReceived}</Text>
                        <Text style={styles.leadStatLbl}>Total Leads Got →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(251,191,36,0.4)' }]} onPress={() => { setPreviewLeadCategory('CONNECTED'); setLeadPreviewModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#fbbf24' }]}>{inspectingEmp.leads.connected}</Text>
                        <Text style={styles.leadStatLbl}>Connected (Feedback) →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(129,140,248,0.4)' }]} onPress={() => { setPreviewLeadCategory('NEGOTIATION'); setLeadPreviewModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#818cf8' }]}>{inspectingEmp.leads.inNegotiation}</Text>
                        <Text style={styles.leadStatLbl}>In Negotiation →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(52,211,153,0.4)' }]} onPress={() => { setPreviewLeadCategory('WON'); setLeadPreviewModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#34d399' }]}>{inspectingEmp.leads.won}</Text>
                        <Text style={styles.leadStatLbl}>Won Deals →</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inspectorSectionTitle}>⚙️ Operations &amp; Administrative Controls</Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity style={styles.opControlBtn} onPress={() => { setInspectingEmp(null); navigation.navigate('Attendance'); }}>
                        <Text style={styles.opControlBtnText}>⏱️ Attendance Portal (View {inspectingEmp.name}) →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]} onPress={() => setLeaveModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Note) →</Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1 }]} onPress={handleToggleLockScreen}>
                          <Text style={styles.opControlBtnText}>{inspectingEmp.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]} onPress={() => setDeleteModalOpen(true)}>
                          <Text style={[styles.opControlBtnText, { color: '#fca5a5' }]}>{inspectingEmp.deletionScheduledAt ? '⏳ Revert Delete' : '🗑️ Delete (10 Days)'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* ── 2. TEAM LEADER INSPECTOR SCREEN ─────────────────────────────────── */}
                {inspectingEmp.role === 'TEAM_LEADER' && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.inspectorSectionTitle}>👥 Employees Assigned Under {inspectingEmp.name}</Text>
                    <View style={styles.subBox}>
                      {inspectingEmp.subordinates.map(sub => (
                        <View key={sub.id} style={styles.subRow}>
                          <Text style={styles.subName}>{sub.name} ({sub.role.replace('_', ' ')})</Text>
                          <Text style={styles.subMeta}>📞 {sub.calls} Calls • 🎯 {sub.leads} Leads</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.inspectorSectionTitle}>📊 Unit Lead Status Audit (Got &amp; Distributed)</Text>
                    <View style={styles.grid2Col}>
                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(99,102,241,0.4)' }]} onPress={() => { setPreviewLeadCategory('TOTAL'); setLeadPreviewModalOpen(true); }}>
                        <Text style={styles.leadStatVal}>{inspectingEmp.leads.totalReceived}</Text>
                        <Text style={styles.leadStatLbl}>Got &amp; Distributed →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(251,191,36,0.4)' }]} onPress={() => { setPreviewLeadCategory('CONNECTED'); setLeadPreviewModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#fbbf24' }]}>{inspectingEmp.leads.connected}</Text>
                        <Text style={styles.leadStatLbl}>Connected →</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inspectorSectionTitle}>⚙️ Operations &amp; Administrative Controls</Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity style={styles.opControlBtn} onPress={() => { setInspectingEmp(null); navigation.navigate('Attendance'); }}>
                        <Text style={styles.opControlBtnText}>⏱️ Attendance Portal (View {inspectingEmp.name}) →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]} onPress={() => setLeaveModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Note) →</Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1 }]} onPress={handleToggleLockScreen}>
                          <Text style={styles.opControlBtnText}>{inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]} onPress={() => setDeleteModalOpen(true)}>
                          <Text style={[styles.opControlBtnText, { color: '#fca5a5' }]}>🗑️ Delete (10 Days)</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' }]} onPress={() => setShareRolesModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#a5b4fc' }]}>📜 Share Roles &amp; Responsibilities Report →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── 3. MANAGER INSPECTOR SCREEN ─────────────────────────────────────── */}
                {inspectingEmp.role === 'MANAGER' && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.inspectorSectionTitle}>👥 Department Staff Assigned Under {inspectingEmp.name}</Text>
                    <View style={styles.subBox}>
                      {inspectingEmp.subordinates.map(sub => (
                        <View key={sub.id} style={styles.subRow}>
                          <Text style={styles.subName}>{sub.name} ({sub.role.replace('_', ' ')})</Text>
                          <Text style={styles.subMeta}>💰 {sub.revenue} Pipeline • 🎯 {sub.leads} Leads</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.inspectorSectionTitle}>📊 Department Pipeline Lead Audit</Text>
                    <View style={styles.grid2Col}>
                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(99,102,241,0.4)' }]} onPress={() => { setPreviewLeadCategory('TOTAL'); setLeadPreviewModalOpen(true); }}>
                        <Text style={styles.leadStatVal}>{inspectingEmp.leads.totalReceived}</Text>
                        <Text style={styles.leadStatLbl}>Total Dept Leads →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(52,211,153,0.4)' }]} onPress={() => { setPreviewLeadCategory('WON'); setLeadPreviewModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#34d399' }]}>{inspectingEmp.leads.won}</Text>
                        <Text style={styles.leadStatLbl}>Won Deals →</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inspectorSectionTitle}>⚙️ Operations &amp; Administrative Controls</Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity style={styles.opControlBtn} onPress={() => { setInspectingEmp(null); navigation.navigate('Attendance'); }}>
                        <Text style={styles.opControlBtnText}>⏱️ Attendance Portal (View {inspectingEmp.name}) →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' }]} onPress={() => setLeaveModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#fbbf24' }]}>📅 Pending Leave Request (Inspect &amp; Note) →</Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1 }]} onPress={handleToggleLockScreen}>
                          <Text style={styles.opControlBtnText}>{inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]} onPress={() => setDeleteModalOpen(true)}>
                          <Text style={[styles.opControlBtnText, { color: '#fca5a5' }]}>🗑️ Delete (10 Days)</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' }]} onPress={() => setShareRolesModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#a5b4fc' }]}>📜 Share Roles &amp; Responsibilities Report →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── 4. HR DETAILS INSPECTOR SCREEN ──────────────────────────────────── */}
                {inspectingEmp.role === 'HR' && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.inspectorSectionTitle}>📋 HR Action Controls</Text>
                    <View style={styles.grid2Col}>
                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(56,189,248,0.4)' }]} onPress={() => setLeaveModalOpen(true)}>
                        <Text style={[styles.leadStatVal, { color: '#38bdf8' }]}>{inspectingEmp.hrMetrics?.pendingLeavesCount || 3}</Text>
                        <Text style={styles.leadStatLbl}>Pending Leave Approve →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.leadStatBtn, { borderColor: 'rgba(52,211,153,0.4)' }]} onPress={() => { setHrTelemetryCategory('RESOLVED'); setHrTelemetryModalOpen(true); }}>
                        <Text style={[styles.leadStatVal, { color: '#34d399' }]}>{inspectingEmp.hrMetrics?.queriesResolvedCount || 42}</Text>
                        <Text style={styles.leadStatLbl}>Queries Resolved →</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inspectorSectionTitle}>👥 Recruitment &amp; Offboarding Telemetry</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }]} onPress={() => { setHrTelemetryCategory('HIRED'); setHrTelemetryModalOpen(true); }}>
                        <Text style={[styles.opControlBtnText, { color: '#34d399' }]}>🟢 Hired ({inspectingEmp.hrMetrics?.totalHiredCount || 12}) →</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => { setHrTelemetryCategory('FIRED'); setHrTelemetryModalOpen(true); }}>
                        <Text style={[styles.opControlBtnText, { color: '#fca5a5' }]}>🔴 Offboarded ({inspectingEmp.hrMetrics?.totalFiredCount || 2}) →</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inspectorSectionTitle}>⚙️ Operations &amp; Administrative Controls</Text>
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1 }]} onPress={handleToggleLockScreen}>
                          <Text style={styles.opControlBtnText}>{inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]} onPress={() => setDeleteModalOpen(true)}>
                          <Text style={[styles.opControlBtnText, { color: '#fca5a5' }]}>🗑️ Delete (10 Days)</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={[styles.opControlBtn, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' }]} onPress={() => setShareRolesModalOpen(true)}>
                        <Text style={[styles.opControlBtnText, { color: '#a5b4fc' }]}>📜 Share HR Governance &amp; Policy Sheet →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── 5. BOTTOM SHARED BUTTONS FOR ALL EMPLOYEES & ROLES ──────────────── */}
                <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 8 }}>
                  <Text style={styles.inspectorSectionTitle}>📑 Documents &amp; Banking Telemetry (Bottom)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.4)' }]}
                      onPress={() => setViewDocsModalOpen(true)}
                    >
                      <Text style={[styles.opControlBtnText, { color: '#38bdf8' }]}>📄 View Documents →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.opControlBtn, { flex: 1, backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' }]}
                      onPress={() => setViewBankModalOpen(true)}
                    >
                      <Text style={[styles.opControlBtnText, { color: '#34d399' }]}>💳 View Bank Details →</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </ScrollView>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInspectingEmp(null)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 12 }}>Close Inspector</Text>
              </TouchableOpacity>

            </View>
          )}
        </View>
      </Modal>

      {/* ── MODAL: VIEW EMPLOYEE DOCUMENTS (BOTTOM BUTTON) ─────────────────── */}
      <Modal visible={viewDocsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>📄 {inspectingEmp?.name}'s Documents</Text>
              <TouchableOpacity onPress={() => setViewDocsModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Last updated: {inspectingEmp?.documents.lastUpdatedDate || 'Aug 01, 2026'}</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLine}>• PAN Card: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{inspectingEmp?.documents.pan}</Text></Text>
              <Text style={styles.infoLine}>• Aadhaar Document: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.documents.aadhaar}</Text></Text>
              <Text style={styles.infoLine}>• Educational Cert: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.documents.eduCert}</Text></Text>
              <Text style={styles.infoLine}>• Offer Letter: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.documents.offerLetter}</Text></Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', marginTop: 10, marginBottom: 4 }}>📜 Old Document Updates Log History:</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {(inspectingEmp?.documents.historyLogs.length ? inspectingEmp.documents.historyLogs : [{ date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' }]).map((log, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800' }}>{log.docType} ({log.date})</Text>
                  <Text style={{ fontSize: 9, color: '#38bdf8' }}>Updated to: {log.newValue}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>Old Record: {log.oldValue}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setViewDocsModalOpen(false)}>
              <Text style={styles.primaryActionBtnText}>Done Viewing Documents</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: VIEW EMPLOYEE BANK DETAILS (BOTTOM BUTTON) ──────────────── */}
      <Modal visible={viewBankModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>💳 {inspectingEmp?.name}'s Bank &amp; Payout Details</Text>
              <TouchableOpacity onPress={() => setViewBankModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Last updated: {inspectingEmp?.bankDetails.lastUpdatedDate || 'Jul 28, 2026'}</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLine}>• Bank Name: <Text style={{ color: '#34d399', fontWeight: '800' }}>{inspectingEmp?.bankDetails.bankName}</Text></Text>
              <Text style={styles.infoLine}>• Account Holder: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.bankDetails.accountHolder}</Text></Text>
              <Text style={styles.infoLine}>• Account Number: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.bankDetails.accountNo}</Text></Text>
              <Text style={styles.infoLine}>• IFSC Code: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.bankDetails.ifscCode}</Text></Text>
              <Text style={styles.infoLine}>• UPI ID: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{inspectingEmp?.bankDetails.upiId}</Text></Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', marginTop: 10, marginBottom: 4 }}>📜 Old Bank Updates Log History:</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {(inspectingEmp?.bankDetails.historyLogs.length ? inspectingEmp.bankDetails.historyLogs : [{ date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' }]).map((log, i) => (
                <View key={i} style={styles.historyRow}>
                  <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800' }}>{log.bankName} ({log.date})</Text>
                  <Text style={{ fontSize: 9, color: '#34d399' }}>Account: {log.accountNo}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setViewBankModalOpen(false)}>
              <Text style={styles.primaryActionBtnText}>Done Viewing Bank Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ROLE UPGRADE MODAL ─────────────────────────────────────────── */}
      <Modal visible={roleUpgradeModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <Text style={styles.modalTitle}>⚡ Upgrade Staff Role</Text>
            <Text style={styles.modalSub}>Select new role for {inspectingEmp?.name}:</Text>

            {['SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleOption, inspectingEmp?.role === r && styles.roleOptionActive]}
                onPress={() => handleUpgradeRole(r as any)}
              >
                <Text style={styles.roleOptionText}>{r.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeSubModalBtn} onPress={() => setRoleUpgradeModalOpen(false)}>
              <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE SUPERVISOR MODAL ────────────────────────────────────── */}
      <Modal visible={supervisorModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <Text style={styles.modalTitle}>✏️ Change Assigned Supervisor</Text>
            <Text style={styles.modalSub}>Re-assign supervisor for {inspectingEmp?.name}:</Text>

            {['Tenant Admin (Vikram Singh)', 'Manager A (Amit Shah)', 'Manager B (Neha Joshi)', 'Priya Sharma (Team Leader)'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.roleOption, inspectingEmp?.assignedManager === m && styles.roleOptionActive]}
                onPress={() => handleChangeSupervisor(m)}
              >
                <Text style={styles.roleOptionText}>{m}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeSubModalBtn} onPress={() => setSupervisorModalOpen(false)}>
              <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── LEAD PREVIEW MODAL ─────────────────────────────────────────── */}
      <Modal visible={leadPreviewModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>📦 {previewLeadCategory} Leads Collection</Text>
              <TouchableOpacity onPress={() => setLeadPreviewModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Viewing lead records for {inspectingEmp?.name}:</Text>

            <ScrollView style={{ maxHeight: 220 }}>
              {[
                { name: 'Acme Corp (Vikram)', status: 'IN NEGOTIATION', value: '$14,200' },
                { name: 'LogiTech Systems', status: 'CONTACTED', value: '$8,500' },
                { name: 'Sunita Logistics', status: 'WON', value: '$28,000' },
              ].map((ld, i) => (
                <View key={i} style={styles.leadCardRow}>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{ld.name}</Text>
                    <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '700' }}>Value: {ld.value}</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{ld.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                setLeadPreviewModalOpen(false);
                setInspectingEmp(null);
                navigation.navigate('Leads');
              }}
            >
              <Text style={styles.primaryActionBtnText}>Open Full Lead Collection Page →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PENDING LEAVE REQUEST INSPECTION MODAL ─────────────────────── */}
      <Modal visible={leaveModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <Text style={styles.modalTitle}>📅 Pending Leave Application Inspection</Text>
            <Text style={styles.modalSub}>Applicant: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.name}</Text></Text>

            <View style={styles.leaveDetailsBox}>
              <Text style={{ fontSize: 11, color: '#f8fafc', fontWeight: '800' }}>Type: Medical Sick Leave (2 Days)</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Dates: Aug 25 - Aug 26, 2026</Text>
              <Text style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4, fontStyle: 'italic' }}>Reason: "High fever and medical doctor checkup appointment."</Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', marginTop: 10, marginBottom: 4 }}>Inspector Decision Note (Required) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter approval note or decline remarks..."
              placeholderTextColor="#64748b"
              value={leaveNote}
              onChangeText={setLeaveNote}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.primaryActionBtn, { flex: 1, backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }]} onPress={() => handleApproveOrDeclineLeave(false)}>
                <Text style={[styles.primaryActionBtnText, { color: '#fca5a5' }]}>🔴 Decline with Note</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryActionBtn, { flex: 1, backgroundColor: '#10b981' }]} onPress={() => handleApproveOrDeclineLeave(true)}>
                <Text style={styles.primaryActionBtnText}>🟢 Approve Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 10-DAY GRACE PERIOD DELETION ENGINE MODAL ──────────────────── */}
      <Modal visible={deleteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <Text style={styles.modalTitle}>🗑️ Account Deletion (10-Day Grace Period)</Text>
            <Text style={styles.modalSub}>Target Staff: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{inspectingEmp?.name}</Text></Text>

            {inspectingEmp?.deletionScheduledAt ? (
              <View style={{ gap: 10 }}>
                <View style={styles.graceBox}>
                  <Text style={styles.graceText}>⚠️ Account is currently in 10-Day Grace Deletion Period. Account is locked and scheduled for purge.</Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Reason / Revert Note *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason to revert account deletion..."
                  placeholderTextColor="#64748b"
                  value={revertNote}
                  onChangeText={setRevertNote}
                />

                <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#10b981' }]} onPress={handleRequestRevertDeletion}>
                  <Text style={styles.primaryActionBtnText}>↺ Request to Revert Account Deletion →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, color: '#cbd5e1' }}>
                  Initiating deletion will lock screen immediately and notify user that data will be permanently purged in 10 days.
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.primaryActionBtn, { flex: 1, backgroundColor: '#1e293b' }]} onPress={() => setDeleteModalOpen(false)}>
                    <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.primaryActionBtn, { flex: 1, backgroundColor: '#ef4444' }]} onPress={handleInitiate10DayDeletion}>
                    <Text style={styles.primaryActionBtnText}>Start 10-Day Purge →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── SHARE ROLES & RESPONSIBILITIES REPORT MODAL ─────────────────── */}
      <Modal visible={shareRolesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>📜 Roles &amp; Responsibilities Report</Text>
              <TouchableOpacity onPress={() => setShareRolesModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportBox}>
              <Text style={styles.reportTitle}>OFFICIAL ROLES &amp; RESPONSIBILITIES SHEET</Text>
              <Text style={styles.reportLine}>Staff: {inspectingEmp?.name} ({inspectingEmp?.role.replace('_', ' ')})</Text>
              <Text style={styles.reportLine}>Department Supervisor: {inspectingEmp?.assignedManager}</Text>
              <Text style={styles.reportLine}>Active Target Progress: 88.4% Achieved</Text>
              <Text style={styles.reportLine}>SLA Response Compliance: 98.2%</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                const text = `📜 *Official Roles & Responsibilities Sheet*\n\n👤 *Staff:* ${inspectingEmp?.name} (${inspectingEmp?.role})\n🏢 *Supervisor:* ${inspectingEmp?.assignedManager}\n🎯 *Target Progress:* 88.4%\n⏱️ *SLA Response:* 98.2%`;
                Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
                  Alert.alert('Report Exported', 'Report copied and ready for sharing!');
                });
                setShareRolesModalOpen(false);
              }}
            >
              <Text style={styles.primaryActionBtnText}>Share Report via WhatsApp / PDF →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HR TELEMETRY MODAL ─────────────────────────────────────────── */}
      <Modal visible={hrTelemetryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.subModalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>📊 HR Telemetry — {hrTelemetryCategory}</Text>
              <TouchableOpacity onPress={() => setHrTelemetryModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportBox}>
              <Text style={styles.reportLine}>• Category: {hrTelemetryCategory}</Text>
              <Text style={styles.reportLine}>• Managed by: {inspectingEmp?.name} (HR Operations)</Text>
              <Text style={styles.reportLine}>• Status: Verified and logged in CRM database</Text>
            </View>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setHrTelemetryModalOpen(false)}>
              <Text style={styles.primaryActionBtnText}>Close HR Audit →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 24 },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#94a3b8' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },

  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 16 },
  empRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },

  empName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  supervisorText: { fontSize: 11, color: '#94a3b8', marginTop: 3 },

  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 8, fontWeight: '800' },

  lockedBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lockedBadgeText: { color: '#fca5a5', fontSize: 8, fontWeight: '900' },

  suspendedBadge: { backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspendedBadgeText: { color: '#fcd34d', fontSize: 8, fontWeight: '900' },

  inspectBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  inspectBtnText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#818cf8' },
  modalName: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  modalEmail: { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  actionChipBtn: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)' },
  actionChipBtnText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },

  inspectorSectionTitle: { fontSize: 12, fontWeight: '800', color: '#f8fafc', marginTop: 8, marginBottom: 4 },
  grid2Col: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leadStatBtn: { width: '48%', backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  leadStatVal: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  leadStatLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontWeight: '700' },

  opControlBtn: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  opControlBtnText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  subBox: { backgroundColor: '#020617', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#1e293b', gap: 6 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  subName: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  subMeta: { fontSize: 10, color: '#818cf8', fontWeight: '700' },

  closeModalBtn: { marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center' },

  subModalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginBottom: 10 },

  roleOption: { backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },
  roleOptionActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  roleOptionText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  closeSubModalBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },

  leadCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6 },
  statusPill: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontSize: 9, fontWeight: '800', color: '#818cf8' },
  primaryActionBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryActionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },

  leaveDetailsBox: { backgroundColor: '#020617', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  textInput: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', padding: 10, fontSize: 11, marginTop: 4 },
  graceBox: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, padding: 10 },
  graceText: { fontSize: 10, color: '#fcd34d', fontWeight: '800', lineHeight: 14 },
  reportBox: { backgroundColor: '#020617', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1e293b', marginVertical: 8, gap: 4 },
  reportTitle: { fontSize: 11, fontWeight: '900', color: '#818cf8', marginBottom: 4 },
  reportLine: { fontSize: 10, color: '#cbd5e1' },
  infoCard: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b', gap: 4 },
  infoLine: { fontSize: 10, color: '#cbd5e1' },
  historyRow: { backgroundColor: '#020617', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', marginBottom: 4 },
});
