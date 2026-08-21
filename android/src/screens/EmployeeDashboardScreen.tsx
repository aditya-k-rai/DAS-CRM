/**
 * EmployeeDashboardScreen.tsx — DAS CRM Android (Sales Exec Workspace)
 * Personal assigned leads, direct priority dialing queue, post-call outcome telemetry,
 * closed deals, and attendance sync.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal from '../components/PostCallOutcomeModal';

interface ScreenProps {
  onNavigateToAttendance?: () => void;
}

export default function EmployeeDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { currentUser } = useAuthStore();

  const [activeCallLead, setActiveCallLead] = useState<{ id: string; name: string; phone: string } | null>(null);

  const handleDialQueueLead = (name: string, phone: string) => {
    const cleaned = (phone || '').replace(/[^\d+]/g, '');
    const dialUrl = `tel:${cleaned}`;
    Linking.openURL(dialUrl).catch(() => {
      Alert.alert('Dialing Direct', `Direct dialing ${cleaned} for ${name}...`);
    });

    callSyncEngine.initiateCall('queue-lead', name, phone);
    setActiveCallLead({ id: 'queue-lead', name, phone });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>🎯 Sales Executive Workspace</Text>
          <Text style={styles.headerSub}>{currentUser.name} • {currentUser.companyName}</Text>
        </View>

        {/* Personal Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={styles.statVal}>31 Leads</Text>
            <Text style={styles.statLbl}>My Assigned Leads</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>₹5.2L</Text>
            <Text style={styles.statLbl}>Closed Deals Value</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>38.7%</Text>
            <Text style={styles.statLbl}>Personal Best Rate</Text>
          </View>
        </View>

        {/* Synchronized Attendance Status Logger */}
        <View style={styles.cardBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>⏱️ Attendance Status</Text>
              <Text style={styles.cardSub}>Status: <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN (09:21 AM)</Text></Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Priority Dialing Queue */}
        <Text style={styles.sectionTitle}>My Priority Dialing Queue</Text>
        <View style={styles.cardBox}>
          {[
            { name: 'Rajesh Kumar', phone: '+91 98765 43210', company: 'TechCorp Ltd', score: 91, val: '₹5,20,000' },
            { name: 'Priya Sharma', phone: '+91 98123 45678', company: 'LogiTech Solutions', score: 85, val: '₹3,50,000' },
            { name: 'Amit Patel', phone: '+91 97111 22233', company: 'Global Freight', score: 72, val: '₹90,000' },
          ].map((lead, idx) => (
            <View key={lead.phone} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{lead.name}</Text>
                <Text style={styles.itemSub}>{lead.company} • {lead.phone}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.itemVal}>{lead.val}</Text>
                <TouchableOpacity style={styles.dialBtn} onPress={() => handleDialQueueLead(lead.name, lead.phone)}>
                  <Text style={styles.dialBtnText}>📞 Dial Direct</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Instant Post-Call Outcome Popup Modal */}
      {activeCallLead && (
        <PostCallOutcomeModal
          visible={!!activeCallLead}
          leadId={activeCallLead.id}
          leadName={activeCallLead.name}
          phone={activeCallLead.phone}
          onClose={() => setActiveCallLead(null)}
          onSaveOutcome={() => setActiveCallLead(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: '#818cf8' },
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

  dialBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dialBtnText: { fontSize: 10, color: '#34d399', fontWeight: '800' },
  quickBarRow: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center' },
  quickChipText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },
});
