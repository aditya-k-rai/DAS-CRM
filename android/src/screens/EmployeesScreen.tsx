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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { currentUser, subscription } = useAuthStore();
  const userRole: UserRole = normalizeRoleStr(currentUser.role);

  const [employeesList, setEmployeesList] = useState<EmployeeProfile[]>([]);

  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'UNASSIGNED'>('ASSIGNED');
  const [assignRoleTarget, setAssignRoleTarget] = useState<UnassignedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | null>(null);

  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);

  const totalQuota = subscription?.userSeatsAllocated ?? 10;
  const activeCount = employeesList.length;
  const unassignedCount = unassignedUsers.length;
  const totalUsersCount = activeCount + unassignedCount;

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
        `Your subscription plan limit is ${totalQuota} active users. You have already allocated all ${totalQuota} seats. Upgrade your plan to assign more roles.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const roleConf = AVAILABLE_ROLES.find(r => r.key === selectedRole);

    // Create new assigned employee profile
    const newEmployee: EmployeeProfile = {
      id: `emp-${Date.now()}`,
      name: assignRoleTarget.name,
      email: assignRoleTarget.email,
      phone: assignRoleTarget.phone,
      role: selectedRole,
      assignedManager: `Tenant Admin (${currentUser?.name || 'Administrator'})`,
      status: 'ONLINE',
      avatarUrl: '',
      documents: {
        pan: '',
        aadhaar: '',
        eduCert: '',
        offerLetter: '',
        lastUpdatedDate: 'Today',
        historyLogs: [],
      },
      bankDetails: {
        bankName: '',
        accountHolder: assignRoleTarget.name,
        accountNo: '',
        ifscCode: '',
        upiId: '',
        lastUpdatedDate: 'Today',
        historyLogs: [],
      },
      leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
      attendance: { presentDays: 1, absentDays: 0, leaveDays: 0, todayInTime: '09:30 AM', todayOutTime: null, todayGps: '' },
      subordinates: [],
    };

    setEmployeesList(prev => [newEmployee, ...prev]);
    setUnassignedUsers(prev => prev.filter(u => u.id !== assignRoleTarget.id));
    setAssignRoleTarget(null);
    setSelectedRole(null);

    Alert.alert(
      'Role Assigned Successfully',
      `${assignRoleTarget.name} has been assigned as ${roleConf?.label}. They are now active in your Employee Structure.`,
      [{ text: 'OK' }]
    );
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
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 0 }]}>

      {/* ── Page Header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.borderSubtle }]}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t.empStructureTitle}</Text>
          <Text style={[styles.pageSub, { color: colors.textMuted }]}>
            {totalUsersCount} {t.empTotalUsers} · {activeCount} {t.empTabAssigned} · {unassignedCount} {t.empTabUnassigned}
          </Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: pillStyle.bg, borderColor: pillStyle.border }]}>
          <Text style={[styles.countPillText, { color: pillStyle.text }]}>
            {activeCount} / {totalQuota > 0 ? totalQuota : '∞'} {t.empSeatsAssigned}
          </Text>
        </View>
      </View>

      {/* ── Segmented Tab Bar ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ASSIGNED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ASSIGNED')}
          activeOpacity={0.8}
        >
          <View style={[styles.tabDot, { backgroundColor: activeTab === 'ASSIGNED' ? '#34d399' : colors.tabBarInactive }]} />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[styles.tabBtnText, { color: colors.textMuted }, activeTab === 'ASSIGNED' && styles.tabBtnTextActive]}
          >
            {t.empTabAssigned} ({employeesList.length})
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
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[styles.tabBtnText, { color: colors.textMuted }, activeTab === 'UNASSIGNED' && styles.tabBtnTextUnassigned]}
          >
            {t.empTabUnassigned} ({unassignedUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Assigned Tab Content ── */}
      {activeTab === 'ASSIGNED' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 95 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.tabInfoBanner, !isDark && { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.4)' }]}>
            <Text style={[styles.tabInfoText, !isDark && { color: '#065f46' }]}>
              {t.empAssignedBanner}
            </Text>
          </View>

          <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {employeesList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Employees Found</Text>
                <Text style={[styles.emptyStateSub, { color: colors.textMuted }]}>
                  No active employee profiles found in this organization.
                </Text>
              </View>
            ) : (
              employeesList.map((emp, index) => {
                const roleStyle = getRoleBadgeStyle(emp.role);
                return (
                  <View
                    key={emp.id}
                    style={[styles.empRow, index !== employeesList.length - 1 && [styles.borderBottom, { borderBottomColor: colors.borderSubtle }]]}
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
                        <Text style={[styles.empName, { color: colors.text }]}>{emp.name}</Text>
                        <View style={[styles.roleTag, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                          <Text style={[styles.roleTagText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.supervisorText, { color: colors.textMuted }]}>
                        {emp.email}
                      </Text>
                      <Text style={[styles.supervisorText, { color: colors.textMuted }]}>
                        Under: <Text style={{ color: isDark ? '#cbd5e1' : '#334155', fontWeight: '700' }}>{emp.assignedManager}</Text>
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.inspectBtn} onPress={() => setInspectingEmp(emp)}>
                      <Text style={styles.inspectBtnText}>{t.empInspectControl} →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Unassigned Tab Content ── */}
      {activeTab === 'UNASSIGNED' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 95 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.tabInfoBanner, { borderColor: 'rgba(251,191,36,0.35)', backgroundColor: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(251,191,36,0.15)' }]}>
            <Text style={[styles.tabInfoText, { color: isDark ? '#fde68a' : '#854d0e' }]}>
              ⚠️ These users have registered in DAS CRM but have <Text style={{ fontWeight: '900' }}>no role assigned yet</Text>. You have <Text style={{ fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>{Math.max(0, totalQuota - activeCount)} available seat(s)</Text> on your plan ({activeCount}/{totalQuota} used).
            </Text>
          </View>

          {unassignedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎉</Text>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>All Caught Up!</Text>
              <Text style={[styles.emptyStateSub, { color: colors.textMuted }]}>No pending role assignments. All registered users have been activated.</Text>
            </View>
          ) : (
            <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {unassignedUsers.map((user, index) => (
                <View
                  key={user.id}
                  style={[styles.empRow, index !== unassignedUsers.length - 1 && [styles.borderBottom, { borderBottomColor: colors.borderSubtle }]]}
                >
                  {/* Avatar */}
                  <View style={[styles.avatarCircle, { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)' }]}>
                    <Text style={[styles.avatarInitials, { color: '#fbbf24' }]}>
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: '#64748b' }]} />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.empName, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[styles.supervisorText, { color: colors.textMuted }]}>{user.email}</Text>
                    <Text style={[styles.supervisorText, { color: colors.textMuted }]}>{user.phone}</Text>
                    <View style={styles.registeredBadge}>
                      <Text style={styles.registeredBadgeText}>{t.empRegisteredBadge}: {user.registeredAt}</Text>
                    </View>
                    <Text style={[styles.supervisorText, { color: colors.textMuted, marginTop: 2 }]}>{user.deviceInfo}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => { setAssignRoleTarget(user); setSelectedRole(null); }}
                  >
                    <Text style={styles.assignBtnText}>{t.empAssignRole}</Text>
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
            <View style={[styles.modalBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
              {/* Modal Header */}
              <View style={[styles.modalHead, { borderBottomColor: colors.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.empAssignRole}</Text>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>{assignRoleTarget.name} · {assignRoleTarget.email}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <View style={[
                      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
                      activeCount >= totalQuota
                        ? { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' }
                        : { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)' }
                    ]}>
                      <Text style={{ fontSize: 9.5, fontWeight: '900', color: activeCount >= totalQuota ? '#fbbf24' : '#34d399' }}>
                        {activeCount >= totalQuota
                          ? `⚠️ Plan Limit: ${activeCount}/${totalQuota} Seats (Full)`
                          : `✓ Available Seats: ${totalQuota - activeCount} of ${totalQuota}`}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, !isDark && { backgroundColor: 'rgba(0,0,0,0.06)' }]}
                  onPress={() => { setAssignRoleTarget(null); setSelectedRole(null); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.modalCloseBtnText, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSectionLbl, { color: colors.textMuted }]}>SELECT ROLE</Text>

              {AVAILABLE_ROLES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.roleOption,
                    { backgroundColor: colors.inputBg, borderColor: colors.border },
                    selectedRole === r.key && { borderColor: r.color, backgroundColor: `${r.color}18` },
                  ]}
                  onPress={() => setSelectedRole(r.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleOptionDot, { backgroundColor: selectedRole === r.key ? r.color : (isDark ? '#334155' : '#cbd5e1') }]} />
                  <Text style={[styles.roleOptionText, { color: colors.textSecondary }, selectedRole === r.key && { color: r.color }]}>
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
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    marginBottom: 10,
  },
  roleOptionDot: { width: 10, height: 10, borderRadius: 5 },
  roleOptionText: { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#94a3b8' },
  roleOptionCheck: { fontSize: 16, fontWeight: '900' },

  // Confirm Button
  confirmBtn: {
    backgroundColor: '#4f46e5',
    borderWidth: 1.5,
    borderColor: '#818cf8',
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmBtnText: { color: '#ffffff', fontSize: 13.5, fontWeight: '900', letterSpacing: 0.3 },
});
