/**
 * LeadDetailScreen.tsx — DAS CRM Android
 * Features:
 *  1. Working 📞 Call Now & 💬 WhatsApp Intent Launchers
 *  2. Synced Call Telemetry & Follow-up History Audit Widget
 *  3. 1-Day Ephemeral Call Storage notice with Midnight (12:00 AM) Purge Timer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LeadsStackParamList } from '../../App';
import { callSyncEngine, LeadCallSummary } from '../services/callSyncEngine';

type LeadDetailRouteProp = RouteProp<LeadsStackParamList, 'LeadDetail'>;

interface LeadDetailScreenProps {
  lead?: any;
  onBack?: () => void;
}

export default function LeadDetailScreen({ lead: propLead, onBack }: LeadDetailScreenProps) {
  const navigation = useNavigation();

  let lead = propLead;
  try {
    const route = useRoute<LeadDetailRouteProp>();
    if (route?.params) {
      const { leadId, leadName } = route.params;
      if (leadId && !lead) {
        lead = { id: leadId, name: leadName || 'Lead Detail', phone: '+91 98765 43210' };
      }
    }
  } catch {}

  const leadId = lead?.id || 'lead-1';
  const leadName = lead?.name || 'Lead Details';
  const leadPhone = lead?.phone || '+91 98765 43210';

  // Live Call Telemetry State
  const [telemetry, setTelemetry] = useState<LeadCallSummary>({
    lastCalledAt: 'Today, 2:45 PM',
    connectionStatus: 'CONNECTED',
    lastDurationStr: '4m 18s',
    totalTalkTimeSeconds: 258,
    incomingCount: 2,
    outgoingCount: 4,
    lastFollowupAt: 'Today, 2:45 PM',
  });

  const [hoursToMidnight, setHoursToMidnight] = useState(7);

  useEffect(() => {
    callSyncEngine.checkAndPurgeMidnightLogs();
    const secs = callSyncEngine.getSecondsUntilMidnight();
    setHoursToMidnight(Math.floor(secs / 3600));
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleCall = () => {
    callSyncEngine.initiateCall(leadId, leadName, leadPhone, (updated) => {
      setTelemetry(updated);
    });
  };

  const handleWhatsApp = () => {
    callSyncEngine.initiateWhatsApp(leadName, leadPhone);
  };

  const statusColor =
    lead?.status === 'WON'
      ? '#34d399'
      : lead?.status === 'IN NEGOTIATION'
      ? '#818cf8'
      : lead?.status === 'QUALIFIED'
      ? '#38bdf8'
      : lead?.status === 'CONTACTED'
      ? '#fbbf24'
      : '#94a3b8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back to Leads</Text>
        </TouchableOpacity>

        {/* Lead Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>
                {leadName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{leadName}</Text>
              <Text style={styles.company}>{lead?.company || 'Acme Partner'}</Text>
            </View>
            <View style={styles.valueBadge}>
              <Text style={styles.valueText}>{lead?.value || '$14,200'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{lead?.status || 'NEW LEAD'}</Text>
          </View>
        </View>

        {/* Action Buttons: 📞 CALL NOW & 💬 WHATSAPP */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Text style={styles.callBtnText}>📞 Call Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* ── 📞 SYNCED CALL HISTORY & TELEMETRY WIDGET ───────────────────── */}
        <Text style={styles.sectionTitle}>📞 Call Telemetry &amp; Follow-Up Audit</Text>
        <View style={styles.telemetryCard}>
          
          <View style={styles.telemetryHeaderRow}>
            <Text style={styles.telemetryHeaderTitle}>Call Log Sync Status</Text>
            <View style={styles.connectedPill}>
              <Text style={styles.connectedPillText}>🟢 {telemetry.connectionStatus}</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>{telemetry.lastDurationStr}</Text>
              <Text style={styles.telemetryLbl}>Talk Duration</Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#38bdf8' }]}>{telemetry.incomingCount} Calls</Text>
              <Text style={styles.telemetryLbl}>Incoming Calls</Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#fbbf24' }]}>{telemetry.outgoingCount} Calls</Text>
              <Text style={styles.telemetryLbl}>Outgoing Calls</Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <Text style={styles.metaLine}>
            ⏰ Last Called: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{telemetry.lastCalledAt}</Text>
          </Text>
          <Text style={styles.metaLine}>
            📅 Last Follow-up: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{telemetry.lastFollowupAt}</Text>
          </Text>

          {/* 1-Day Ephemeral Storage & Midnight Purge Notice */}
          <View style={styles.purgeNoticeBox}>
            <Text style={styles.purgeNoticeText}>
              ⌛ 1-Day Local Storage: Raw call logs auto-purge at Midnight 12:00 AM ({hoursToMidnight}h remaining). Cumulative lead telemetry is permanently saved.
            </Text>
          </View>
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.detailCard}>
          {[
            ['📞 Phone', leadPhone],
            ['✉️ Email', lead?.email || 'vikram@acme.com'],
            ['🏢 Company', lead?.company || 'Acme Corp'],
            ['🌐 Source', lead?.source || 'Google Sheets Sync'],
          ].map(([label, value], i) => (
            <View key={label} style={[styles.row, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },

  backButton: { marginBottom: 14 },
  backText: { color: '#818cf8', fontSize: 14, fontWeight: '700' },

  headerCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  valueBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueText: { fontSize: 12, fontWeight: '900', color: '#34d399' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  callBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  callBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },

  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsappBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 8, marginTop: 4 },

  telemetryCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  telemetryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  telemetryHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  connectedPill: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connectedPillText: { fontSize: 10, fontWeight: '800', color: '#34d399' },

  telemetryGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  telemetryItem: { flex: 1, backgroundColor: '#020617', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  telemetryVal: { fontSize: 15, fontWeight: '900', color: '#34d399' },
  telemetryLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  metaDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 8 },
  metaLine: { fontSize: 11, color: '#94a3b8', marginVertical: 2 },

  purgeNoticeBox: { backgroundColor: '#020617', borderRadius: 10, padding: 8, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' },
  purgeNoticeText: { fontSize: 10, color: '#a5b4fc', fontStyle: 'italic' },

  detailCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  rowValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
});
