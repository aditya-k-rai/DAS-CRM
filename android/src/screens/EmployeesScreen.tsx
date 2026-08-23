/**
 * EmployeesScreen.tsx — DAS CRM Android
 * Router & Directory Screen for Employees, Team Leaders, Department Managers & HR.
 * Lists all staff members with Name, Role Badge, Assigned Under, and [Inspect & Control →] button.
 * Routes to 4 dedicated full-screen role control screens:
 * 1. SalesExecControlScreen
 * 2. TeamLeaderControlScreen
 * 3. ManagerControlScreen
 * 4. HrControlScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
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

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
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
  // 👥 MAIN STAFF DIRECTORY LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Organization Hierarchy &amp; Profile Control</Text>
          <Text style={styles.headerSubtitle}>
            Tap [Inspect &amp; Control →] on any staff card to open their dedicated role screen.
          </Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>All Staff Members ({employeesList.length})</Text>

        <View style={styles.cardBox}>
          {employeesList.map((emp, index) => {
            const roleStyle = getRoleBadgeStyle(emp.role);
            return (
              <View key={emp.id} style={[styles.empRow, index !== employeesList.length - 1 && styles.borderBottom]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <View style={[styles.roleTag, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                      <Text style={[styles.roleTagText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.supervisorText}>👤 Assigned under: <Text style={{ color: '#cbd5e1', fontWeight: '700' }}>{emp.assignedManager}</Text></Text>
                </View>

                <TouchableOpacity style={styles.inspectBtn} onPress={() => setInspectingEmp(emp)}>
                  <Text style={styles.inspectBtnText}>Inspect &amp; Control →</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#94a3b8' },

  sectionHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },

  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 16 },
  empRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },

  empName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  supervisorText: { fontSize: 11, color: '#94a3b8', marginTop: 3 },

  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleTagText: { fontSize: 8, fontWeight: '800' },

  inspectBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  inspectBtnText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },
});
