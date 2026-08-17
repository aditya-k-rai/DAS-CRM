import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';

export default function DashboardScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 👑 Top Header Banner (Matching Web Layout) */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={{ width: 42, height: 42, borderRadius: 12 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>ACTIVE ROLE: {selectedRole.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.companyName}>Acme Sales Solutions</Text>
            </View>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>PRO PLAN</Text>
            </View>
          </View>
        </View>

        {/* 🔀 Role Perspective Switcher Bar (Matching Web RoleDashboardRouter) */}
        <Text style={styles.sectionTitle}>Dashboard Control & Perspective</Text>
        <View style={styles.roleSwitchGrid}>
          {(['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleSwitchPill, selectedRole === r && styles.roleSwitchPillActive]}
              onPress={() => setSelectedRole(r)}
            >
              <Text style={[styles.roleSwitchText, selectedRole === r && styles.roleSwitchTextActive]}>
                {r.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🏢 1. TENANT ADMIN DASHBOARD */}
        {selectedRole === 'ADMIN' && (
          <View style={styles.roleViewContainer}>
            <Text style={styles.dashboardSubtitle}>Multi-Tenant System Control & Performance Metrics</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={styles.statTag}>+12.4%</Text>
                </View>
                <Text style={styles.statValue}>1,420</Text>
                <Text style={styles.statLabel}>Total Ingested Leads</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={[styles.statTag, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)' }]}>+$38.4k</Text>
                </View>
                <Text style={[styles.statValue, { color: '#34d399' }]}>$148,500</Text>
                <Text style={styles.statLabel}>Pipeline Value</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={[styles.statTag, { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.15)' }]}>LIVE ALERT</Text>
                </View>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>42</Text>
                <Text style={styles.statLabel}>Fresh Unassigned</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>🎯</Text>
                  <Text style={[styles.statTag, { color: '#c084fc', backgroundColor: 'rgba(168,85,247,0.15)' }]}>+4.2%</Text>
                </View>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>28.5%</Text>
                <Text style={styles.statLabel}>Conversion Target</Text>
              </View>
            </View>

            {/* Integration Channels */}
            <Text style={styles.sectionTitle}>Ingestion Channels Status</Text>
            <View style={styles.channelsGrid}>
              <View style={styles.channelCard}>
                <Text style={styles.channelIcon}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.channelName}>Google Sheets Sync</Text>
                  <Text style={styles.channelStatus}>Live 2-Way Realtime</Text>
                </View>
                <Text style={styles.channelPill}>ACTIVE</Text>
              </View>
              <View style={styles.channelCard}>
                <Text style={styles.channelIcon}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.channelName}>WhatsApp Cloud API</Text>
                  <Text style={styles.channelStatus}>1,420 Messages Sent</Text>
                </View>
                <Text style={[styles.channelPill, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)' }]}>CONNECTED</Text>
              </View>
            </View>
          </View>
        )}

        {/* 👥 2. HR MANAGEMENT DASHBOARD */}
        {selectedRole === 'HR' && (
          <View style={styles.roleViewContainer}>
            <Text style={styles.dashboardSubtitle}>Human Resources, Attendance & Salary Overview</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>45</Text>
                <Text style={styles.statLabel}>Total Staff Members</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>95.5%</Text>
                <Text style={styles.statLabel}>Attendance Rate Today</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>3</Text>
                <Text style={styles.statLabel}>Leave Requests Pending</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                <Text style={styles.statIcon}>💳</Text>
                <Text style={[styles.statValue, { color: '#c084fc' }]}>$64,200</Text>
                <Text style={styles.statLabel}>Monthly Payroll Total</Text>
              </View>
            </View>

            {/* Attendance Breakdown */}
            <Text style={styles.sectionTitle}>Attendance Summary Today</Text>
            <View style={styles.cardBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Present Staff</Text>
                <Text style={[styles.infoVal, { color: '#34d399' }]}>43 Employees</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>On Approved Leave</Text>
                <Text style={[styles.infoVal, { color: '#fbbf24' }]}>2 Employees</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Late Arrivals</Text>
                <Text style={[styles.infoVal, { color: '#f87171' }]}>1 Employee</Text>
              </View>
            </View>
          </View>
        )}

        {/* 📈 3. MANAGER DASHBOARD */}
        {selectedRole === 'MANAGER' && (
          <View style={styles.roleViewContainer}>
            <Text style={styles.dashboardSubtitle}>Sales Operations & Revenue Target Tracking</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>74.2%</Text>
                <Text style={styles.statLabel}>Monthly Revenue Target</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                <Text style={styles.statIcon}>💼</Text>
                <Text style={styles.statValue}>$148,500</Text>
                <Text style={styles.statLabel}>Achieved Revenue</Text>
              </View>
            </View>

            {/* Team Leader Performance Table */}
            <Text style={styles.sectionTitle}>Team Leader Progress</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Amit Shah (Team Alpha)', deals: '18 Deals', revenue: '$64,000', progress: '85%' },
                { name: 'Priya Sharma (Team Beta)', deals: '14 Deals', revenue: '$48,500', progress: '72%' },
                { name: 'Rohan Verma (Team Gamma)', deals: '10 Deals', revenue: '$36,000', progress: '60%' },
              ].map((team, idx) => (
                <View key={idx} style={[styles.teamRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamSub}>{team.deals} • {team.revenue}</Text>
                  </View>
                  <Text style={styles.teamProgress}>{team.progress}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 🛡️ 4. TEAM LEADER DASHBOARD */}
        {selectedRole === 'TEAM_LEADER' && (
          <View style={styles.roleViewContainer}>
            <Text style={styles.dashboardSubtitle}>Agent Live Call Monitoring & Lead Allocation</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                <Text style={styles.statIcon}>📞</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>184</Text>
                <Text style={styles.statLabel}>Calls Logged Today</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>14</Text>
                <Text style={styles.statLabel}>Follow-ups Pending</Text>
              </View>
            </View>

            {/* Live Agent Monitor */}
            <Text style={styles.sectionTitle}>Agent Call Status</Text>
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

        {/* 🎯 5. SALES EXEC WORKSPACE */}
        {selectedRole === 'SALES_EXEC' && (
          <View style={styles.roleViewContainer}>
            <Text style={styles.dashboardSubtitle}>Personal Dialing Queue & Follow-up Tasks</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>24</Text>
                <Text style={styles.statLabel}>Assigned Leads</Text>
              </View>

              <View style={[styles.statCard, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                <Text style={styles.statIcon}>📞</Text>
                <Text style={styles.statValue}>38</Text>
                <Text style={styles.statLabel}>Calls Made Today</Text>
              </View>
            </View>

            {/* Personal Lead Queue */}
            <Text style={styles.sectionTitle}>Priority Calling Queue</Text>
            <View style={styles.cardBox}>
              {[
                { name: 'Vikram Mehta', phone: '+91 98765 43210', deal: '$14,200', action: 'DIAL NOW' },
                { name: 'Sunita Rao', phone: '+91 98123 45678', deal: '$8,500', action: 'DIAL NOW' },
              ].map((lead, idx) => (
                <View key={idx} style={[styles.teamRow, idx < 1 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{lead.name}</Text>
                    <Text style={styles.teamSub}>{lead.phone} • {lead.deal}</Text>
                  </View>
                  <TouchableOpacity style={styles.dialButton}>
                    <Text style={styles.dialButtonText}>📞 {lead.action}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },

  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 14,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },
  companyName: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  planPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planPillText: { fontSize: 9, fontWeight: '800', color: '#34d399' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, letterSpacing: 0.2 },

  roleSwitchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  roleSwitchPill: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleSwitchPillActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#6366f1' },
  roleSwitchText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  roleSwitchTextActive: { color: '#818cf8' },

  roleViewContainer: { marginTop: 2 },
  dashboardSubtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '48%',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: { fontSize: 19, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  channelsGrid: { gap: 8, marginBottom: 16 },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  channelIcon: { fontSize: 16 },
  channelName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  channelStatus: { fontSize: 10, color: '#94a3b8' },
  channelPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  cardBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoVal: { fontSize: 12, fontWeight: '800' },

  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  teamName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  teamSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  teamProgress: { fontSize: 12, fontWeight: '800', color: '#34d399' },

  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusCall: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' },
  statusIdle: { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: 'rgba(148, 163, 184, 0.3)' },
  statusTagText: { fontSize: 9, fontWeight: '800', color: '#38bdf8' },

  dialButton: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  dialButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
});
