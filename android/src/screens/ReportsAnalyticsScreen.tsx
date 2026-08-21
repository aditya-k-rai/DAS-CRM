import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export interface TelemetryCallLog {
  id: string;
  repName: string;
  clientName: string;
  duration: string;
  status: 'CONNECTED' | 'MISSED' | 'BUSY';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  time: string;
}

interface ReportsAnalyticsScreenProps {
  onClose?: () => void;
}

export const ReportsAnalyticsScreen: React.FC<ReportsAnalyticsScreenProps> = ({ onClose }) => {
  const [reportsFilter, setReportsFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  const callLogs: TelemetryCallLog[] = [
    { id: '1', repName: 'Rajesh Kumar', clientName: 'TechCorp Solutions', duration: '05m 42s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '10:45 AM' },
    { id: '2', repName: 'Priya Sharma', clientName: 'LogiTech Freight', duration: '03m 15s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '10:30 AM' },
    { id: '3', repName: 'Amit Patel', clientName: 'Sunita Logistics', duration: '00m 00s', status: 'MISSED', sentiment: 'NEUTRAL', time: '10:12 AM' },
    { id: '4', repName: 'Rajesh Kumar', clientName: 'Apex Retail Chain', duration: '08m 10s', status: 'CONNECTED', sentiment: 'POSITIVE', time: '09:50 AM' },
  ];

  const chartBars = [
    { day: 'Mon', calls: 45, rev: '$12.4K' },
    { day: 'Tue', calls: 62, rev: '$24.8K' },
    { day: 'Wed', calls: 58, rev: '$18.2K' },
    { day: 'Thu', calls: 74, rev: '$32.5K' },
    { day: 'Fri', calls: 81, rev: '$40.5K' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📊 In-Depth Reports &amp; Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                {reportsFilter === 'TODAY' ? '$128.4K' : reportsFilter === 'WEEK' ? '$412.0K' : '$1.42M'}
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
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c084fc' }}>14.2%</Text>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Conv. Rate</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
