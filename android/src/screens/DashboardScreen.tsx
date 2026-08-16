import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      <Text style={styles.headerSubtitle}>Overview of performance & metrics</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Leads</Text>
          <Text style={styles.statValue}>142</Text>
          <Text style={styles.statTrend}>+12% this week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Closed Deals</Text>
          <Text style={styles.statValue}>$38.4k</Text>
          <Text style={styles.statTrend}>+8% target</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Open Tasks</Text>
          <Text style={styles.statValue}>18</Text>
          <Text style={styles.statTrend}>5 high priority</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Conversion</Text>
          <Text style={styles.statValue}>24.5%</Text>
          <Text style={styles.statTrend}>+3.2% vs avg</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#1e2333',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  statLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#f3f4f6', marginBottom: 4 },
  statTrend: { fontSize: 11, color: '#10b981', fontWeight: '500' },
});
