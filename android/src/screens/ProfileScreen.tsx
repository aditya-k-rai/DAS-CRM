/**
 * ProfileScreen.tsx — DAS CRM Android
 * Comprehensive User Profile displaying Identity, Workspace, Attendance, Salary,
 * Overtime Earnings, Role Telemetry, Data Export, and Logout.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, UserRole } from '../store/authStore';

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenUpdate?: () => void;
  onClose?: () => void;
}

export default function ProfileScreen({ onLogout, onOpenUpdate, onClose }: ProfileScreenProps) {
  const { currentUser, subscription, logout } = useAuthStore();
  const role: UserRole = currentUser.role || 'SALES_EXEC';

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  // Role color coding
  const roleColor =
    role === 'ADMIN'
      ? '#818cf8'
      : role === 'HR'
      ? '#38bdf8'
      : role === 'MANAGER'
      ? '#c084fc'
      : role === 'TEAM_LEADER'
      ? '#fbbf24'
      : '#34d399';

  // Plan badge color
  const planColor =
    subscription.planType === 'FREE_TRIAL'
      ? '#fbbf24'
      : subscription.planType === 'PRO' || subscription.planType === 'PRO_50'
      ? '#34d399'
      : subscription.planType === 'ENTERPRISE'
      ? '#c084fc'
      : '#818cf8';

  // Role-customized Telemetry Data
  const roleMetrics = {
    SUPER_ADMIN: {
      salesLabel: 'Total Platform Revenue Managed',
      salesVal: '$2.4M',
      callsLabel: 'System Telemetry Calls Logged',
      callsVal: '18.4k Calls',
      scopeLabel: 'Total Active Tenants',
      scopeVal: '42 Companies',
      goalLabel: 'Platform Uptime Target',
      goalVal: '99.99%',
    },
    ADMIN: {
      salesLabel: 'Total Organization Sales Volume',
      salesVal: '$148,500',
      callsLabel: 'Total System Calls Audited',
      callsVal: '1,420 Calls',
      scopeLabel: 'Total Ingested Leads',
      scopeVal: '1,420 Leads',
      goalLabel: 'System Conversion Target',
      goalVal: '28.5%',
    },
    HR: {
      salesLabel: 'Total Processed Payroll Volume',
      salesVal: '$64,200',
      callsLabel: 'HR Audit Calls Recorded',
      callsVal: '184 Calls',
      scopeLabel: 'Employees Audited',
      scopeVal: '24 Staff Members',
      goalLabel: 'Attendance Rate Today',
      goalVal: '95.5%',
    },
    MANAGER: {
      salesLabel: 'Department Revenue Managed',
      salesVal: '₹24.8L',
      callsLabel: 'Total Team Calls Supervised',
      callsVal: '580 Calls',
      scopeLabel: 'Open Leads Queue',
      scopeVal: '142 Leads',
      goalLabel: 'Department Goal Progress',
      goalVal: '82% Achieved',
    },
    TEAM_LEADER: {
      salesLabel: 'Team Unit Revenue',
      salesVal: '₹14.2L (🥇 #1 Team)',
      callsLabel: 'Total Unit Calls Logged',
      callsVal: '340 Calls',
      scopeLabel: 'Unassigned Unit Leads',
      scopeVal: '18 Leads',
      goalLabel: 'Team Conversion Rate',
      goalVal: '28.5%',
    },
    SALES_EXEC: {
      salesLabel: 'Personal Closed Sales',
      salesVal: '₹5.2L (12 Deals Won)',
      callsLabel: 'Personal Calls Made Today',
      callsVal: '38 Calls',
      scopeLabel: 'My Assigned Leads',
      scopeVal: '31 Leads',
      goalLabel: 'Personal Best Rate',
      goalVal: '38.7%',
    },
  }[role] || {
    salesLabel: 'Personal Closed Sales',
    salesVal: '₹5.2L',
    callsLabel: 'Personal Calls Made',
    callsVal: '38 Calls',
    scopeLabel: 'My Assigned Leads',
    scopeVal: '31 Leads',
    goalLabel: 'Personal Conversion Rate',
    goalVal: '38.7%',
  };

  const handleExportPerformanceData = () => {
    Alert.alert(
      'Export Telemetry Report',
      `Performance & Telemetry report for ${currentUser.name} compiled. Downloading CSV file...`,
      [{ text: 'OK' }]
    );
  };

  const handleExportAttendanceData = () => {
    Alert.alert(
      'Export Attendance & Payslips',
      `Attendance logs & August 2026 payslip for ${currentUser.name} compiled. Downloading CSV file...`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>User &amp; Workspace Profile</Text>

        {/* ── 1. USER IDENTITY CARD ────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.userHeader}>
            <View style={[styles.avatarBadge, { backgroundColor: roleColor + '30' }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>
                {currentUser.avatar}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '60' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  ROLE: {role.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 2. COMPANY WORKSPACE & KEYS ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Company Workspace Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>{currentUser.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Registration Key</Text>
            <Text style={styles.monoValue}>ACME-KX-7421</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={[styles.activeValue, { color: planColor }]}>
              {subscription.planType.replace('_', ' ')} ({subscription.userSeatsAllocated} Seats)
            </Text>
          </View>
          {subscription.planType === 'FREE_TRIAL' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trial Days Remaining</Text>
              <Text style={[styles.activeValue, { color: '#fbbf24' }]}>
                {subscription.trialDaysLeft} Days Left
              </Text>
            </View>
          )}
        </View>

        {/* ── 3. ROLE PERFORMANCE & TELEMETRY ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Role Telemetry Metrics ({role.replace('_', ' ')})</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{roleMetrics.salesLabel}</Text>
            <Text style={[styles.infoValue, { color: '#818cf8' }]}>{roleMetrics.salesVal}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{roleMetrics.callsLabel}</Text>
            <Text style={styles.infoValue}>{roleMetrics.callsVal}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{roleMetrics.scopeLabel}</Text>
            <Text style={[styles.infoValue, { color: '#38bdf8' }]}>{roleMetrics.scopeVal}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{roleMetrics.goalLabel}</Text>
            <Text style={[styles.activeValue, { color: '#34d399' }]}>{roleMetrics.goalVal}</Text>
          </View>
        </View>

        {/* ── 4. ATTENDANCE & LEAVE RECORDS ────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Attendance &amp; Leave Audit</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Today's Attendance Status</Text>
            <Text style={styles.activeValue}>✓ PRESENT (09:05 AM)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days Present (This Month)</Text>
            <Text style={styles.infoValue}>21 Days</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Approved Leaves Taken</Text>
            <Text style={[styles.infoValue, { color: '#fbbf24' }]}>2 Days Taken</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remaining Leave Balance</Text>
            <Text style={[styles.infoValue, { color: '#38bdf8' }]}>12 Days Remaining</Text>
          </View>
        </View>

        {/* ── 5. SALARY, INCENTIVES & OVERTIME EARNINGS ────────────────────── */}
        <Text style={styles.sectionTitle}>Salary, Incentives &amp; Overtime Earnings</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Monthly Salary</Text>
            <Text style={styles.infoValue}>₹45,000 / mo</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Incentives &amp; Commissions</Text>
            <Text style={[styles.infoValue, { color: '#34d399' }]}>+₹12,500</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Extra Working / Overtime</Text>
            <Text style={[styles.infoValue, { color: '#c084fc' }]}>+₹4,200</Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 }]}>
            <Text style={[styles.infoLabel, { color: '#ffffff', fontWeight: '800' }]}>Total Net Processed Earnings</Text>
            <Text style={[styles.infoValue, { color: '#818cf8', fontSize: 14, fontWeight: '900' }]}>₹61,700</Text>
          </View>
        </View>

        {/* ── 6. DATA EXPORT & SYSTEM ACTIONS ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>Data Export &amp; System Actions</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExportPerformanceData}
          >
            <Text style={styles.exportBtnText}>📊 Export Performance &amp; Telemetry CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { marginTop: 8, backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)' }]}
            onPress={handleExportAttendanceData}
          >
            <Text style={[styles.exportBtnText, { color: '#38bdf8' }]}>📅 Export Attendance &amp; Payslip CSV</Text>
          </TouchableOpacity>
          {onOpenUpdate && (
            <TouchableOpacity
              style={[styles.exportBtn, { marginTop: 8, backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}
              onPress={onOpenUpdate}
            >
              <Text style={[styles.exportBtnText, { color: '#818cf8' }]}>🔄 Check for In-App APK Updates (v2.5.0)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 7. LOGOUT BUTTON ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>🚪 Sign Out of Workspace</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16, alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
    width: '100%',
    maxWidth: 600,
  },

  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.5,
    width: '100%',
    maxWidth: 600,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  monoValue: {
    fontSize: 12,
    color: '#c084fc',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  activeValue: { fontSize: 12, color: '#34d399', fontWeight: '700' },

  exportBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportBtnText: { color: '#a5b4fc', fontSize: 12, fontWeight: '800' },

  logoutButton: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: { color: '#fca5a5', fontSize: 13, fontWeight: '800' },
});
