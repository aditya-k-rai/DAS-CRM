import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface ReportsAnalyticsScreenProps {
  onClose?: () => void;
}

export const ReportsAnalyticsScreen: React.FC<ReportsAnalyticsScreenProps> = ({ onClose }) => {
  const [reportsFilter, setReportsFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
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
            {/* Date Filter Chips */}
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

          {/* Team Leaderboard */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff', marginBottom: 8 }}>🏆 Sales Rep Leaderboard ({reportsFilter})</Text>
            {[
              { name: 'Rajesh Kumar', calls: reportsFilter === 'TODAY' ? '64 Calls' : '312 Calls', closed: '₹5,20,000' },
              { name: 'Amit Patel', calls: reportsFilter === 'TODAY' ? '52 Calls' : '248 Calls', closed: '₹3,50,000' },
              { name: 'Priya Sharma', calls: reportsFilter === 'TODAY' ? '48 Calls' : '210 Calls', closed: '₹2,45,000' },
            ].map((rep, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#020617' }}>
                <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '700' }}>#{idx + 1} {rep.name}</Text>
                <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>{rep.calls} • {rep.closed}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#38bdf8', paddingVertical: 10, alignItems: 'center', marginTop: 12 }]}
            onPress={() => Alert.alert('📊 Report Exported', `Generated telemetry & performance CSV audit report for range: ${reportsFilter}`)}
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
