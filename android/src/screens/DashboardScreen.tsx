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

export default function DashboardScreen() {
  const [activeFilter, setActiveFilter] = useState('ALL');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 👑 Top Header Banner (Matching Web Layout) */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={{ width: 44, height: 44, borderRadius: 12 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>ROLE: ADMIN • WORKSPACE ACTIVE</Text>
              </View>
              <Text style={styles.companyName}>Acme Sales Solutions</Text>
            </View>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>PRO PLAN</Text>
            </View>
          </View>
        </View>

        {/* 📊 6 KPI Metric Cards Grid (Matching Web TenantAdminDashboard) */}
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          {/* Card 1 */}
          <View style={[styles.statCard, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statTag}>+12.4%</Text>
            </View>
            <Text style={styles.statValue}>1,420</Text>
            <Text style={styles.statLabel}>Total Leads Ingested</Text>
          </View>

          {/* Card 2 */}
          <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statTag, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)' }]}>+$38.4k</Text>
            </View>
            <Text style={[styles.statValue, { color: '#34d399' }]}>$148,500</Text>
            <Text style={styles.statLabel}>Pipeline Value</Text>
          </View>

          {/* Card 3 */}
          <View style={[styles.statCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={[styles.statTag, { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.15)' }]}>LIVE ALERT</Text>
            </View>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>42</Text>
            <Text style={styles.statLabel}>Fresh Unassigned</Text>
          </View>

          {/* Card 4 */}
          <View style={[styles.statCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={[styles.statTag, { color: '#c084fc', backgroundColor: 'rgba(168,85,247,0.15)' }]}>+4.2%</Text>
            </View>
            <Text style={[styles.statValue, { color: '#c084fc' }]}>28.5%</Text>
            <Text style={styles.statLabel}>Conversion Target</Text>
          </View>

          {/* Card 5 */}
          <View style={[styles.statCard, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>📞</Text>
              <Text style={[styles.statTag, { color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)' }]}>98.2%</Text>
            </View>
            <Text style={[styles.statValue, { color: '#38bdf8' }]}>184</Text>
            <Text style={styles.statLabel}>Calls Logged Today</Text>
          </View>

          {/* Card 6 */}
          <View style={[styles.statCard, { borderColor: 'rgba(236, 72, 153, 0.3)' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={[styles.statTag, { color: '#f472b6', backgroundColor: 'rgba(236,72,153,0.15)' }]}>2 SEATS LEFT</Text>
            </View>
            <Text style={[styles.statValue, { color: '#f472b6' }]}>18/20</Text>
            <Text style={styles.statLabel}>Active Team Seats</Text>
          </View>
        </View>

        {/* 🌐 Integration Pipelines (Matching Web TenantAdminDashboard) */}
        <Text style={styles.sectionTitle}>Connected Ingestion Channels</Text>
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

          <View style={styles.channelCard}>
            <Text style={styles.channelIcon}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelName}>Excel Ingest Audit</Text>
              <Text style={styles.channelStatus}>8 Rows × 8 Columns Ingested</Text>
            </View>
            <Text style={[styles.channelPill, { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.15)' }]}>INGESTED</Text>
          </View>
        </View>

        {/* 📋 Recent Active Leads Feed (Matching Web Leads Table) */}
        <Text style={styles.sectionTitle}>Recent Ingested Leads</Text>
        <View style={styles.leadListCard}>
          {[
            { name: 'Vikram Mehta', company: 'Acme Corp', status: 'IN NEGOTIATION', value: '$14,200', source: 'Google Sheets' },
            { name: 'Sunita Rao', company: 'TechCorp India', status: 'NEW LEAD', value: '$8,500', source: 'Excel Import' },
            { name: 'Rajesh Kumar', company: 'Starlight Media', status: 'QUALIFIED', value: '$22,000', source: 'Meta Ads' },
          ].map((lead, idx) => (
            <View key={idx} style={[styles.leadItemRow, idx < 2 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadSub}>{lead.company} • {lead.source}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.leadValue}>{lead.value}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{lead.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

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
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },
  companyName: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  planPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  planPillText: { fontSize: 10, fontWeight: '800', color: '#34d399' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 10, letterSpacing: 0.2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIcon: { fontSize: 18 },
  statTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  channelsGrid: { gap: 8, marginBottom: 20 },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  channelIcon: { fontSize: 18 },
  channelName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  channelStatus: { fontSize: 11, color: '#94a3b8' },
  channelPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  leadListCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  leadItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  leadName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  leadSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  leadValue: { fontSize: 13, fontWeight: '800', color: '#34d399', textAlign: 'right' },
  statusBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  statusBadgeText: { fontSize: 8, fontWeight: '800', color: '#818cf8' },
});
