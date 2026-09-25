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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal from '../components/PostCallOutcomeModal';

interface ScreenProps {
  onNavigateToAttendance?: () => void;
}

export default function EmployeeDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.headerBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🎯 Sales Executive Workspace</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{currentUser.name} • {currentUser.companyName}</Text>
        </View>

        {/* Personal Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={[styles.statVal, { color: colors.text }]}>0 Leads</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>My Assigned Leads</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>₹0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Closed Deals Value</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>0.0%</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Personal Best Rate</Text>
          </View>
        </View>

        {/* Synchronized Attendance Status Logger */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Attendance Status</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>Status: <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN</Text></Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Priority Dialing Queue */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Priority Dialing Queue</Text>
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingVertical: 20 }]}>
          <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
            📭 No priority leads in dialing queue
          </Text>
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
