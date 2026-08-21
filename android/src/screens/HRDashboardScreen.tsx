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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

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
  const { currentUser, subscription } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'payroll'>('overview');
  const [leaves, setLeaves] = useState(LEAVE_REQUESTS);

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'attendance', label: '⏱️ Attendance' },
    { key: 'leaves', label: '📅 Leaves' },
    { key: 'payroll', label: '💳 Payroll' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  🔒 AUTHENTICATED: {currentUser.role.replace('_', ' ')} (LOCKED)
                </Text>
              </View>
              <Text style={styles.companyName}>{currentUser.companyName}</Text>
            </View>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{subscription.planType.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Session Banner */}
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionBannerText}>
            🔒 HR Portal — Human Resources, Attendance &amp; Payroll Management
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionSubtitle}>
              Human Resources, Attendance &amp; Salary Overview
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>👥</Text>
                  <Text style={[styles.statTag, { color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                    +2 New
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>45</Text>
                <Text style={styles.statLabel}>Total Staff Members</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={[styles.statTag, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    +1.2%
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: '#34d399' }]}>95.5%</Text>
                <Text style={styles.statLabel}>Attendance Rate Today</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>📅</Text>
                  <Text style={[styles.statTag, { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    ACTION
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>3</Text>
                <Text style={styles.statLabel}>Leave Requests Pending</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>💳</Text>
                  <Text style={[styles.statTag, { color: '#c084fc', backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                    AUG
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>₹64.2L</Text>
                <Text style={styles.statLabel}>Monthly Payroll Total</Text>
              </View>
            </View>

            {/* Attendance Summary */}
            <Text style={styles.sectionTitle}>Attendance Summary Today</Text>
            <View style={styles.cardBox}>
              {[
                { label: 'Present Staff', value: '43 Employees', color: '#34d399' },
                { label: 'On Approved Leave', value: '2 Employees', color: '#fbbf24' },
                { label: 'Late Arrivals', value: '1 Employee', color: '#f87171' },
                { label: 'Absent / Unexplained', value: '0 Employees', color: '#64748b' },
              ].map((row, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
                >
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={[styles.infoVal, { color: row.color }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Payroll Quick Stats */}
            <Text style={styles.sectionTitle}>Payroll Quick Stats</Text>
            <View style={styles.cardBox}>
              {[
                { label: 'Base Salary Disbursed', value: '₹52.4L', color: '#ffffff' },
                { label: 'Incentives &amp; Bonuses', value: '₹8.6L', color: '#34d399' },
                { label: 'Deductions (ESI/PF)', value: '₹3.2L', color: '#f87171' },
                { label: 'Net Payroll Processed', value: '₹64.2L', color: '#c084fc' },
              ].map((row, i) => (
                <View
                  key={i}
                  style={[styles.infoRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
                >
                  <Text style={styles.infoLabel}>{row.label}</Text>
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
            <Text style={styles.sectionSubtitle}>
              Today's attendance log for all staff members
            </Text>

            {ATTENDANCE_TODAY.map((emp, i) => {
              const statusColor =
                emp.status === 'PRESENT'
                  ? '#34d399'
                  : emp.status === 'LATE'
                  ? '#fbbf24'
                  : '#f87171';
              const statusBg =
                emp.status === 'PRESENT'
                  ? 'rgba(16,185,129,0.15)'
                  : emp.status === 'LATE'
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(239,68,68,0.15)';

              return (
                <View key={i} style={styles.attendanceCard}>
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: statusColor + '30' },
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
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empRole}>{emp.role}</Text>
                  </View>
                  <View>
                    <View
                      style={[
                        styles.statusTag,
                        { backgroundColor: statusBg, borderColor: statusColor + '60' },
                      ]}
                    >
                      <Text style={[styles.statusTagText, { color: statusColor }]}>
                        {emp.status}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{emp.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── LEAVE QUEUE ──────────────────────────────────────────────── */}
        {activeTab === 'leaves' && (
          <View>
            <Text style={styles.sectionSubtitle}>
              Pending leave requests awaiting HR approval
            </Text>

            {LEAVE_REQUESTS.map((req) => {
              const isPending = req.status === 'PENDING';
              return (
                <View key={req.id} style={styles.leaveCard}>
                  <View style={styles.leaveHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaveName}>{req.name}</Text>
                      <Text style={styles.leaveRole}>{req.role}</Text>
                    </View>
                    <View
                      style={[
                        styles.leaveStatusTag,
                        isPending
                          ? {
                              backgroundColor: 'rgba(245,158,11,0.15)',
                              borderColor: 'rgba(245,158,11,0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(16,185,129,0.15)',
                              borderColor: 'rgba(16,185,129,0.4)',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.leaveStatusText,
                          { color: isPending ? '#fbbf24' : '#34d399' },
                        ]}
                      >
                        {req.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.leaveDetails}>
                    <Text style={styles.leaveType}>
                      📋 {req.type} — {req.days} Day{req.days > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.leaveDates}>📅 {req.dates}</Text>
                  </View>
                  {isPending && (
                    <View style={styles.leaveActions}>
                      <TouchableOpacity
                        style={[styles.leaveActionBtn, styles.approveBtn]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.leaveActionText, { color: '#34d399' }]}>
                          ✓ Approve
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.leaveActionBtn, styles.rejectBtn]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.leaveActionText, { color: '#f87171' }]}>
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
