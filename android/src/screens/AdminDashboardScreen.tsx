/**
 * AdminDashboardScreen.tsx — DAS CRM Android (Tenant Admin Workspace)
 * System telemetry, multi-tenant ingestion history, staff attendance audit,
 * and today's operations & sales telemetry.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

interface ScreenProps {
  onNavigateToAttendance?: () => void;
}

export default function AdminDashboardScreen({ onNavigateToAttendance }: ScreenProps) {
  const { currentUser, subscription } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 👑 HEADER BANNER */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>👑 Tenant Admin Command Center</Text>
          <Text style={styles.headerSub}>{currentUser.companyName} • Plan: {subscription.planType}</Text>
        </View>

        {/* 📊 ROW 1: PRIMARY FINANCIAL & LEAD KPI CARDS */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>Revenue (Won)</Text>
            <Text style={[styles.statVal, { color: '#34d399' }]}>$128,400</Text>
            <Text style={styles.statSubLbl}>↑ +14.2% closed</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(129, 140, 248, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>Active Pipeline</Text>
            <Text style={[styles.statVal, { color: '#ffffff' }]}>$412,000</Text>
            <Text style={[styles.statSubLbl, { color: '#818cf8' }]}>42 Open Deals</Text>
          </View>
        </View>

        {/* 📊 ROW 2: LEADS & CONVERSION TARGET CARDS */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(96, 165, 250, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>Total Leads</Text>
            <Text style={[styles.statVal, { color: '#93c5fd' }]}>3,420</Text>
            <Text style={styles.statSubLbl}>Multi-Source</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(192, 132, 252, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>Conversion Rate</Text>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>14.2%</Text>
            <Text style={styles.statSubLbl}>Target: 15.0%</Text>
          </View>
        </View>

        {/* 📊 ROW 3: SEATS & TRIAL SYSTEM STATUS CARDS */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(251, 191, 36, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>Active Seats</Text>
            <Text style={[styles.statVal, { color: '#fcd34d' }]}>18 / 20</Text>
            <Text style={styles.statSubLbl}>2 Seats Free</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
            <Text style={styles.cardHeaderLbl}>System Status</Text>
            <Text style={[styles.statVal, { color: '#34d399', fontSize: 13, marginTop: 4 }]}>TRIAL_ACTIVE</Text>
            <Text style={styles.statSubLbl}>Full Tier Enabled</Text>
          </View>
        </View>

        {/* 🆕 BOX 7: TOTAL EMPLOYEES & EMPLOYEES PRESENT */}
        <View style={[styles.cardBox, { borderColor: 'rgba(20, 184, 166, 0.4)', backgroundColor: 'rgba(20, 184, 166, 0.06)' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={[styles.cardTitle, { color: '#2dd4bf' }]}>👥 Workforce &amp; Attendance Today</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#2dd4bf' }}>79.2% Rate</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff' }}>19 Present</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>/ 24 Total Employees</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '700' }}>🟢 19 Present</Text>
            <Text style={{ fontSize: 10, color: '#c084fc', fontWeight: '700' }}>🟣 3 On Leave</Text>
            <Text style={{ fontSize: 10, color: '#f87171', fontWeight: '700' }}>🔴 2 Absent</Text>
          </View>
        </View>

        {/* 🆕 BOX 8: TODAY'S OPERATIONS & SALES TELEMETRY */}
        <View style={[styles.cardBox, { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.06)' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={[styles.cardTitle, { color: '#34d399' }]}>⚡ Today's Sales &amp; Operations Telemetry</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>$18,450 Today</Text>
          </View>
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>142</Text>
              <Text style={styles.telemetryLbl}>Leads Allocated</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#818cf8' }]}>384</Text>
              <Text style={styles.telemetryLbl}>Calls Done</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#34d399' }]}>820</Text>
              <Text style={styles.telemetryLbl}>Msgs Sent</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#fbbf24' }]}>8</Text>
              <Text style={styles.telemetryLbl}>Deals Closed</Text>
            </View>
          </View>
        </View>

        {/* ⏱️ SYNCHRONIZED ATTENDANCE CONTROL */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>⏱️ Admin Attendance Status</Text>
              <Text style={styles.cardSub}>Status: <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN (08:30 AM)</Text></Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LIVE INGESTION HISTORY */}
        <Text style={styles.sectionTitle}>Multi-Source Ingestion Telemetry</Text>
        <View style={styles.cardBox}>
          {[
            { title: 'Google Sheets Live Sync', status: 'LIVE SYNC', count: 142 },
            { title: 'Excel File Uploads', status: 'BATCH COMPLETE', count: 98 },
            { title: 'Meta Ads Webhook', status: 'ACTIVE HOOK', count: 64 },
          ].map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.count} leads ingested</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>🟢 {item.status}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16, alignItems: 'center' },
  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12 },
  cardHeaderLbl: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  statVal: { fontSize: 16, fontWeight: '900', color: '#818cf8', marginTop: 2 },
  statSubLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontWeight: '700' },
  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  telemetryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  telemetryItem: { alignItems: 'center', flex: 1 },
  telemetryVal: { fontSize: 15, fontWeight: '900', color: '#93c5fd' },
  telemetryLbl: { fontSize: 8, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});
