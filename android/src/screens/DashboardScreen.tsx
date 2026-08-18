/**
 * DashboardScreen.tsx — DAS CRM Android
 * Complete in-depth role dashboard with 100% web feature parity.
 * Supports: ADMIN, HR, MANAGER, TEAM_LEADER, SALES_EXEC role perspectives.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

interface DashboardScreenProps {
  userRole?: UserRole;
}

interface LeaveRequestItem {
  id: string;
  name: string;
  role: string;
  type: string;
  dates: string;
  days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function DashboardScreen({ userRole }: DashboardScreenProps) {
  const { currentUser, subscription } = useAuthStore();
  const selectedRole: UserRole = normalizeRoleStr(userRole || currentUser.role);

  // ─── ADMIN STATE ─────────────────────────────────────────────────────────────
  const [routingStrategy, setRoutingStrategy] = useState<'BATCH_QUOTA' | 'VANISH_POOL' | 'MANUAL'>('BATCH_QUOTA');
  const [batchQuotaLimit, setBatchQuotaLimit] = useState(25);
  const [vanishTimeoutMins, setVanishTimeoutMins] = useState(30);

  const [userLocks, setUserLocks] = useState<Record<string, boolean>>({
    'usr_rep1': false,
    'usr_rep2': true,
    'usr_rep3': false,
  });

  const [policyRole, setPolicyRole] = useState<'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC'>('MANAGER');
  const [permissionToggles, setPermissionToggles] = useState<Record<string, boolean>>({
    viewCallCounts: true,
    viewCallDurations: true,
    viewRevenueFigures: true,
    viewCustomerPII: false,
    delegateManagerConfig: true,
  });

  const [historyTab, setHistoryTab] = useState<'DATEWISE' | 'FILE_UPLOADS' | 'GSHEETS'>('DATEWISE');

  // ─── HR STATE ────────────────────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([
    { id: 'lr1', name: 'Rajesh Kumar', role: 'SALES EXEC', type: 'Sick Leave', dates: '20 Aug – 21 Aug', days: 2, status: 'PENDING' },
    { id: 'lr2', name: 'Ananya Sharma', role: 'SALES EXEC', type: 'Casual Leave', dates: '22 Aug', days: 1, status: 'PENDING' },
    { id: 'lr3', name: 'Karan Mehta', role: 'TEAM LEADER', type: 'Earned Leave', dates: '25 Aug – 28 Aug', days: 4, status: 'APPROVED' },
  ]);

  // ─── SALES EXEC STATE ────────────────────────────────────────────────────────
  const [checkedIn, setCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState<string | null>('09:00 AM');

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const toggleUserLock = (usrId: string) => {
    setUserLocks(prev => ({ ...prev, [usrId]: !prev[usrId] }));
  };

  const togglePermission = (key: string) => {
    setPermissionToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLeaveAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(item => item.id === id ? { ...item, status: action } : item));
  };

  const handleCheckInToggle = () => {
    if (checkedIn) {
      setCheckedIn(false);
      setCheckInTime(null);
    } else {
      setCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 👑 Top Header Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={{ width: 42, height: 42, borderRadius: 12 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🔒 ROLE: {selectedRole.replace('_', ' ')} (AUTHENTICATED)</Text>
              </View>
              <Text style={styles.companyName}>{currentUser.companyName}</Text>
            </View>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{subscription.planType.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* 🔒 Session Banner */}
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionBannerText}>
            🔒 Scoped Workspace View: <Text style={{ color: '#818cf8', fontWeight: '900' }}>{selectedRole.replace('_', ' ')}</Text>. All tools &amp; metrics synchronized with web.
          </Text>
        </View>

        {/* ========================================================================= */}
        {/* 🏢 1. TENANT ADMIN DASHBOARD */}
        {/* ========================================================================= */}
        {selectedRole === 'ADMIN' && (
          <View style={styles.roleContainer}>
            <Text style={styles.dashboardSubtitle}>Multi-Tenant System Control &amp; Ingestion Engine</Text>

            {/* Quick Action Bar */}
            <View style={styles.quickActionBar}>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Import Leads', 'Launching CSV / Excel Lead Import Wizard.')}>
                <Text style={styles.quickActionText}>📥 Import Leads</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Google Sheets Sync', 'Connecting Google Sheet URL for live 2-way sync.')}>
                <Text style={styles.quickActionText}>🟢 Connect Sheet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('AI Lead Engine', 'Executing AI Lead Funnel Distribution Algorithm.')}>
                <Text style={styles.quickActionText}>⚡ Run AI Distr.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Telemetry Report', 'Exporting CSV telemetry & audit report.')}>
                <Text style={styles.quickActionText}>📊 Export Log</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={styles.statTag}>+12.4%</Text>
                </View>
                <Text style={styles.statValue}>1,420</Text>
                <Text style={styles.statLabel}>Total Ingested Leads</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={[styles.statTag, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)' }]}>+$38.4k</Text>
                </View>
                <Text style={[styles.statValue, { color: '#34d399' }]}>$148,500</Text>
                <Text style={styles.statLabel}>Pipeline Value</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={[styles.statTag, { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.15)' }]}>LIVE</Text>
                </View>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>42</Text>
                <Text style={styles.statLabel}>Fresh Unassigned</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>🎯</Text>
                  <Text style={[styles.statTag, { color: '#c084fc', backgroundColor: 'rgba(168,85,247,0.15)' }]}>+4.2%</Text>
                </View>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>28.5%</Text>
                <Text style={styles.statLabel}>Conversion Target</Text>
              </View>
            </View>

            {/* WIDGET 1: 3-Model Lead Funnel Distribution Engine */}
            <Text style={styles.sectionTitle}>3-Model Lead Distribution Strategy</Text>
            <View style={styles.cardBox}>
              <View style={styles.tabRow}>
                {(['BATCH_QUOTA', 'VANISH_POOL', 'MANUAL'] as const).map(strat => (
                  <TouchableOpacity
                    key={strat}
                    style={[styles.tabBtn, routingStrategy === strat && styles.tabBtnActive]}
                    onPress={() => setRoutingStrategy(strat)}
                  >
                    <Text style={[styles.tabBtnText, routingStrategy === strat && styles.tabBtnTextActive]}>
                      {strat === 'BATCH_QUOTA' ? '📦 Batch' : strat === 'VANISH_POOL' ? '⏳ Vanish' : '✋ Manual'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {routingStrategy === 'BATCH_QUOTA' && (
                <View style={styles.configBox}>
                  <Text style={styles.configTitle}>Batch Quota Distribution (Cap per Rep)</Text>
                  <Text style={styles.configDesc}>Auto-allocates fixed quota batch to available active reps.</Text>
                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>Batch Limit: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{batchQuotaLimit} leads</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.adjBtn} onPress={() => setBatchQuotaLimit(Math.max(5, batchQuotaLimit - 5))}>
                        <Text style={styles.adjBtnText}>- 5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adjBtn} onPress={() => setBatchQuotaLimit(batchQuotaLimit + 5)}>
                        <Text style={styles.adjBtnText}>+ 5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {routingStrategy === 'VANISH_POOL' && (
                <View style={styles.configBox}>
                  <Text style={styles.configTitle}>Vanish Pool Timeout (Re-assignment timer)</Text>
                  <Text style={styles.configDesc}>Leads not called within timeout return to global pool.</Text>
                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>Timeout: <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{vanishTimeoutMins} mins</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.adjBtn} onPress={() => setVanishTimeoutMins(Math.max(10, vanishTimeoutMins - 10))}>
                        <Text style={styles.adjBtnText}>- 10m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adjBtn} onPress={() => setVanishTimeoutMins(vanishTimeoutMins + 10)}>
                        <Text style={styles.adjBtnText}>+ 10m</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {routingStrategy === 'MANUAL' && (
                <View style={styles.configBox}>
                  <Text style={styles.configTitle}>Manual Lead Allocation Mode</Text>
                  <Text style={styles.configDesc}>All fresh leads held in unassigned pool for TL/Admin manual push.</Text>
                </View>
              )}
            </View>

            {/* WIDGET 2: Team Hierarchy & Security Locks */}
            <Text style={styles.sectionTitle}>Team Security Locks &amp; Hierarchy Controls</Text>
            <View style={styles.cardBox}>
              {[
                { id: 'usr_rep1', name: 'Rajesh Kumar', role: 'SALES EXEC', team: 'Team Alpha' },
                { id: 'usr_rep2', name: 'Ananya Sharma', role: 'SALES EXEC', team: 'Team Beta' },
                { id: 'usr_rep3', name: 'Karan Mehta', role: 'TEAM LEADER', team: 'Team Gamma' },
              ].map((rep, idx) => (
                <View key={rep.id} style={[styles.infoRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{rep.name}</Text>
                    <Text style={styles.teamSub}>{rep.role} • {rep.team}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.lockBtn, userLocks[rep.id] ? styles.lockBtnLocked : styles.lockBtnActive]}
                    onPress={() => toggleUserLock(rep.id)}
                  >
                    <Text style={[styles.lockBtnText, userLocks[rep.id] && { color: '#f87171' }]}>
                      {userLocks[rep.id] ? '🔒 Locked' : '🔓 Active'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* WIDGET 3: Role Permission Policy Matrix */}
            <Text style={styles.sectionTitle}>Role Permission Policy Matrix</Text>
            <View style={styles.cardBox}>
              <View style={styles.tabRow}>
                {(['MANAGER', 'TEAM_LEADER', 'SALES_EXEC', 'HR'] as const).map(pRole => (
                  <TouchableOpacity
                    key={pRole}
                    style={[styles.tabBtn, policyRole === pRole && styles.tabBtnActive]}
                    onPress={() => setPolicyRole(pRole)}
                  >
                    <Text style={[styles.tabBtnText, policyRole === pRole && styles.tabBtnTextActive]}>
                      {pRole.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {[
                { key: 'viewCallCounts', label: 'View Telemetry Call Counts' },
                { key: 'viewCallDurations', label: 'View Call Duration Audits' },
                { key: 'viewRevenueFigures', label: 'View Revenue & Pipeline' },
                { key: 'viewCustomerPII', label: 'View Unmasked Customer PII' },
              ].map((perm, idx) => (
                <View key={perm.key} style={[styles.infoRow, idx < 3 && styles.borderBottom]}>
                  <Text style={styles.infoLabel}>{perm.label}</Text>
                  <Switch
                    value={permissionToggles[perm.key]}
                    onValueChange={() => togglePermission(perm.key)}
                    trackColor={{ false: '#1e293b', true: 'rgba(99,102,241,0.5)' }}
                    thumbColor={permissionToggles[perm.key] ? '#6366f1' : '#64748b'}
                  />
                </View>
              ))}
            </View>

            {/* WIDGET 4: Ingestion Channels & Data History */}
            <Text style={styles.sectionTitle}>Lead Ingestion Audit &amp; Sync History</Text>
            <View style={styles.cardBox}>
              <View style={styles.tabRow}>
                {(['DATEWISE', 'FILE_UPLOADS', 'GSHEETS'] as const).map(hTab => (
                  <TouchableOpacity
                    key={hTab}
                    style={[styles.tabBtn, historyTab === hTab && styles.tabBtnActive]}
                    onPress={() => setHistoryTab(hTab)}
                  >
                    <Text style={[styles.tabBtnText, historyTab === hTab && styles.tabBtnTextActive]}>
                      {hTab === 'DATEWISE' ? '📈 Datewise' : hTab === 'FILE_UPLOADS' ? '📁 Files' : '🟢 Sheets'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {historyTab === 'DATEWISE' && (
                <View style={{ gap: 8 }}>
                  {[
                    { date: 'Today (19 Aug)', total: 42, gsheets: 24, file: 12, ads: 6 },
                    { date: 'Yesterday (18 Aug)', total: 58, gsheets: 30, file: 18, ads: 10 },
                    { date: '17 Aug 2026', total: 64, gsheets: 35, file: 20, ads: 9 },
                  ].map((row, i) => (
                    <View key={i} style={[styles.infoRow, i < 2 && styles.borderBottom]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamName}>{row.date}</Text>
                        <Text style={styles.teamSub}>Sheets: {row.gsheets} • Uploads: {row.file} • Ads: {row.ads}</Text>
                      </View>
                      <Text style={[styles.statValue, { fontSize: 15 }]}>{row.total}</Text>
                    </View>
                  ))}
                </View>
              )}

              {historyTab === 'FILE_UPLOADS' && (
                <View style={{ gap: 8 }}>
                  {[
                    { file: 'August_Leads_Master.xlsx', size: '2.4 MB', count: 24, status: 'SUCCESS' },
                    { file: 'Mumbai_Contacts.csv', size: '480 KB', count: 18, status: 'SUCCESS' },
                  ].map((f, i) => (
                    <View key={i} style={[styles.infoRow, i < 1 && styles.borderBottom]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamName}>{f.file}</Text>
                        <Text style={styles.teamSub}>{f.size} • {f.count} leads</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>✓ {f.status}</Text>
                    </View>
                  ))}
                </View>
              )}

              {historyTab === 'GSHEETS' && (
                <View style={{ gap: 8 }}>
                  {[
                    { title: 'Inbound_Leads_2026.gsheet', status: 'LIVE SYNC', count: 142 },
                    { title: 'Meta_Form_Sync.gsheet', status: 'LIVE SYNC', count: 98 },
                  ].map((s, i) => (
                    <View key={i} style={[styles.infoRow, i < 1 && styles.borderBottom]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamName}>{s.title}</Text>
                        <Text style={styles.teamSub}>{s.count} total ingested</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>🟢 {s.status}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 👥 2. HR MANAGEMENT DASHBOARD */}
        {/* ========================================================================= */}
        {selectedRole === 'HR' && (
          <View style={styles.roleContainer}>
            <Text style={styles.dashboardSubtitle}>Human Resources, Attendance &amp; Payroll Management</Text>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>24</Text>
                <Text style={styles.statLabel}>Employees Audited</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>19 / 24</Text>
                <Text style={styles.statLabel}>Present Today (79.2%)</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>
                  {leaveRequests.filter(l => l.status === 'PENDING').length}
                </Text>
                <Text style={styles.statLabel}>Pending Leave Requests</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
                <Text style={styles.statIcon}>💳</Text>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>₹8.4L</Text>
                <Text style={styles.statLabel}>Payroll (24 Payslips)</Text>
              </View>
            </View>

            {/* Attendance Breakdown */}
            <Text style={styles.sectionTitle}>Today's Detailed Attendance Breakdown</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Rajesh Kumar', role: 'Sales Executive', manager: 'Amit Shah', time: '09:05 AM', status: 'Present', color: '#34d399' },
                { name: 'Priya Sharma', role: 'Sales Executive', manager: 'Amit Shah', time: '09:32 AM', status: 'Late', color: '#fbbf24' },
                { name: 'Sunita Verma', role: 'Senior Executive', manager: 'Neha Joshi', time: '—', status: 'On Leave', color: '#c084fc' },
                { name: 'Amit Shah', role: 'Manager', manager: 'Vikram Singh', time: '08:58 AM', status: 'Present', color: '#34d399' },
              ].map((row, i) => (
                <View key={row.name} style={[styles.infoRow, i < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{row.name}</Text>
                    <Text style={styles.teamSub}>{row.role} • Under {row.manager}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{row.time}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: row.color }}>{row.status}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Monthly Payroll Breakdown */}
            <Text style={styles.sectionTitle}>Monthly Payroll Structure</Text>
            <View style={styles.cardBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Base Salary Total</Text>
                <Text style={styles.infoVal}>$52,400</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Incentives &amp; Bonuses</Text>
                <Text style={[styles.infoVal, { color: '#34d399' }]}>+$8,600</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Deductions (ESI / PF)</Text>
                <Text style={[styles.infoVal, { color: '#f87171' }]}>-$3,200</Text>
              </View>
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 }]}>
                <Text style={[styles.infoLabel, { color: '#ffffff', fontWeight: '800' }]}>Net Processed Payroll</Text>
                <Text style={[styles.infoVal, { color: '#c084fc', fontSize: 14 }]}>$64,200</Text>
              </View>
            </View>

            {/* Interactive Leave Queue */}
            <Text style={styles.sectionTitle}>Leave Requests Queue</Text>
            <View style={styles.cardBox}>
              {leaveRequests.map((req, idx) => (
                <View key={req.id} style={[{ paddingVertical: 8 }, idx < leaveRequests.length - 1 && styles.borderBottom]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.teamName}>{req.name} ({req.role})</Text>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: req.status === 'APPROVED' ? '#34d399' : req.status === 'REJECTED' ? '#f87171' : '#fbbf24'
                    }}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.teamSub}>📋 {req.type} • {req.dates} ({req.days} day{req.days > 1 ? 's' : ''})</Text>
                  {req.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.leaveActionBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}
                        onPress={() => handleLeaveAction(req.id, 'APPROVED')}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#34d399' }}>✓ Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.leaveActionBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}
                        onPress={() => handleLeaveAction(req.id, 'REJECTED')}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#f87171' }}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 📈 3. DEPARTMENT MANAGER DASHBOARD */}
        {/* ========================================================================= */}
        {selectedRole === 'MANAGER' && (
          <View style={styles.roleContainer}>
            <Text style={styles.dashboardSubtitle}>Sales Operations &amp; Revenue Target Tracking</Text>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
                <Text style={styles.statIcon}>💼</Text>
                <Text style={[styles.statValue, { color: '#818cf8' }]}>₹24.8L</Text>
                <Text style={styles.statLabel}>Department Revenue</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>14 Reps</Text>
                <Text style={styles.statLabel}>Supervised Employees</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>34.8%</Text>
                <Text style={styles.statLabel}>Conversion Rate</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>142</Text>
                <Text style={styles.statLabel}>Open Leads Queue</Text>
              </View>
            </View>

            {/* Revenue Progress Bar */}
            <Text style={styles.sectionTitle}>Department Monthly Goal (₹24.8L / ₹30.0L)</Text>
            <View style={styles.cardBox}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '82%' }]} />
              </View>
              <Text style={styles.progressText}>82% achieved • ₹5.2L remaining to monthly target</Text>
            </View>

            {/* Subordinate Performance Table */}
            <Text style={styles.sectionTitle}>Subordinate Unit Performance (Scenario A)</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Amit Shah', role: 'Team Leader', leads: 42, won: 18, rev: '₹9.4L', pct: '85%' },
                { name: 'Neha Joshi', role: 'Team Leader', leads: 38, won: 14, rev: '₹7.8L', pct: '78%' },
                { name: 'Rajesh Kumar', role: 'Sales Executive', leads: 31, won: 12, rev: '₹5.2L', pct: '74%' },
              ].map((row, idx) => (
                <View key={idx} style={[styles.teamRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{row.name}</Text>
                    <Text style={styles.teamSub}>{row.role} • {row.leads} Leads ({row.won} Won)</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.teamProgress, { fontSize: 13 }]}>{row.rev}</Text>
                    <View style={styles.goalBadge}>
                      <Text style={styles.goalBadgeText}>{row.pct} Goal</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Pipeline Stage Breakdown */}
            <Text style={styles.sectionTitle}>Pipeline Stage Breakdown</Text>
            <View style={styles.cardBox}>
              {[
                { stage: 'New Lead', count: 42, value: '₹4.2L', color: '#38bdf8' },
                { stage: 'Qualified', count: 28, value: '₹5.6L', color: '#818cf8' },
                { stage: 'Proposal Sent', count: 16, value: '₹3.8L', color: '#c084fc' },
                { stage: 'In Negotiation', count: 12, value: '₹2.4L', color: '#fbbf24' },
                { stage: 'Won Deals', count: 18, value: '₹8.8L', color: '#34d399' },
              ].map((st, i) => (
                <View key={st.stage} style={[styles.infoRow, i < 4 && styles.borderBottom]}>
                  <Text style={styles.infoLabel}>{st.stage} ({st.count})</Text>
                  <Text style={[styles.infoVal, { color: st.color }]}>{st.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 🛡️ 4. TEAM LEADER DASHBOARD */}
        {/* ========================================================================= */}
        {selectedRole === 'TEAM_LEADER' && (
          <View style={styles.roleContainer}>
            <Text style={styles.dashboardSubtitle}>Team Unit Workspace &amp; Rep Supervison</Text>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={[styles.statValue, { color: '#818cf8' }]}>₹14.2L</Text>
                <Text style={styles.statLabel}>Team Unit Revenue</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>5 Execs</Text>
                <Text style={styles.statLabel}>Supervised Reps</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>18</Text>
                <Text style={styles.statLabel}>Unassigned Queue</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(239,68,68,0.3)' }]}>
                <Text style={styles.statIcon}>⚠️</Text>
                <Text style={[styles.statValue, { color: '#f87171' }]}>3</Text>
                <Text style={styles.statLabel}>Overdue Tasks</Text>
              </View>
            </View>

            {/* Rep Leaderboard */}
            <Text style={styles.sectionTitle}>Supervised Reps Performance &amp; Lead Assignment</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Rajesh Kumar', leads: 31, won: 12, rev: '₹5.2L', calls: 84 },
                { name: 'Priya Sharma', leads: 24, won: 8, rev: '₹3.1L', calls: 65 },
                { name: 'Amit Patel', leads: 18, won: 5, rev: '₹2.4L', calls: 52 },
              ].map((rep, idx) => (
                <View key={rep.name} style={[styles.teamRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{rep.name}</Text>
                    <Text style={styles.teamSub}>{rep.leads} Leads Assigned • {rep.calls} Calls</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.teamProgress, { fontSize: 13 }]}>{rep.rev}</Text>
                    <TouchableOpacity
                      style={styles.dialButton}
                      onPress={() => Alert.alert('Assign Lead', `Assigning fresh lead to ${rep.name}`)}
                    >
                      <Text style={styles.dialButtonText}>Assign →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Live Agent Monitor */}
            <Text style={styles.sectionTitle}>Live Agent Call Status</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Rajesh Rep', calls: '38 Calls', status: 'IN CALL (04:12)' },
                { name: 'Ananya Rep', calls: '29 Calls', status: 'IDLE' },
                { name: 'Karan Rep', calls: '42 Calls', status: 'IN CALL (01:45)' },
              ].map((agent, idx) => (
                <View key={idx} style={[styles.teamRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{agent.name}</Text>
                    <Text style={styles.teamSub}>{agent.calls} made today</Text>
                  </View>
                  <View style={[styles.statusTag, agent.status.includes('CALL') ? styles.statusCall : styles.statusIdle]}>
                    <Text style={styles.statusTagText}>{agent.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 🎯 5. SALES EXEC WORKSPACE */}
        {/* ========================================================================= */}
        {selectedRole === 'SALES_EXEC' && (
          <View style={styles.roleContainer}>
            <Text style={styles.dashboardSubtitle}>Personal Dialing Queue &amp; Attendance Logger</Text>

            {/* 4 Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={[styles.statValue, { color: '#818cf8' }]}>31</Text>
                <Text style={styles.statLabel}>My Assigned Leads</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>₹5.2L</Text>
                <Text style={styles.statLabel}>Closed Deals Value</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>38.7%</Text>
                <Text style={styles.statLabel}>Personal Best Rate</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>5</Text>
                <Text style={styles.statLabel}>Tasks Due Today</Text>
              </View>
            </View>

            {/* Interactive Attendance Logger */}
            <Text style={styles.sectionTitle}>Attendance Logger</Text>
            <View style={styles.cardBox}>
              <View style={styles.infoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>Status: {checkedIn ? 'PRESENT' : 'NOT CHECKED IN'}</Text>
                  <Text style={styles.teamSub}>{checkedIn ? `Checked in at ${checkInTime}` : 'Tap button to log attendance'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, checkedIn ? styles.checkOutBtn : styles.checkInBtn]}
                  onPress={handleCheckInToggle}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: checkedIn ? '#f87171' : '#34d399' }}>
                    {checkedIn ? '🚪 Check Out' : '⏱️ Check In Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* My Tasks & Follow-ups */}
            <Text style={styles.sectionTitle}>My Tasks &amp; Follow-ups Today</Text>
            <View style={styles.cardBox}>
              {[
                { title: 'Follow up with Rajesh Kumar', lead: 'TechCorp Ltd', time: 'Today 2:00 PM', priority: 'HIGH' },
                { title: 'Send quotation to TechCorp', lead: 'TechCorp Ltd', time: 'Today 5:00 PM', priority: 'HIGH' },
                { title: 'Schedule demo — Real Estate', lead: 'Priya Sharma', time: 'Tomorrow', priority: 'MEDIUM' },
              ].map((t, idx) => (
                <View key={idx} style={[styles.infoRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{t.title}</Text>
                    <Text style={styles.teamSub}>{t.lead} • {t.time}</Text>
                  </View>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>{t.priority}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* ⚡ UNIVERSAL WIDGET 1: 🔥 HOT AI SCORED LEADS */}
        {/* ========================================================================= */}
        <View style={styles.roleContainer}>
          <Text style={styles.sectionTitle}>🔥 Hot AI Scored Leads</Text>
          <View style={styles.cardBox}>
            {[
              { name: 'Lakshmi Automobiles', score: 98, val: '₹12.0L', status: 'Won' },
              { name: 'TechCorp Ltd', score: 91, val: '₹5.2L', status: 'Proposal' },
              { name: 'Rajesh Kumar', score: 85, val: '₹2.4L', status: 'Qualified' },
            ].map((l, i) => (
              <View key={l.name} style={[styles.teamRow, i < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{l.name}</Text>
                  <Text style={styles.teamSub}>{l.val} • Status: {l.status}</Text>
                </View>
                <View style={styles.aiScoreBadge}>
                  <Text style={styles.aiScoreText}>🔥 {l.score}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 📋 UNIVERSAL WIDGET 2: RECENT INGESTED LEADS TABLE */}
        {/* ========================================================================= */}
        <View style={styles.roleContainer}>
          <Text style={styles.sectionTitle}>📋 Recent Ingested Leads</Text>
          <View style={styles.cardBox}>
            {[
              { name: 'Rajesh Kumar', email: 'rajesh@example.com', status: 'Qualified', val: '₹2.4L', src: 'Website', score: 85, owner: 'RK' },
              { name: 'Priya Sharma', email: 'priya@example.com', status: 'New', val: '₹1.8L', src: 'LinkedIn', score: 72, owner: 'PS' },
              { name: 'TechCorp Ltd', email: 'contact@techcorp.com', status: 'Proposal', val: '₹5.2L', src: 'Referral', score: 91, owner: 'TC' },
            ].map((lead, i) => (
              <View key={lead.name} style={[styles.infoRow, i < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{lead.name}</Text>
                  <Text style={styles.teamSub}>{lead.email} • {lead.src}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={[styles.teamProgress, { fontSize: 13 }]}>{lead.val}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={styles.miniScoreBar}>
                      <View style={[styles.miniScoreFill, { width: `${lead.score}%` }]} />
                    </View>
                    <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '800' }}>{lead.score}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* ⚡ UNIVERSAL WIDGET 3: LIVE ACTIVITY STREAM */}
        {/* ========================================================================= */}
        <View style={styles.roleContainer}>
          <Text style={styles.sectionTitle}>⚡ Live System Activity Stream</Text>
          <View style={styles.cardBox}>
            {[
              { icon: '🟢', text: 'New lead "TechCorp Ltd" imported via Google Sheets Sync', time: '10m ago' },
              { icon: '📞', text: 'Call logged by Rajesh Kumar with lead Vikram Mehta (04:12)', time: '25m ago' },
              { icon: '💰', text: 'Deal "Lakshmi Automobiles" marked as WON ($12.0L)', time: '1h ago' },
              { icon: '📦', text: 'Batch quota lead distribution executed for 3 active reps', time: '2h ago' },
            ].map((act, i) => (
              <View key={i} style={[styles.infoRow, i < 3 && styles.borderBottom]}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>{act.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teamSub, { color: '#f8fafc', fontSize: 11 }]}>{act.text}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{act.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16, alignItems: 'center' },

  headerCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    padding: 14,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },
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
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  sessionBannerText: { fontSize: 11, color: '#a5b4fc', fontWeight: '600', lineHeight: 16 },

  quickActionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  quickActionBtn: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  quickActionText: { color: '#a5b4fc', fontSize: 10, fontWeight: '800' },

  roleContainer: { width: '100%', maxWidth: 600 },
  dashboardSubtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, letterSpacing: 0.2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 140,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statIcon: { fontSize: 16 },
  statTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: { fontSize: 19, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  cardBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },

  tabRow: { flexDirection: 'row', backgroundColor: '#020617', borderRadius: 10, padding: 3, marginBottom: 12, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.25)' },
  tabBtnText: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  tabBtnTextActive: { color: '#a5b4fc' },

  configBox: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  configTitle: { fontSize: 12, fontWeight: '700', color: '#f8fafc', marginBottom: 2 },
  configDesc: { fontSize: 10, color: '#64748b', marginBottom: 10 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterLabel: { fontSize: 11, color: '#94a3b8' },
  adjBtn: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adjBtnText: { fontSize: 11, fontWeight: '800', color: '#a5b4fc' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoVal: { fontSize: 12, fontWeight: '800', color: '#ffffff' },

  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  teamName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  teamSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  teamProgress: { fontSize: 12, fontWeight: '800', color: '#34d399' },

  lockBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  lockBtnActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  lockBtnLocked: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  lockBtnText: { fontSize: 10, fontWeight: '800', color: '#34d399' },

  leaveActionBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center' },

  progressTrack: { height: 8, backgroundColor: '#020617', borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  progressBar: { height: '100%', backgroundColor: '#34d399', borderRadius: 999 },
  progressText: { fontSize: 10, color: '#64748b' },

  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusCall: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)' },
  statusIdle: { backgroundColor: 'rgba(148,163,184,0.15)', borderColor: 'rgba(148,163,184,0.3)' },
  statusTagText: { fontSize: 9, fontWeight: '800', color: '#38bdf8' },

  dialButton: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  dialButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  checkInBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  checkOutBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },

  priorityBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 9, fontWeight: '800', color: '#fbbf24' },

  aiScoreBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aiScoreText: { fontSize: 11, fontWeight: '900', color: '#34d399' },

  goalBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  goalBadgeText: { fontSize: 9, fontWeight: '800', color: '#34d399' },

  miniScoreBar: { width: 48, height: 4, backgroundColor: '#020617', borderRadius: 999, overflow: 'hidden' },
  miniScoreFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 999 },
});
