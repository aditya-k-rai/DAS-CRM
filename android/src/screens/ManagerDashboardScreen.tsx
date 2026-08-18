/**
 * ManagerDashboardScreen.tsx — DAS CRM Android (Department Manager Workspace)
 * Department revenue managed, subordinate unit overview, and attendance sync.
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

export default function ManagerDashboardScreen({ onNavigateToAttendance }: ScreenProps) {
  const { currentUser } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>📈 Department Manager Workspace</Text>
          <Text style={styles.headerSub}>{currentUser.name} • {currentUser.companyName}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={styles.statVal}>₹24.8L</Text>
            <Text style={styles.statLbl}>Dept Revenue (82% Goal)</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>14 Reps</Text>
            <Text style={styles.statLbl}>Supervised Staff</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>34.8%</Text>
            <Text style={styles.statLbl}>Conversion Rate</Text>
          </View>
        </View>

        {/* Synchronized Attendance Status */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>⏱️ Manager Attendance Status</Text>
              <Text style={styles.cardSub}>Status: <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN (08:58 AM)</Text></Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subordinate Performance Overview */}
        <Text style={styles.sectionTitle}>Subordinate Unit Performance</Text>
        <View style={styles.cardBox}>
          {[
            { name: 'Amit Shah', role: 'Team Leader', leads: 42, won: 18, rev: '₹9.4L', pct: '85%' },
            { name: 'Neha Joshi', role: 'Team Leader', leads: 38, won: 14, rev: '₹7.8L', pct: '78%' },
            { name: 'Rajesh Kumar', role: 'Sales Executive', leads: 31, won: 12, rev: '₹5.2L', pct: '74%' },
          ].map((row, idx) => (
            <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{row.name}</Text>
                <Text style={styles.itemSub}>{row.role} • {row.leads} Leads ({row.won} Won)</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.itemVal}>{row.rev}</Text>
                <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>{row.pct} Goal</Text>
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
  content: { padding: 16, alignItems: 'center' },
  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '900', color: '#818cf8' },
  statLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  itemVal: { fontSize: 12, fontWeight: '800', color: '#34d399' },
});
