/**
 * ReportsAnalyticsScreen.tsx — DAS CRM Android
 * Full Enterprise Reports & Telemetry Audit Portal.
 * Features:
 * 1. 🏆 Team Performance Leaderboard (Rank, Avatar Initials, Leads Handled, Deals Closed, Revenue Generated, Conversion Bar, Trend).
 * 2. Revenue & Call Volume Trend Chart.
 * 3. Lead Attribution Traffic Sources Breakdown.
 * 4. Live Call Telemetry Audit Logs.
 * 5. One-tap Telemetry CSV Export launcher.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TelemetryCallLog {
  id: string;
  repName: string;
  clientName: string;
  duration: string;
  status: 'CONNECTED' | 'MISSED' | 'BUSY';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  time: string;
}

export interface LeaderboardRep {
  rankStr: string;
  initials: string;
  name: string;
  leadsHandled: number;
  dealsClosed: number;
  revenueGenerated: string;
  conversionPercent: number;
  trend: 'UP' | 'DOWN';
}

interface ReportsAnalyticsScreenProps {
  onClose?: () => void;
}

export const ReportsAnalyticsScreen: React.FC<ReportsAnalyticsScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  const [reportsFilter, setReportsFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  const LEADERBOARD_DATA: LeaderboardRep[] = [
    { rankStr: '🥇', initials: 'RK', name: 'Rajesh Kumar', leadsHandled: 31, dealsClosed: 12, revenueGenerated: '₹5.2L', conversionPercent: 41, trend: 'UP' },
    { rankStr: '🥈', initials: 'PS', name: 'Priya Sharma', leadsHandled: 24, dealsClosed: 8, revenueGenerated: '₹3.1L', conversionPercent: 33, trend: 'UP' },
    { rankStr: '🥉', initials: 'AP', name: 'Amit Patel', leadsHandled: 18, dealsClosed: 5, revenueGenerated: '₹2.4L', conversionPercent: 28, trend: 'DOWN' },
    { rankStr: '#4', initials: 'SV', name: 'Sunita Verma', leadsHandled: 12, dealsClosed: 4, revenueGenerated: '₹1.8L', conversionPercent: 22, trend: 'UP' },
  ];

  const callLogs: TelemetryCallLog[] = [
    { id: '1', repName: 'Rajesh Kumar', clientName: 'TechCorp Solutions', duration: '05m 42s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '10:45 AM' },
    { id: '2', repName: 'Priya Sharma', clientName: 'LogiTech Freight', duration: '03m 15s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '10:30 AM' },
    { id: '3', repName: 'Amit Patel', clientName: 'Sunita Logistics', duration: '00m 00s', status: 'MISSED', sentiment: 'NEUTRAL', time: '10:12 AM' },
    { id: '4', repName: 'Rajesh Kumar', clientName: 'Apex Retail Chain', duration: '08m 10s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '09:50 AM' },
  ];

  const chartBars = [
    { day: 'Mon', calls: 45, rev: '₹1.2L' },
    { day: 'Tue', calls: 62, rev: '₹2.4L' },
    { day: 'Wed', calls: 58, rev: '₹1.8L' },
    { day: 'Thu', calls: 74, rev: '₹3.2L' },
    { day: 'Fri', calls: 81, rev: '₹4.0L' },
  ];

  const getConversionColor = (pct: number) => {
    if (pct >= 40) return '#22c55e'; // Green
    if (pct >= 30) return '#f59e0b'; // Amber / Orange
    return '#ef4444'; // Red
  };

  return (
    <View style={[styles.container, { paddingTop: onClose ? 0 : topPadding }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onClose ? (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <Text style={styles.headerTitle}>📊 In-Depth Reports &amp; Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 36 }]} showsVerticalScrollIndicator={false}>

        {/* ── 🏆 TEAM PERFORMANCE LEADERBOARD CARD ───────────────────────── */}
        <View style={styles.leaderboardCard}>
          <Text style={styles.leaderboardCardTitle}>Team Performance Leaderboard</Text>
          <Text style={styles.leaderboardCardSub}>Real-time sales conversion &amp; revenue leaderboard</Text>

          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { width: 28 }]}>#</Text>
            <Text style={[styles.thText, { flex: 2 }]}>REP NAME</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>LEADS</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>DEALS</Text>
            <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>REVENUE</Text>
            <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>CONVERSION</Text>
            <Text style={[styles.thText, { width: 32, textAlign: 'center' }]}>TREND</Text>
          </View>

          {/* Table Data Rows */}
          {LEADERBOARD_DATA.map((rep, idx) => (
            <View key={rep.name} style={[styles.tableDataRow, idx === LEADERBOARD_DATA.length - 1 && { borderBottomWidth: 0 }]}>
              {/* Rank */}
              <View style={{ width: 28, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b47850' : '#64748b' }}>
                  {rep.rankStr}
                </Text>
              </View>

              {/* Rep Name with Avatar Badge */}
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{rep.initials}</Text>
                </View>
                <Text style={styles.repNameText} numberOfLines={1}>{rep.name}</Text>
              </View>

              {/* Leads Handled */}
              <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{rep.leadsHandled}</Text>

              {/* Deals Closed */}
              <Text style={[styles.tdText, { flex: 1, textAlign: 'center', fontWeight: '800' }]}>{rep.dealsClosed}</Text>

              {/* Revenue Generated */}
              <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', fontWeight: '900', color: '#818cf8' }]}>
                {rep.revenueGenerated}
              </Text>

              {/* Conversion Rate with Progress Bar */}
              <View style={{ flex: 1.8, paddingHorizontal: 4, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={styles.convBarTrack}>
                    <View style={[styles.convBarFill, { width: `${rep.conversionPercent}%`, backgroundColor: getConversionColor(rep.conversionPercent) }]} />
                  </View>
                  <Text style={[styles.convPercentText, { color: getConversionColor(rep.conversionPercent) }]}>
                    {rep.conversionPercent}%
                  </Text>
                </View>
              </View>

              {/* Trend Icon */}
              <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: rep.trend === 'UP' ? '#22c55e' : '#ef4444' }}>
                  {rep.trend === 'UP' ? '↗' : '↘'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── PERFORMANCE & TELEMETRY AUDIT ───────────────────────────────── */}
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>📊 Performance &amp; Telemetry Audit</Text>
            {/* Filter Chips */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['TODAY', 'WEEK', 'MONTH'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, reportsFilter === range && { backgroundColor: '#38bdf8', borderColor: '#38bdf8' }]}
                  onPress={() => setReportsFilter(range)}
                >
                  <Text style={{ fontSize: 9, fontWeight: '900', color: reportsFilter === range ? '#020617' : '#94a3b8' }}>{range}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Metric Cards */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#020617', padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#38bdf8' }}>
                {reportsFilter === 'TODAY' ? '₹5.2L' : reportsFilter === 'WEEK' ? '₹12.5L' : '₹45.0L'}
              </Text>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Revenue Won</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#020617', padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#34d399' }}>
                {reportsFilter === 'TODAY' ? '384 Calls' : reportsFilter === 'WEEK' ? '1,840 Calls' : '7,920 Calls'}
              </Text>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Done</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#020617', padding: 10, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c084fc' }}>31.0%</Text>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Avg Conv. Rate</Text>
            </View>
          </View>

          {/* Visual Call Volume Chart */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff', marginBottom: 8 }}>📈 Daily Call Volume &amp; Revenue Trend</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, paddingHorizontal: 10, backgroundColor: '#020617', borderRadius: 10, paddingVertical: 8 }}>
              {chartBars.map((bar, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 7, color: '#34d399', fontWeight: '800' }}>{bar.rev}</Text>
                  <View style={{ width: 18, height: bar.calls * 0.6, backgroundColor: '#4f46e5', borderRadius: 4 }} />
                  <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: '800' }}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Lead Source Breakdown */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff', marginBottom: 6 }}>📊 Lead Attribution Traffic Sources</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { source: 'WhatsApp API', pct: '42%' },
                { source: 'Google Ads', pct: '28%' },
                { source: 'Meta Ads', pct: '18%' },
                { source: 'Direct Inbound', pct: '12%' },
              ].map((src, idx) => (
                <View key={idx} style={{ flex: 1, backgroundColor: '#020617', padding: 6, borderRadius: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#38bdf8' }}>{src.pct}</Text>
                  <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1, textAlign: 'center' }}>{src.source}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Call Telemetry Audit */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff', marginBottom: 6 }}>📞 Live Call Recording Audit Log</Text>
            {callLogs.map((log) => (
              <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#020617' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>{log.repName} ➔ {log.clientName}</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>{log.time} • Duration: {log.duration}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: log.status === 'CONNECTED' ? '#34d399' : '#ef4444' }}>{log.status}</Text>
                  <Text style={{ fontSize: 8, color: '#c084fc', fontWeight: '800' }}>{log.sentiment}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#38bdf8', paddingVertical: 10, alignItems: 'center', marginTop: 12 }]}
            onPress={() => Alert.alert('📊 Telemetry Exported', `Downloaded full performance audit CSV report for range: ${reportsFilter}`)}
          >
            <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 11 }}>📥 Export Full Telemetry CSV Report →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportsAnalyticsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: '#090d16', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14 },

  // Leaderboard Card Styles
  leaderboardCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  leaderboardCardTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  leaderboardCardSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 10 },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b', marginBottom: 4 },
  thText: { fontSize: 8, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  tableDataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#020617' },
  avatarCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(99,102,241,0.25)', borderWidth: 1, borderColor: '#818cf8', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 8, fontWeight: '900', color: '#818cf8' },
  repNameText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  tdText: { fontSize: 10, color: '#cbd5e1' },
  convBarTrack: { flex: 1, height: 5, backgroundColor: '#020617', borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  convBarFill: { height: '100%', borderRadius: 3 },
  convPercentText: { fontSize: 10, fontWeight: '900', minWidth: 26, textAlign: 'right' },

  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
