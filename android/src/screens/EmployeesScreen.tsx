/**
 * EmployeesScreen.tsx — DAS CRM Android
 * In-Depth Employee, Manager, Team Leader & HR Profile Control Center.
 * Features:
 *  1. In-Depth Profile Inspector (Identity, Role, Supervisor, Contact)
 *  2. Detailed Attendance Audit (Punch In/Out time, GPS link, Selfie photo, Monthly stats)
 *  3. Under-Employees (Subordinates list per Manager / Team Leader)
 *  4. Lead Allocation & Distribution Telemetry (Manager restricted to own team only)
 *  5. Leaving Employee Lead & Work Handover Engine (Admin Exclusive: Transfer leads & active work status to any employee/manager)
 *  6. Manager Authority Re-Assignment (Change employees of Manager A and allocate to Manager B)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC';
  assignedManager: string; // e.g. "Tenant Admin (Vikram Singh)", "Manager A (Amit Shah)"
  status: 'ONLINE' | 'IN_CALL' | 'OFFLINE';
  avatarUrl: string;
  isLocked?: boolean;
  deletionScheduledAt?: string | null;

  // Attendance Telemetry
  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
    selfieUrl: string;
  };

  // Lead Distribution Telemetry
  leads: {
    totalReceived: number;
    totalDistributed: number;
    distributionBreakdown: { targetName: string; targetRole: string; count: number }[];
  };

  // Subordinates list
  subordinates: { id: string; name: string; role: string; calls: number; revenue: string }[];
}

export default function EmployeesScreen() {
  const { currentUser } = useAuthStore();
  const role: UserRole = normalizeRoleStr(currentUser.role);
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Manager List for Authority Re-assignment
  const MANAGERS = ['Tenant Admin (Vikram Singh)', 'Manager A (Amit Shah)', 'Manager B (Neha Joshi)'];

  // Employees Database (Includes Managers, HR, Team Leaders, and Sales Executives)
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
      attendance: {
        presentDays: 21,
        absentDays: 1,
        leaveDays: 1,
        todayInTime: '09:15 AM',
        todayOutTime: '06:30 PM',
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 140,
        totalDistributed: 110,
        distributionBreakdown: [
          { targetName: 'Priya Sharma', targetRole: 'Team Leader', count: 45 },
          { targetName: 'Karan Verma', targetRole: 'Team Leader', count: 40 },
          { targetName: 'Rohan Kumar', targetRole: 'Sales Exec', count: 25 },
        ],
      },
      subordinates: [
        { id: 'sub-1', name: 'Priya Sharma', role: 'Team Leader', calls: 184, revenue: '$38,500' },
        { id: 'sub-2', name: 'Rohan Kumar', role: 'Sales Exec', calls: 84, revenue: '$22,000' },
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
      attendance: {
        presentDays: 22,
        absentDays: 0,
        leaveDays: 1,
        todayInTime: '09:05 AM',
        todayOutTime: null,
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 120,
        totalDistributed: 95,
        distributionBreakdown: [
          { targetName: 'Sunita Verma', targetRole: 'HR Operations', count: 50 },
          { targetName: 'Ananya Roy', targetRole: 'Sales Exec', count: 45 },
        ],
      },
      subordinates: [
        { id: 'sub-4', name: 'Sunita Verma', role: 'HR', calls: 142, revenue: '$29,000' },
        { id: 'sub-5', name: 'Ananya Roy', role: 'Sales Exec', calls: 65, revenue: '$18,500' },
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
      attendance: {
        presentDays: 20,
        absentDays: 1,
        leaveDays: 2,
        todayInTime: '09:30 AM',
        todayOutTime: '06:15 PM',
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 25,
        totalDistributed: 20,
        distributionBreakdown: [{ targetName: 'HR Audit Desk', targetRole: 'HR Operations', count: 20 }],
      },
      subordinates: [],
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
      attendance: {
        presentDays: 21,
        absentDays: 1,
        leaveDays: 0,
        todayInTime: '09:10 AM',
        todayOutTime: null,
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 45,
        totalDistributed: 40,
        distributionBreakdown: [
          { targetName: 'Rohan Kumar', targetRole: 'Sales Exec', count: 25 },
          { targetName: 'Ananya Roy', targetRole: 'Sales Exec', count: 15 },
        ],
      },
      subordinates: [
        { id: 'sub-6', name: 'Rohan Kumar', role: 'Sales Exec', calls: 84, revenue: '$22,000' },
        { id: 'sub-7', name: 'Ananya Roy', role: 'Sales Exec', calls: 65, revenue: '$18,500' },
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
      attendance: {
        presentDays: 22,
        absentDays: 0,
        leaveDays: 0,
        todayInTime: '09:00 AM',
        todayOutTime: '06:00 PM',
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 35,
        totalDistributed: 0,
        distributionBreakdown: [],
      },
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
      attendance: {
        presentDays: 19,
        absentDays: 2,
        leaveDays: 1,
        todayInTime: '09:20 AM',
        todayOutTime: null,
        todayGps: '28.440743, 77.531117',
        selfieUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      },
      leads: {
        totalReceived: 28,
        totalDistributed: 0,
        distributionBreakdown: [],
      },
      subordinates: [],
    },
  ]);

  // Inspector Modal State
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfile | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'PROFILE' | 'ATTENDANCE' | 'SUBORDINATES' | 'LEADS'>('PROFILE');
  const [selectedManager, setSelectedManager] = useState('');

  // ── LEAVING EMPLOYEE WORK & LEAD HANDOVER MODAL STATE (ADMIN EXCLUSIVE) ───
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [departingEmpId, setDepartingEmpId] = useState('emp-4');
  const [recipientEmpId, setRecipientEmpId] = useState('emp-1');

  const openProfileInspector = (emp: EmployeeProfile) => {
    setInspectingEmp(emp);
    setSelectedManager(emp.assignedManager);
    setInspectorTab('PROFILE');
  };

  // 🔒 Toggle Screen Lock (Admin Only)
  const handleToggleLock = (empId: string) => {
    setEmployeesList(prev =>
      prev.map(e => {
        if (e.id === empId) {
          const newLock = !e.isLocked;
          Alert.alert(
            newLock ? '🔒 Screen Locked' : '🔓 Screen Unlocked',
            newLock
              ? `${e.name}'s app screen has been locked by Admin. Their active session is suspended.`
              : `${e.name}'s app screen has been unlocked.`
          );
          return { ...e, isLocked: newLock };
        }
        return e;
      })
    );
  };

  // 🗑️ Schedule Account Soft Delete (7-Day Grace Period)
  const handleScheduleSoftDelete = (empId: string) => {
    const emp = employeesList.find(e => e.id === empId);
    if (!emp) return;

    Alert.alert(
      '⚠️ Schedule Account Deletion (7-Day Grace)',
      `Are you sure you want to soft delete ${emp.name}? Account will be suspended immediately and permanently purged in 7 days.\n\nYou can revoke deletion anytime during these 7 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule Delete (7 Days)',
          style: 'destructive',
          onPress: () => {
            const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            setEmployeesList(prev =>
              prev.map(e => (e.id === empId ? { ...e, deletionScheduledAt: sevenDaysLater } : e))
            );
            Alert.alert(
              'Scheduled for Deletion',
              `${emp.name}'s account is scheduled for deletion in 7 days. You can revoke deletion anytime.`
            );
          },
        },
      ]
    );
  };

  // ↺ Revoke Account Deletion (Admin Only)
  const handleRevokeDelete = (empId: string) => {
    setEmployeesList(prev =>
      prev.map(e => {
        if (e.id === empId) {
          Alert.alert('✅ Deletion Revoked', `${e.name}'s account deletion has been revoked and restored to active status.`);
          return { ...e, deletionScheduledAt: null };
        }
        return e;
      })
    );
  };

  const getValidSupervisorsForRole = (empRole: string) => {
    if (empRole === 'TEAM_LEADER') {
      // TL can ONLY report under a Manager
      return ['Manager A (Amit Shah)', 'Manager B (Neha Joshi)', 'Tenant Admin (Vikram Singh)'];
    }
    if (empRole === 'SALES_EXEC') {
      // Sales Exec can ONLY report under a TL or Manager
      return [
        'Priya Sharma (Team Leader)',
        'Karan Verma (Team Leader)',
        'Manager A (Amit Shah)',
        'Manager B (Neha Joshi)',
        'Tenant Admin (Vikram Singh)',
      ];
    }
    // Default for Managers / HR
    return ['Tenant Admin (Vikram Singh)'];
  };

  const handleReassignManager = () => {
    if (!inspectingEmp) return;

    if (inspectingEmp.role === 'TEAM_LEADER') {
      const isManager = selectedManager.includes('Manager') || selectedManager.includes('Admin');
      if (!isManager) {
        Alert.alert(
          '🔒 Invalid Hierarchy Assignment',
          'Hierarchy Policy Violation: Team Leaders (TL) can ONLY report directly under a Department Manager.'
        );
        return;
      }
    }

    if (inspectingEmp.role === 'SALES_EXEC') {
      const isValidSup =
        selectedManager.includes('Team Leader') ||
        selectedManager.includes('TL') ||
        selectedManager.includes('Manager') ||
        selectedManager.includes('Admin');
      if (!isValidSup) {
        Alert.alert(
          '🔒 Invalid Hierarchy Assignment',
          'Hierarchy Policy Violation: Sales Executives can ONLY be assigned under a Team Leader (TL) or Department Manager.'
        );
        return;
      }
    }

    setEmployeesList(prev =>
      prev.map(e => (e.id === inspectingEmp.id ? { ...e, assignedManager: selectedManager } : e))
    );
    setInspectingEmp({ ...inspectingEmp, assignedManager: selectedManager });
    Alert.alert('Supervisor Re-assigned', `Successfully updated ${inspectingEmp.name}'s supervisor to ${selectedManager}.`);
  };

  // Execute Bulk Work & Lead Handover for Leaving Employee
  const handleExecuteHandover = () => {
    const departing = employeesList.find(e => e.id === departingEmpId);
    const recipient = employeesList.find(e => e.id === recipientEmpId);

    if (!departing || !recipient) {
      Alert.alert('Error', 'Please select valid departing and recipient staff members.');
      return;
    }

    if (departing.id === recipient.id) {
      Alert.alert('Invalid Transfer', 'Departing employee and recipient employee cannot be the same person.');
      return;
    }

    const leadsToTransfer = departing.leads.totalReceived;

    setEmployeesList(prev =>
      prev.map(e => {
        if (e.id === departing.id) {
          return {
            ...e,
            leads: { ...e.leads, totalReceived: 0, totalDistributed: 0, distributionBreakdown: [] },
          };
        }
        if (e.id === recipient.id) {
          return {
            ...e,
            leads: {
              ...e.leads,
              totalReceived: e.leads.totalReceived + leadsToTransfer,
              totalDistributed: e.leads.totalDistributed + leadsToTransfer,
              distributionBreakdown: [
                ...e.leads.distributionBreakdown,
                { targetName: `Handover from ${departing.name}`, targetRole: 'Work Transfer', count: leadsToTransfer },
              ],
            },
          };
        }
        return e;
      })
    );

    setHandoverModalOpen(false);
    Alert.alert(
      '✅ Work Handover Complete',
      `Transferred all ${leadsToTransfer} active leads and work status from ${departing.name} to ${recipient.name}.\n\nTotal Leads for ${recipient.name} updated!`
    );
  };

  const openGoogleMaps = (geoStr: string) => {
    Linking.openURL(`https://maps.google.com/?q=${geoStr.trim()}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Organization Hierarchy &amp; Profile Control</Text>
          <Text style={styles.headerSubtitle}>
            Tap any Manager, TL, HR or Employee to open full Attendance, Subordinates, Lead Distribution, and Manager Re-assignment Controls.
          </Text>
        </View>

        {/* ── ADMIN EXCLUSIVE: LEAVING EMPLOYEE LEAD & WORK HANDOVER BUTTON ─── */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.handoverBannerBtn}
            onPress={() => setHandoverModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.handoverBannerTitle}>💼 Admin Work &amp; Lead Handover (Leaving Employee)</Text>
            <Text style={styles.handoverBannerSub}>Re-allocate all active leads &amp; status of a departing employee to any other staff member/manager across teams →</Text>
          </TouchableOpacity>
        )}

        {/* ── STAFF DIRECTORY CARDS ───────────────────────────────────────────── */}
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
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.empRow,
                  idx < employeesList.length - 1 && styles.borderBottom,
                  emp.isLocked && { backgroundColor: 'rgba(239,68,68,0.05)' },
                  !!emp.deletionScheduledAt && { backgroundColor: 'rgba(245,158,11,0.05)' },
                ]}
                onPress={() => openProfileInspector(emp)}
                activeOpacity={0.7}
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
                        <Text style={styles.suspendedBadgeText}>⚠️ SUSPENDED</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.supervisorText}>
                    👤 Assigned under: <Text style={{ color: '#818cf8', fontWeight: '700' }}>{emp.assignedManager}</Text>
                  </Text>
                </View>

                <View style={styles.inspectBtn}>
                  <Text style={styles.inspectBtnText}>Inspect &amp; Control →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 IN-DEPTH EMPLOYEE / MANAGER / TL / HR PROFILE INSPECTOR MODAL            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!inspectingEmp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {inspectingEmp && (
            <View style={styles.modalContent}>
              
              {/* Profile Inspector Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: inspectingEmp.avatarUrl }} style={styles.modalAvatar} />
                  <View>
                    <Text style={styles.modalName}>{inspectingEmp.name}</Text>
                    <Text style={styles.modalEmail}>{inspectingEmp.email} • {inspectingEmp.phone}</Text>
                    <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800', marginTop: 2 }}>
                      ROLE: {inspectingEmp.role.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setInspectingEmp(null)}>
                  <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Inspector Section Switcher Tabs */}
              <View style={styles.tabRow}>
                {[
                  { id: 'PROFILE', label: '👤 Profile' },
                  { id: 'ATTENDANCE', label: '⏱️ Attendance' },
                  { id: 'SUBORDINATES', label: `👥 Staff (${inspectingEmp.subordinates.length})` },
                  { id: 'LEADS', label: `🎯 Leads (${inspectingEmp.leads.totalReceived})` },
                ].map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tabBtn, inspectorTab === t.id && styles.tabBtnActive]}
                    onPress={() => setInspectorTab(t.id as any)}
                  >
                    <Text style={[styles.tabBtnText, inspectorTab === t.id && styles.tabBtnTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>

                {/* ── TAB 1: PROFILE & MANAGER RE-ASSIGNMENT ─────────────────────── */}
                {inspectorTab === 'PROFILE' && (
                  <View style={{ gap: 12 }}>
                    <View style={styles.infoCard}>
                      <Text style={styles.cardHeaderTitle}>Supervisor &amp; Authority Assignment</Text>
                      <Text style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 8 }}>
                        Current Supervisor: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{inspectingEmp.assignedManager}</Text>
                      </Text>

                      {isAdmin ? (
                        <View style={{ gap: 6 }}>
                          {/* Hierarchy Policy Rule Banner */}
                          <View style={styles.hierarchyPolicyBox}>
                            <Text style={styles.hierarchyPolicyText}>
                              {inspectingEmp.role === 'TEAM_LEADER'
                                ? '🔒 Policy Rule: Team Leaders (TL) can ONLY report directly under a Department Manager.'
                                : inspectingEmp.role === 'SALES_EXEC'
                                ? '🔒 Policy Rule: Sales Executives can ONLY be assigned under a Team Leader (TL) or Department Manager.'
                                : '🔒 Policy Rule: Department Managers report directly to Tenant Administration.'}
                            </Text>
                          </View>

                          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 4 }}>
                            Re-assign Supervisor (Valid Roles Only):
                          </Text>
                          {getValidSupervisorsForRole(inspectingEmp.role).map(m => (
                            <TouchableOpacity
                              key={m}
                              style={[styles.managerOption, selectedManager === m && styles.managerOptionActive]}
                              onPress={() => setSelectedManager(m)}
                            >
                              <Text style={{ fontSize: 12, color: selectedManager === m ? '#818cf8' : '#cbd5e1', fontWeight: '700' }}>
                                {selectedManager === m ? '✓ ' : ''}{m}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity style={styles.reassignBtn} onPress={handleReassignManager}>
                            <Text style={styles.reassignBtnText}>Re-assign Supervisor Authority ✓</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 10, color: '#64748b' }}>Only Tenant Administrators can re-assign manager authority.</Text>
                      )}

                      {/* Admin Account Security & Status Controls */}
                      {isAdmin && (
                        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>🛡️ Account Security &amp; Admin Controls:</Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }, inspectingEmp.isLocked && { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }]}
                              onPress={() => {
                                handleToggleLock(inspectingEmp.id);
                                setInspectingEmp(prev => prev ? { ...prev, isLocked: !prev.isLocked } : null);
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: inspectingEmp.isLocked ? '#fca5a5' : '#ffffff' }}>
                                {inspectingEmp.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}
                              </Text>
                            </TouchableOpacity>

                            {inspectingEmp.deletionScheduledAt ? (
                              <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' }}
                                onPress={() => {
                                  handleRevokeDelete(inspectingEmp.id);
                                  setInspectingEmp(prev => prev ? { ...prev, deletionScheduledAt: null } : null);
                                }}
                              >
                                <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '800' }}>↺ Revoke Delete</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}
                                onPress={() => {
                                  handleScheduleSoftDelete(inspectingEmp.id);
                                  setInspectingEmp(prev => prev ? { ...prev, deletionScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : null);
                                }}
                              >
                                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '800' }}>🗑️ Delete (7 Days)</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* ── TAB 2: DETAILED ATTENDANCE AUDIT ────────────────────────────── */}
                {inspectorTab === 'ATTENDANCE' && (
                  <View style={{ gap: 10 }}>
                    <View style={styles.summaryBadgesRow}>
                      <View style={styles.badgeBox}>
                        <Text style={styles.badgeVal}>{inspectingEmp.attendance.presentDays}</Text>
                        <Text style={styles.badgeLbl}>Present</Text>
                      </View>
                      <View style={styles.badgeBox}>
                        <Text style={[styles.badgeVal, { color: '#ef4444' }]}>{inspectingEmp.attendance.absentDays}</Text>
                        <Text style={styles.badgeLbl}>Absent</Text>
                      </View>
                      <View style={styles.badgeBox}>
                        <Text style={[styles.badgeVal, { color: '#eab308' }]}>{inspectingEmp.attendance.leaveDays}</Text>
                        <Text style={styles.badgeLbl}>Leaves</Text>
                      </View>
                    </View>

                    <View style={styles.infoCard}>
                      <Text style={styles.cardHeaderTitle}>Today's Punch Record</Text>
                      <Text style={styles.infoLine}>Punch In: <Text style={{ color: '#34d399', fontWeight: '800' }}>{inspectingEmp.attendance.todayInTime}</Text></Text>
                      <Text style={styles.infoLine}>Punch Out: <Text style={{ color: '#f8fafc', fontWeight: '800' }}>{inspectingEmp.attendance.todayOutTime || 'Currently Active'}</Text></Text>
                      
                      <TouchableOpacity style={{ marginTop: 4 }} onPress={() => openGoogleMaps(inspectingEmp.attendance.todayGps)}>
                        <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: '700', textDecorationLine: 'underline' }}>
                          📍 GPS Location: {inspectingEmp.attendance.todayGps} ↗
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── TAB 3: SUBORDINATES (UNDER EMPLOYEES) ───────────────────────── */}
                {inspectorTab === 'SUBORDINATES' && (
                  <View style={{ gap: 8 }}>
                    {inspectingEmp.subordinates.length === 0 ? (
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
                        No direct subordinates assigned under this staff member.
                      </Text>
                    ) : (
                      inspectingEmp.subordinates.map(sub => (
                        <View key={sub.id} style={styles.subItemCard}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>{sub.name}</Text>
                          <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '700' }}>{sub.role}</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                            📞 {sub.calls} Calls Logged • 💰 {sub.revenue} Revenue
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* ── TAB 4: LEAD ALLOCATION & DISTRIBUTION ───────────────────────── */}
                {inspectorTab === 'LEADS' && (
                  <View style={{ gap: 10 }}>
                    {/* Scope Rule Notice */}
                    <View style={styles.scopeNoticeCard}>
                      <Text style={styles.scopeNoticeText}>
                        {isAdmin
                          ? '👑 ADMIN AUTHORITY: You can re-allocate leads to ANY employee or manager across teams.'
                          : '🔒 MANAGER SCOPE: Managers can only allocate leads to direct subordinates assigned under their own team.'}
                      </Text>
                    </View>

                    <View style={styles.infoCard}>
                      <Text style={styles.cardHeaderTitle}>Lead Distribution Summary</Text>
                      <Text style={{ fontSize: 12, color: '#f8fafc', fontWeight: '800' }}>
                        Total Leads Received by {inspectingEmp.name}: <Text style={{ color: '#34d399' }}>{inspectingEmp.leads.totalReceived} Leads</Text>
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Total Distributed to Subordinates: {inspectingEmp.leads.totalDistributed} Leads
                      </Text>
                    </View>

                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff', marginTop: 4 }}>
                      Distribution Breakdown per Staff Member:
                    </Text>

                    {inspectingEmp.leads.distributionBreakdown.map((item, i) => (
                      <View key={i} style={styles.distRow}>
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{item.targetName}</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8' }}>{item.targetRole}</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#818cf8' }}>
                          {item.count} Leads Assigned
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

              </ScrollView>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInspectingEmp(null)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 12 }}>Close Inspector</Text>
              </TouchableOpacity>

            </View>
          )}
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💼 LEAVING EMPLOYEE WORK & LEAD HANDOVER MODAL (ADMIN EXCLUSIVE)           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={handoverModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.modalTitle}>💼 Departing Staff Lead &amp; Work Handover</Text>
              <TouchableOpacity onPress={() => setHandoverModalOpen(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Re-allocate all active leads, deal pipeline stages, and work status of a leaving staff member to another employee or manager.
            </Text>

            {/* Select Departing Staff Member */}
            <Text style={styles.label}>Select Departing Employee (Source) *</Text>
            {employeesList.map(emp => (
              <TouchableOpacity
                key={`dep-${emp.id}`}
                style={[styles.selectOption, departingEmpId === emp.id && styles.selectOptionActive]}
                onPress={() => setDepartingEmpId(emp.id)}
              >
                <Text style={[styles.selectOptionText, departingEmpId === emp.id && { color: '#ef4444', fontWeight: '800' }]}>
                  {departingEmpId === emp.id ? '🚪 DEPARTING: ' : ''}{emp.name} ({emp.role}) • {emp.leads.totalReceived} Active Leads
                </Text>
              </TouchableOpacity>
            ))}

            {/* Select Recipient Staff Member */}
            <Text style={[styles.label, { marginTop: 10 }]}>Select Recipient Staff Member / Manager (Destination) *</Text>
            {employeesList.map(emp => (
              <TouchableOpacity
                key={`rec-${emp.id}`}
                style={[styles.selectOption, recipientEmpId === emp.id && styles.selectOptionActiveRecipient]}
                onPress={() => setRecipientEmpId(emp.id)}
              >
                <Text style={[styles.selectOptionText, recipientEmpId === emp.id && { color: '#34d399', fontWeight: '800' }]}>
                  {recipientEmpId === emp.id ? '📥 RECIPIENT: ' : ''}{emp.name} ({emp.role}) • Currently {emp.leads.totalReceived} Leads
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setHandoverModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleExecuteHandover}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Transfer All Work ✓</Text>
              </TouchableOpacity>
            </View>
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

  handoverBannerBtn: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  handoverBannerTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  handoverBannerSub: { fontSize: 10, color: '#a5b4fc', marginTop: 3 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },

  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 16 },
  empRow: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },

  rowAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#4f46e5' },
  empName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  empSub: { fontSize: 10, color: '#64748b' },
  supervisorText: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  telemetryText: { fontSize: 10, color: '#a5b4fc', marginTop: 2, fontWeight: '600' },

  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 8, fontWeight: '800' },

  lockedBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lockedBadgeText: { color: '#fca5a5', fontSize: 8, fontWeight: '900' },

  suspendedBadge: { backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspendedBadgeText: { color: '#fcd34d', fontSize: 8, fontWeight: '900' },

  adminEmpToolbar: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  adminToolBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adminToolBtnActive: { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' },
  adminToolBtnText: { color: '#cbd5e1', fontSize: 9, fontWeight: '800' },

  inspectBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  inspectBtnText: { fontSize: 10, fontWeight: '800', color: '#818cf8' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  modalSub: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  label: { fontSize: 11, color: '#cbd5e1', fontWeight: '700', marginBottom: 6 },

  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#818cf8' },
  modalName: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalEmail: { fontSize: 10, color: '#94a3b8' },

  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  tabBtnText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  tabBtnTextActive: { color: '#818cf8', fontWeight: '800' },

  scopeNoticeCard: { backgroundColor: '#020617', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  scopeNoticeText: { fontSize: 10, color: '#a5b4fc', fontWeight: '700' },

  infoCard: { backgroundColor: '#020617', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e293b' },
  cardHeaderTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  infoLine: { fontSize: 11, color: '#94a3b8', marginVertical: 2 },

  hierarchyPolicyBox: { backgroundColor: 'rgba(234,179,8,0.12)', borderWidth: 1, borderColor: '#eab308', borderRadius: 8, padding: 8, marginBottom: 6 },
  hierarchyPolicyText: { fontSize: 10, color: '#facc15', fontWeight: '800', lineHeight: 14 },

  managerOption: { backgroundColor: '#0f172a', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  managerOptionActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)' },
  reassignBtn: { backgroundColor: '#4f46e5', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  reassignBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },

  summaryBadgesRow: { flexDirection: 'row', gap: 8 },
  badgeBox: { flex: 1, backgroundColor: '#020617', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  badgeVal: { fontSize: 16, fontWeight: '900', color: '#34d399' },
  badgeLbl: { fontSize: 9, color: '#94a3b8' },

  subItemCard: { backgroundColor: '#020617', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  distRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },

  selectOption: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 10, borderRadius: 10, marginBottom: 6 },
  selectOptionActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  selectOptionActiveRecipient: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22c55e' },
  selectOptionText: { fontSize: 11, color: '#94a3b8' },

  closeModalBtn: { marginTop: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center' },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
