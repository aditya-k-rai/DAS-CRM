/**
 * TeamLeaderDashboardScreen.tsx — DAS CRM Android (Team Leader Unit Workspace)
 * Team unit revenue, rep performance leaderboard, call monitors, and attendance sync.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

interface ScreenProps {
  onNavigateToAttendance?: () => void;
}

export default function TeamLeaderDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { currentUser } = useAuthStore();
  const [selectedRep, setSelectedRep] = React.useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [selectedLeadToAssign, setSelectedLeadToAssign] = React.useState('LogiTech Freight Systems (₹3,50,000)');

  const [repsList, setRepsList] = React.useState([
    { name: 'Rajesh Kumar', leads: 31, won: 12, rev: '₹5.2L', calls: 84 },
    { name: 'Priya Sharma', leads: 24, won: 8, rev: '₹3.1L', calls: 65 },
    { name: 'Amit Patel', leads: 18, won: 5, rev: '₹2.4L', calls: 52 },
  ]);

  const handleConfirmAssignLead = () => {
    if (!selectedRep) return;
    setRepsList((prev) =>
      prev.map((r) => (r.name === selectedRep ? { ...r, leads: r.leads + 1 } : r))
    );
    setAssignModalOpen(false);
    Alert.alert(
      '✅ Lead Re-assigned',
      `Assigned "${selectedLeadToAssign}" to ${selectedRep} successfully!`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>🛡️ Team Leader Unit Workspace</Text>
          <Text style={styles.headerSub}>{currentUser.name} • {currentUser.companyName}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={styles.statVal}>₹14.2L</Text>
            <Text style={styles.statLbl}>Team Unit Revenue (🥇 #1)</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>{repsList.length} Execs</Text>
            <Text style={styles.statLbl}>Supervised Execs</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>18 Leads</Text>
            <Text style={styles.statLbl}>Unassigned Queue</Text>
          </View>
        </View>

        {/* Synchronized Attendance Status */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>⏱️ Attendance Logger</Text>
              <Text style={styles.cardSub}>Status: <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN (09:05 AM)</Text></Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rep Leaderboard */}
        <Text style={styles.sectionTitle}>Supervised Rep Leaderboard</Text>
        <View style={styles.cardBox}>
          {repsList.map((rep, idx) => (
            <View key={rep.name} style={[styles.itemRow, idx < repsList.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{rep.name}</Text>
                <Text style={styles.itemSub}>{rep.leads} Leads Assigned • {rep.calls} Calls</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.itemVal}>{rep.rev}</Text>
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => {
                    setSelectedRep(rep.name);
                    setAssignModalOpen(true);
                  }}
                >
                  <Text style={styles.assignBtnText}>Assign →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* 🎯 LEAD ASSIGNMENT MODAL */}
      <React.Fragment>
        {assignModalOpen && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#0f172a', borderRadius: 16, borderColor: '#1e293b', borderWidth: 1, padding: 18, gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#ffffff' }}>🎯 Assign Queue Lead to {selectedRep}</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>Select an unassigned inbound lead from the unit queue:</Text>

              {[
                'LogiTech Freight Systems (₹3,50,000)',
                'Sunita Logistics Pvt Ltd (₹8,90,000)',
                'Apex Digital Enterprise (₹1,80,000)',
              ].map((leadTitle) => (
                <TouchableOpacity
                  key={leadTitle}
                  style={[{ padding: 10, borderRadius: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, selectedLeadToAssign === leadTitle && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.12)' }]}
                  onPress={() => setSelectedLeadToAssign(leadTitle)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: selectedLeadToAssign === leadTitle ? '#818cf8' : '#ffffff' }}>{leadTitle}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 10, alignItems: 'center' }} onPress={() => setAssignModalOpen(false)}>
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, backgroundColor: '#4f46e5', borderRadius: 10, alignItems: 'center' }} onPress={handleConfirmAssignLead}>
                  <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>Confirm Assign →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </React.Fragment>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 24 },
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
  assignBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  assignBtnText: { fontSize: 10, color: '#ffffff', fontWeight: '800' },
  quickBarRow: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center' },
  quickChipText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },
});
