/**
 * EmployeesScreen.tsx — DAS CRM Android
 * Structure & Staff Directory with Assigned / Unassigned segmented tabs.
 *
 * ASSIGNED  → Users who have a CRM role (MANAGER, TEAM_LEADER, HR, SALES_EXEC).
 *             Full Inspect & Control routing to dedicated role screens.
 * UNASSIGNED → Users who have only registered in the system but have no role
 *              allocated yet. Admin can assign a role directly from this screen.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

import SalesExecControlScreen from './SalesExecControlScreen';
import TeamLeaderControlScreen from './TeamLeaderControlScreen';
import ManagerControlScreen from './ManagerControlScreen';
import HrControlScreen from './HrControlScreen';

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

/** Users who registered but have NOT yet been assigned a CRM role */
interface UnassignedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  deviceInfo: string;
}

const AVAILABLE_ROLES: { key: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC'; label: string; color: string }[] = [
  { key: 'MANAGER', label: 'Manager', color: '#c084fc' },
  { key: 'TEAM_LEADER', label: 'Team Leader', color: '#fbbf24' },
  { key: 'HR', label: 'HR', color: '#38bdf8' },
  { key: 'SALES_EXEC', label: 'Sales Executive', color: '#34d399' },
];

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, subscription } = useAuthStore();
  const userRole: UserRole = normalizeRoleStr(currentUser.role);

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
        historyLogs: [{ date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' }],
      },
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolder: 'Amit Shah',
        accountNo: '50100987654321',
        ifscCode: 'HDFC0001234',
        upiId: 'amit@hdfcbank',
        lastUpdatedDate: 'Jul 28, 2026',
        historyLogs: [{ date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' }],
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
      documents: { pan: 'FGHIJ5678K', aadhaar: 'AADHAAR_5432_VERIFIED.pdf', eduCert: 'DEGREE_BTECH_2023.pdf', offerLetter: 'OFFER_LETTER_MGR_2026.pdf', lastUpdatedDate: 'Jul 15, 2026', historyLogs: [] },
      bankDetails: { bankName: 'ICICI Bank', accountHolder: 'Neha Joshi', accountNo: '33440099887766', ifscCode: 'ICIC0005678', upiId: 'neha@icici', lastUpdatedDate: 'Jun 10, 2026', historyLogs: [] },
      leads: { totalReceived: 120, connected: 70, inNegotiation: 28, meetingScheduled: 12, won: 10, totalDistributed: 95, distributionBreakdown: [] },
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
      documents: { pan: 'KLMNO9012P', aadhaar: 'AADHAAR_1122_VERIFIED.pdf', eduCert: 'DEGREE_HR_2021.pdf', offerLetter: 'OFFER_LETTER_HR_2025.pdf', lastUpdatedDate: 'Aug 10, 2026', historyLogs: [] },
      bankDetails: { bankName: 'Axis Bank', accountHolder: 'Sunita Verma', accountNo: '91802003344556', ifscCode: 'UTIB0009988', upiId: 'sunita@axis', lastUpdatedDate: 'May 02, 2026', historyLogs: [] },
      leads: { totalReceived: 25, connected: 15, inNegotiation: 5, meetingScheduled: 3, won: 2, totalDistributed: 20, distributionBreakdown: [] },
      attendance: { presentDays: 20, absentDays: 1, leaveDays: 2, todayInTime: '09:30 AM', todayOutTime: '06:15 PM', todayGps: '28.440743, 77.531117' },
      subordinates: [],
      hrMetrics: { pendingLeavesCount: 3, queriesResolvedCount: 42, reportsGeneratedCount: 18, totalHiredCount: 12, totalFiredCount: 2, interviewsConductedCount: 28, salaryPendingCount: 2, salaryReportsCount: 8 },
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
      documents: { pan: 'PQRST3456U', aadhaar: 'AADHAAR_3344_VERIFIED.pdf', eduCert: 'DEGREE_BBA_2023.pdf', offerLetter: 'OFFER_LETTER_TL_2026.pdf', lastUpdatedDate: 'Jul 20, 2026', historyLogs: [] },
      bankDetails: { bankName: 'Kotak Bank', accountHolder: 'Priya Sharma', accountNo: '66778899001122', ifscCode: 'KKBK0004455', upiId: 'priya@kotak', lastUpdatedDate: 'Jun 18, 2026', historyLogs: [] },
      leads: { totalReceived: 45, connected: 28, inNegotiation: 10, meetingScheduled: 5, won: 2, totalDistributed: 40, distributionBreakdown: [] },
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
      documents: { pan: 'VWXYZ7890A', aadhaar: 'AADHAAR_5566_VERIFIED.pdf', eduCert: 'DEGREE_BSC_2024.pdf', offerLetter: 'OFFER_LETTER_EXEC_2026.pdf', lastUpdatedDate: 'Aug 05, 2026', historyLogs: [] },
      bankDetails: { bankName: 'SBI Bank', accountHolder: 'Rohan Kumar', accountNo: '20201122334455', ifscCode: 'SBIN0007788', upiId: 'rohan@sbi', lastUpdatedDate: 'Jul 12, 2026', historyLogs: [] },
      leads: { totalReceived: 25, connected: 18, inNegotiation: 4, meetingScheduled: 2, won: 1, totalDistributed: 0, distributionBreakdown: [] },
      attendance: { presentDays: 22, absentDays: 0, leaveDays: 0, todayInTime: '09:00 AM', todayOutTime: '06:00 PM', todayGps: '28.440743, 77.531117' },
      subordinates: [],
    },
    {
      id: 'emp-6',
      name: 'Ananya Roy',
      email: 'ananya.roy@acme.com',
      phone: '+91 97222 33445',
      role: 'SALES_EXEC',
      assignedManager: 'Priya Sharma (Team Leader)',
      status: 'OFFLINE',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      documents: { pan: 'BCDEF1234G', aadhaar: 'AADHAAR_7788_VERIFIED.pdf', eduCert: 'DEGREE_BCOM_2023.pdf', offerLetter: 'OFFER_LETTER_EXEC_2025.pdf', lastUpdatedDate: 'Jun 30, 2026', historyLogs: [] },
      bankDetails: { bankName: 'Punjab National Bank', accountHolder: 'Ananya Roy', accountNo: '11223344556677', ifscCode: 'PUNB0001122', upiId: 'ananya@pnb', lastUpdatedDate: 'May 14, 2026', historyLogs: [] },
      leads: { totalReceived: 15, connected: 9, inNegotiation: 3, meetingScheduled: 2, won: 1, totalDistributed: 0, distributionBreakdown: [] },
      attendance: { presentDays: 19, absentDays: 2, leaveDays: 1, todayInTime: '09:45 AM', todayOutTime: null, todayGps: '28.440743, 77.531117' },
      subordinates: [],
    },
  ]);

  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'UNASSIGNED'>('ASSIGNED');
  const [assignRoleTarget, setAssignRoleTarget] = useState<UnassignedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | null>(null);

  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([
    { id: 'ua-1', name: 'Deepak Malhotra', email: 'deepak.malhotra@gmail.com', phone: '+91 98444 11223', registeredAt: 'Today, 07:42 AM', deviceInfo: 'Android 14 · Samsung Galaxy A55' },
    { id: 'ua-2', name: 'Simran Kaur', email: 'simran.k@hotmail.com', phone: '+91 99100 55678', registeredAt: 'Today, 09:15 AM', deviceInfo: 'Android 13 · Redmi Note 12' },
    { id: 'ua-3', name: 'Yusuf Ansari', email: 'yusuf.ansari@yahoo.com', phone: '+91 97345 88902', registeredAt: 'Yesterday, 06:30 PM', deviceInfo: 'Android 14 · OnePlus 12R' },
    { id: 'ua-4', name: 'Meera Pillai', email: 'meera.pillai@outlook.com', phone: '+91 98765 00112', registeredAt: '02 Sep 2026, 11:00 AM', deviceInfo: 'iOS 17 · iPhone 14' },
    { id: 'ua-5', name: 'Kiran Nair', email: 'kiran.nair@gmail.com', phone: '+91 96543 21099', registeredAt: '01 Sep 2026, 04:22 PM', deviceInfo: 'Android 12 · Realme 11' },
  ]);

  const totalQuota = subscription?.userSeatsAllocated ?? 6;
  const activeCount = employeesList.length;

  const getCountPillStyle = () => {
    if (totalQuota > 0 && activeCount > totalQuota) {
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' };
    }
    if (totalQuota > 0 && activeCount === totalQuota) {
      return { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' };
    }
    return { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', text: '#34d399' };
  };

  const pillStyle = getCountPillStyle();

  const handleAssignRole = () => {
    if (!assignRoleTarget || !selectedRole) return;

    if (totalQuota > 0 && activeCount >= totalQuota) {
      Alert.alert(
        'Quota Exceeded',
        `Your subscription plan limit is ${totalQuota} active users. You cannot assign more roles until you upgrade your plan.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const roleConf = AVAILABLE_ROLES.find(r => r.key === selectedRole);
    Alert.alert(
      'Role Assigned',
      `${assignRoleTarget.name} has been assigned as ${roleConf?.label}. They will appear in the Assigned list shortly.`,
      [{ text: 'OK' }]
    );
    setUnassignedUsers(prev => prev.filter(u => u.id !== assignRoleTarget.id));
    setAssignRoleTarget(null);
    setSelectedRole(null);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (inspectingEmp !== null) {
        setInspectingEmp(null);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [inspectingEmp]);

  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  const getRoleBadgeStyle = (role: EmployeeProfile['role']) => {
    switch (role) {
      case 'MANAGER': return { bg: 'rgba(168,85,247,0.2)', text: '#c084fc', border: '#a855f7', label: 'MANAGER' };
      case 'HR': return { bg: 'rgba(56,189,248,0.2)', text: '#38bdf8', border: '#38bdf8', label: 'HR' };
      case 'TEAM_LEADER': return { bg: 'rgba(251,191,36,0.2)', text: '#fbbf24', border: '#fbbf24', label: 'TEAM LEADER' };
      default: return { bg: 'rgba(52,211,153,0.2)', text: '#34d399', border: '#34d399', label: 'SALES EXEC' };
    }
  };

  const handleUpdateEmployee = (updated: EmployeeProfile) => {
    setEmployeesList(prev => prev.map(e => e.id === updated.id ? updated : e));
    setInspectingEmp(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔀 DEDICATED ROLE CONTROL SCREEN ROUTING
  // ─────────────────────────────────────────────────────────────────────────────
  if (inspectingEmp !== null) {
    if (inspectingEmp.role === 'SALES_EXEC') {
      return <SalesExecControlScreen employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'TEAM_LEADER') {
      return <TeamLeaderControlScreen employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'MANAGER') {
      return <ManagerControlScreen employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'HR') {
      return <HrControlScreen employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 👥 MAIN STAFF DIRECTORY — ASSIGNED / UNASSIGNED TABS
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: 0 }]}>

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>👥 Employee Structure</Text>
          <Text style={styles.pageSub}>Manage staff roles, access & onboarding</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: pillStyle.bg, borderColor: pillStyle.border }]}>
          <Text style={[styles.countPillText, { color: pillStyle.text }]}>
            {activeCount} / {totalQuota > 0 ? totalQuota : '∞'} Active
          </Text>
        </View>
      </View>

      {/* ── Segmented Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ASSIGNED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ASSIGNED')}
          activeOpacity={0.8}
        >
          <View style={[styles.tabDot, { backgroundColor: activeTab === 'ASSIGNED' ? '#34d399' : '#334155' }]} />
          <Text style={[styles.tabBtnText, activeTab === 'ASSIGNED' && styles.tabBtnTextActive]}>
            Assigned ({employeesList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'UNASSIGNED' && styles.tabBtnUnassignedActive]}
          onPress={() => setActiveTab('UNASSIGNED')}
          activeOpacity={0.8}
        >
          {unassignedUsers.length > 0 && (
            <View style={styles.unassignedBadge}>
              <Text style={styles.unassignedBadgeText}>{unassignedUsers.length}</Text>
            </View>
          )}
          <Text style={[styles.tabBtnText, activeTab === 'UNASSIGNED' && styles.tabBtnTextUnassigned]}>
            Unassigned ({unassignedUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Assigned Tab Content ── */}
      {activeTab === 'ASSIGNED' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabInfoBanner}>
            <Text style={styles.tabInfoText}>
              ✅ These users have an active CRM role. Tap <Text style={{ color: '#818cf8' }}>Inspect & Control</Text> to manage their profile, documents, and performance.
            </Text>
          </View>

          <View style={styles.cardBox}>
            {employeesList.map((emp, index) => {
              const roleStyle = getRoleBadgeStyle(emp.role);
              return (
                <View
                  key={emp.id}
                  style={[styles.empRow, index !== employeesList.length - 1 && styles.borderBottom]}
                >
                  {/* Avatar Initials */}
                  <View style={[styles.avatarCircle, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                    <Text style={[styles.avatarInitials, { color: roleStyle.text }]}>
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                    <View style={[
                      styles.statusDot,
                      emp.status === 'ONLINE' ? { backgroundColor: '#34d399' }
                      : emp.status === 'IN_CALL' ? { backgroundColor: '#fbbf24' }
                      : { backgroundColor: '#64748b' }
                    ]} />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.empName}>{emp.name}</Text>
                      <View style={[styles.roleTag, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                        <Text style={[styles.roleTagText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.supervisorText}>
                      {emp.email}
                    </Text>
                    <Text style={styles.supervisorText}>
                      Under: <Text style={{ color: '#cbd5e1', fontWeight: '700' }}>{emp.assignedManager}</Text>
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.inspectBtn} onPress={() => setInspectingEmp(emp)}>
                    <Text style={styles.inspectBtnText}>Inspect →</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── Unassigned Tab Content ── */}
      {activeTab === 'UNASSIGNED' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.tabInfoBanner, { borderColor: 'rgba(251,191,36,0.35)', backgroundColor: 'rgba(251,191,36,0.07)' }]}>
            <Text style={[styles.tabInfoText, { color: '#fde68a' }]}>
              ⚠️ These users have registered in DAS CRM but have <Text style={{ fontWeight: '900' }}>no role assigned yet</Text>. Assign a role to activate their workspace access.
            </Text>
          </View>

          {unassignedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎉</Text>
              <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
              <Text style={styles.emptyStateSub}>No pending role assignments. All registered users have been activated.</Text>
            </View>
          ) : (
            <View style={styles.cardBox}>
              {unassignedUsers.map((user, index) => (
                <View
                  key={user.id}
                  style={[styles.empRow, index !== unassignedUsers.length - 1 && styles.borderBottom]}
                >
                  {/* Avatar */}
                  <View style={[styles.avatarCircle, { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)' }]}>
                    <Text style={[styles.avatarInitials, { color: '#fbbf24' }]}>
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: '#64748b' }]} />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.empName}>{user.name}</Text>
                    <Text style={styles.supervisorText}>{user.email}</Text>
                    <Text style={styles.supervisorText}>{user.phone}</Text>
                    <View style={styles.registeredBadge}>
                      <Text style={styles.registeredBadgeText}>Registered: {user.registeredAt}</Text>
                    </View>
                    <Text style={[styles.supervisorText, { marginTop: 2 }]}>{user.deviceInfo}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => { setAssignRoleTarget(user); setSelectedRole(null); }}
                  >
                    <Text style={styles.assignBtnText}>Assign Role</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Assign Role Modal ── */}
      <Modal visible={!!assignRoleTarget} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {assignRoleTarget && (
            <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              {/* Modal Header */}
              <View style={styles.modalHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Assign Role</Text>
                  <Text style={styles.modalSub}>{assignRoleTarget.name} · {assignRoleTarget.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => { setAssignRoleTarget(null); setSelectedRole(null); }}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLbl}>SELECT ROLE</Text>

              {AVAILABLE_ROLES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.roleOption,
                    selectedRole === r.key && { borderColor: r.color, backgroundColor: `${r.color}18` },
                  ]}
                  onPress={() => setSelectedRole(r.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleOptionDot, { backgroundColor: selectedRole === r.key ? r.color : '#334155' }]} />
                  <Text style={[styles.roleOptionText, selectedRole === r.key && { color: r.color }]}>
                    {r.label}
                  </Text>
                  {selectedRole === r.key && (
                    <Text style={[styles.roleOptionCheck, { color: r.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.confirmBtn, !selectedRole && { opacity: 0.35 }]}
                disabled={!selectedRole}
                onPress={handleAssignRole}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>Confirm & Activate Access →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center' },

  // Page Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  pageTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff', letterSpacing: 0.3 },
  pageSub: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  countPill: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  countPillText: { fontSize: 11, fontWeight: '900', color: '#34d399' },

  // Tab Bar
  tabBar: { flexDirection: 'row', gap: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0c1322' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.05)' },
  tabBtnUnassignedActive: { borderBottomColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.05)' },
  tabDot: { width: 7, height: 7, borderRadius: 4 },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  tabBtnTextActive: { color: '#34d399' },
  tabBtnTextUnassigned: { color: '#fbbf24' },
  unassignedBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unassignedBadgeText: { fontSize: 9, fontWeight: '900', color: '#ffffff' },

  // Info Banner
  tabInfoBanner: { width: '100%', maxWidth: 600, backgroundColor: 'rgba(52,211,153,0.06)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', borderRadius: 12, padding: 12, marginBottom: 14 },
  tabInfoText: { fontSize: 11, color: '#a7f3d0', fontWeight: '500', lineHeight: 16 },

  // Cards
  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0d1527', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.25)', padding: 14, marginBottom: 16, elevation: 5 },
  empRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },

  // Avatar
  avatarCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarInitials: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  statusDot: { position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: '#090d16' },

  // Employee info
  empName: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  supervisorText: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '500' },
  roleTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1.5 },
  roleTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },

  // Registered badge (unassigned)
  registeredBadge: { backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3 },
  registeredBadgeText: { fontSize: 8, fontWeight: '900', color: '#fbbf24' },

  // Buttons
  inspectBtn: { backgroundColor: 'rgba(99, 102, 241, 0.18)', borderWidth: 1.5, borderColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 2 },
  inspectBtnText: { fontSize: 10, fontWeight: '900', color: '#a5b4fc' },
  assignBtn: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1.5, borderColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 2 },
  assignBtnText: { fontSize: 10, fontWeight: '900', color: '#fbbf24' },

  // Empty State
  emptyState: { width: '100%', maxWidth: 600, alignItems: 'center', paddingVertical: 60 },
  emptyStateIcon: { fontSize: 42, marginBottom: 12 },
  emptyStateTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff', marginBottom: 6 },
  emptyStateSub: { fontSize: 12, color: '#64748b', fontWeight: '500', textAlign: 'center', lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 20 },
  modalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  modalSub: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '900' },
  modalSectionLbl: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  // Role Options
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 13, marginBottom: 9 },
  roleOptionDot: { width: 10, height: 10, borderRadius: 5 },
  roleOptionText: { flex: 1, fontSize: 13, fontWeight: '800', color: '#94a3b8' },
  roleOptionCheck: { fontSize: 16, fontWeight: '900' },

  // Confirm Button
  confirmBtn: { backgroundColor: 'rgba(99,102,241,0.22)', borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.55)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  confirmBtnText: { color: '#818cf8', fontSize: 13, fontWeight: '900' },
});
