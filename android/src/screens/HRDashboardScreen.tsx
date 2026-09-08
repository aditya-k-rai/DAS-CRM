/**
 * HRDashboardScreen.tsx — DAS CRM Android
 * Mirrors the frontend-web HR dashboard (/hr page).
 * Accessible to ADMIN and HR roles only.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { TenantAdminHeaderBanner } from '../components/TenantAdminHeaderBanner';

const LEAVE_REQUESTS = [
  {
    id: 'lr1',
    name: 'Rajesh Kumar',
    role: 'SALES EXEC',
    type: 'Sick Leave',
    dates: '20 Aug – 21 Aug',
    days: 2,
    status: 'PENDING',
  },
  {
    id: 'lr2',
    name: 'Ananya Sharma',
    role: 'SALES EXEC',
    type: 'Casual Leave',
    dates: '22 Aug',
    days: 1,
    status: 'PENDING',
  },
  {
    id: 'lr3',
    name: 'Karan Mehta',
    role: 'TEAM LEADER',
    type: 'Earned Leave',
    dates: '25 Aug – 28 Aug',
    days: 4,
    status: 'APPROVED',
  },
];

const ATTENDANCE_TODAY = [
  { name: 'Vikram Singh', role: 'ADMIN', status: 'PRESENT', time: '09:02 AM' },
  { name: 'Sunita Verma', role: 'HR', status: 'PRESENT', time: '09:15 AM' },
  { name: 'Rajesh Kumar', role: 'SALES EXEC', status: 'SICK LEAVE', time: '—' },
  { name: 'Amit Shah', role: 'TEAM LEADER', status: 'PRESENT', time: '08:58 AM' },
  { name: 'Priya Sharma', role: 'SALES EXEC', status: 'LATE', time: '10:14 AM' },
];

export default function HRDashboardScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { currentUser, subscription } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'payroll'>('overview');
  const [leaves, setLeaves] = useState(LEAVE_REQUESTS);

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'attendance', label: '⏱️ Attendance' },
    { key: 'leaves', label: '📅 Leaves' },
    { key: 'payroll', label: '💳 Payroll' },
  ];

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 4 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Banner */}
        <TenantAdminHeaderBanner navigation={navigation} role="HR" />

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { backgroundColor: isDark ? 'rgba(56,189,248,0.22)' : 'rgba(2,132,199,0.12)' }],
                ]}
                onPress={() => setActiveTab(tab.key as any)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? (isDark ? '#38bdf8' : '#0284c7') : colors.textSecondary },
                    isActive && { fontWeight: '800' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Human Resources, Attendance &amp; Salary Overview
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>👥</Text>
                  <Text style={[styles.statTag, { color: isDark ? '#38bdf8' : '#0284c7', backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.12)' }]}>
                    +2 New
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>45</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Staff Members</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(5,150,105,0.25)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={[styles.statTag, { color: isDark ? '#34d399' : '#059669', backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.12)' }]}>
                    +1.2%
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: isDark ? '#34d399' : '#059669' }]}>95.5%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance Rate Today</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.25)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>📅</Text>
                  <Text style={[styles.statTag, { color: isDark ? '#fbbf24' : '#b45309', backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]}>
                    ACTION
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: isDark ? '#fbbf24' : '#b45309' }]}>3</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Leave Requests Pending</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(168,85,247,0.3)' : 'rgba(147,51,234,0.25)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>💳</Text>
                  <Text style={[styles.statTag, { color: isDark ? '#c084fc' : '#7c3aed', backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(124,58,237,0.12)' }]}>
                    AUG
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: isDark ? '#c084fc' : '#7c3aed' }]}>₹64.2L</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Payroll Total</Text>
              </View>
            </View>

            {/* Attendance Summary */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Summary Today</Text>
            <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {[
                { label: 'Present Staff', value: '43 Employees', color: isDark ? '#34d399' : '#059669' },
                { label: 'On Approved Leave', value: '2 Employees', color: isDark ? '#fbbf24' : '#b45309' },
                { label: 'Late Arrivals', value: '1 Employee', color: isDark ? '#f87171' : '#dc2626' },
                { label: 'Absent / Unexplained', value: '0 Employees', color: colors.textSecondary },
              ].map((row, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.infoVal, { color: row.color }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Payroll Quick Stats */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payroll Quick Stats</Text>
            <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {[
                { label: 'Base Salary Disbursed', value: '₹52.4L', color: colors.text },
                { label: 'Incentives & Bonuses', value: '₹8.6L', color: isDark ? '#34d399' : '#059669' },
                { label: 'Deductions (ESI/PF)', value: '₹3.2L', color: isDark ? '#f87171' : '#dc2626' },
                { label: 'Net Payroll Processed', value: '₹64.2L', color: isDark ? '#c084fc' : '#7c3aed' },
              ].map((row, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.infoVal, { color: row.color }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ATTENDANCE ───────────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Today's attendance log for all staff members
            </Text>

            {ATTENDANCE_TODAY.map((emp, i) => {
              const statusColor =
                emp.status === 'PRESENT'
                  ? (isDark ? '#34d399' : '#059669')
                  : emp.status === 'LATE'
                  ? (isDark ? '#fbbf24' : '#b45309')
                  : (isDark ? '#f87171' : '#dc2626');
              const statusBg =
                emp.status === 'PRESENT'
                  ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.12)')
                  : emp.status === 'LATE'
                  ? (isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)')
                  : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.12)');

              return (
                <View key={i} style={[styles.attendanceCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: statusColor + '20' },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: statusColor }]}>
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: colors.text }]}>{emp.name}</Text>
                    <Text style={[styles.empRole, { color: colors.textSecondary }]}>{emp.role}</Text>
                  </View>
                  <View>
                    <View
                      style={[
                        styles.statusTag,
                        { backgroundColor: statusBg, borderColor: statusColor + '50' },
                      ]}
                    >
                      <Text style={[styles.statusTagText, { color: statusColor }]}>
                        {emp.status}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{emp.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── LEAVE QUEUE ──────────────────────────────────────────────── */}
        {activeTab === 'leaves' && (
          <View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Pending leave requests awaiting HR approval
            </Text>

            {leaves.map((req) => {
              const isPending = req.status === 'PENDING';
              return (
                <View key={req.id} style={[styles.leaveCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={styles.leaveHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.leaveName, { color: colors.text }]}>{req.name}</Text>
                      <Text style={[styles.leaveRole, { color: colors.textSecondary }]}>{req.role}</Text>
                    </View>
                    <View
                      style={[
                        styles.leaveStatusTag,
                        isPending
                          ? {
                              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)',
                              borderColor: isDark ? 'rgba(245,158,11,0.4)' : 'rgba(217,119,6,0.3)',
                            }
                          : {
                              backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.12)',
                              borderColor: isDark ? 'rgba(16,185,129,0.4)' : 'rgba(5,150,105,0.3)',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.leaveStatusText,
                          { color: isPending ? (isDark ? '#fbbf24' : '#b45309') : (isDark ? '#34d399' : '#059669') },
                        ]}
                      >
                        {req.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.leaveDetails}>
                    <Text style={[styles.leaveType, { color: colors.textSecondary }]}>
                      📋 {req.type} — {req.days} Day{req.days > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.leaveDates, { color: colors.textSecondary }]}>📅 {req.dates}</Text>
                  </View>
                  {isPending && (
                    <View style={styles.leaveActions}>
                      <TouchableOpacity
                        style={[
                          styles.leaveActionBtn,
                          styles.approveBtn,
                          !isDark && { backgroundColor: 'rgba(5,150,105,0.12)', borderColor: 'rgba(5,150,105,0.35)' },
                        ]}
                        onPress={() => {
                          setLeaves((prev) =>
                            prev.map((l) => (l.id === req.id ? { ...l, status: 'APPROVED' } : l))
                          );
                          Alert.alert('✓ Leave Approved', `Approved leave request for ${req.name} (${req.days} Days).`);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.leaveActionText, { color: isDark ? '#34d399' : '#059669' }]}>
                          ✓ Approve
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.leaveActionBtn,
                          styles.rejectBtn,
                          !isDark && { backgroundColor: 'rgba(220,38,38,0.12)', borderColor: 'rgba(220,38,38,0.35)' },
                        ]}
                        onPress={() => {
                          setLeaves((prev) =>
                            prev.map((l) => (l.id === req.id ? { ...l, status: 'REJECTED' } : l))
                          );
                          Alert.alert('✕ Leave Rejected', `Rejected leave request for ${req.name}.`);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.leaveActionText, { color: isDark ? '#f87171' : '#dc2626' }]}>
                          ✕ Reject
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 24 },

  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    padding: 14,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#7dd3fc' },
  companyName: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  planPill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planPillText: { fontSize: 9, fontWeight: '800', color: '#34d399' },

  sessionBanner: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  sessionBannerText: { fontSize: 11, color: '#7dd3fc', fontWeight: '600' },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(56,189,248,0.2)' },
  tabText: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  tabTextActive: { color: '#7dd3fc' },

  sectionSubtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 140,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: { fontSize: 16 },
  statTag: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  // Card box
  cardBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoVal: { fontSize: 12, fontWeight: '800' },

  // Attendance
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '900' },
  empName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  empRole: { fontSize: 10, color: '#64748b', marginTop: 1 },
  statusTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  statusTagText: { fontSize: 9, fontWeight: '800' },
  timeText: { fontSize: 10, color: '#64748b', marginTop: 3, textAlign: 'right' },

  // Leave Cards
  leaveCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leaveName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  leaveRole: { fontSize: 10, color: '#64748b', marginTop: 2 },
  leaveStatusTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  leaveStatusText: { fontSize: 9, fontWeight: '800' },
  leaveDetails: { gap: 4, marginBottom: 12 },
  leaveType: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  leaveDates: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  leaveActions: { flexDirection: 'row', gap: 8 },
  leaveActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  leaveActionText: { fontSize: 12, fontWeight: '700' },

  quickBarRow: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center' },
  quickChipText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },
});
