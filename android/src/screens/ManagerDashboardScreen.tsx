/**
 * ManagerDashboardScreen.tsx — DAS CRM Android (Department Manager Workspace)
 * Features:
 * 1. Department revenue managed, subordinate unit overview, and attendance sync.
 * 2. 📅 Department Staff Scheduled Meetings (Today & Upcoming) for assigned employees' leads only.
 * 3. Interactive Lead Inspector modal on tapping any scheduled meeting.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { callSyncEngine } from '../services/callSyncEngine';
import IngestionChannelsWidget from '../components/IngestionChannelsWidget';
import { TenantAdminHeaderBanner } from '../components/TenantAdminHeaderBanner';

export interface ManagerMeetingItem {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  email: string;
  value: string;
  assignedAgent: string;
  agentRole: string;
  meetingPurpose: string;
  scheduledTimeStr: string;
  isToday: boolean;
  status: 'CONFIRMED' | 'SCHEDULED';
}

const MOCK_MANAGER_MEETINGS: ManagerMeetingItem[] = [
  {
    id: 'mgr-mtg-1',
    leadId: 'lead-1',
    leadName: 'Rajesh Mehta',
    company: 'TechCorp Solutions Ltd',
    phone: '+91 98765 43210',
    email: 'rajesh@techcorp.com',
    value: '₹5,20,000',
    assignedAgent: 'Rajesh Kumar',
    agentRole: 'Sales Executive',
    meetingPurpose: 'Enterprise CRM Suite Demo & Technical Review',
    scheduledTimeStr: 'Today, 02:30 PM',
    isToday: true,
    status: 'CONFIRMED',
  },
  {
    id: 'mgr-mtg-2',
    leadId: 'lead-2',
    leadName: 'Priya Sharma',
    company: 'LogiTech Freight Systems',
    phone: '+91 98123 45678',
    email: 'priya@logitech.com',
    value: '₹3,50,000',
    assignedAgent: 'Amit Patel',
    agentRole: 'Sales Executive',
    meetingPurpose: 'WhatsApp Automation Bot Setup Review',
    scheduledTimeStr: 'Today, 04:45 PM',
    isToday: true,
    status: 'SCHEDULED',
  },
  {
    id: 'mgr-mtg-3',
    leadId: 'lead-3',
    leadName: 'Sunita Kapoor',
    company: 'Sunita Logistics Pvt Ltd',
    phone: '+91 97222 33344',
    email: 'sunita@sunitalogistics.com',
    value: '₹8,90,000',
    assignedAgent: 'Amit Shah',
    agentRole: 'Team Leader',
    meetingPurpose: 'Executive Contract Signing & License Rollout',
    scheduledTimeStr: 'Today, 06:15 PM',
    isToday: true,
    status: 'CONFIRMED',
  },
  {
    id: 'mgr-mtg-4',
    leadId: 'lead-5',
    leadName: 'Rakesh Verma',
    company: 'Verma Solutions',
    phone: '+91 98111 22233',
    email: 'rakesh@verma.com',
    value: '₹2,45,000',
    assignedAgent: 'Priya Sharma',
    agentRole: 'Sales Executive',
    meetingPurpose: 'AI Lead Scoring Engine Pro Walkthrough',
    scheduledTimeStr: '22 Aug 2026, 03:00 PM',
    isToday: false,
    status: 'SCHEDULED',
  },
  {
    id: 'mgr-mtg-5',
    leadId: 'lead-6',
    leadName: 'Deepa Nair',
    company: 'Nair Exports Ltd',
    phone: '+91 99888 77766',
    email: 'deepa@nair.com',
    value: '₹6,80,000',
    assignedAgent: 'Rajesh Kumar',
    agentRole: 'Sales Executive',
    meetingPurpose: 'Multi-Tenant Migration & SLA Review',
    scheduledTimeStr: '23 Aug 2026, 05:30 PM',
    isToday: false,
    status: 'SCHEDULED',
  },
];

interface ScreenProps {
  onNavigateToAttendance?: () => void;
  navigation?: any;
}

export default function ManagerDashboardScreen({ onNavigateToAttendance, navigation }: ScreenProps) {
  const { currentUser } = useAuthStore();

  const [meetingFilter, setMeetingFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('TODAY');
  const [selectedMeeting, setSelectedMeeting] = useState<ManagerMeetingItem | null>(null);

  const filteredMeetings = MOCK_MANAGER_MEETINGS.filter((m) => {
    if (meetingFilter === 'TODAY') return m.isToday;
    if (meetingFilter === 'UPCOMING') return !m.isToday;
    return true;
  });

  const todayCount = MOCK_MANAGER_MEETINGS.filter((m) => m.isToday).length;
  const upcomingCount = MOCK_MANAGER_MEETINGS.filter((m) => !m.isToday).length;

  const handleCallLeadDirect = (phone: string, leadName: string, leadId: string) => {
    const cleaned = (phone || '').replace(/[^\d+]/g, '');
    const dialUrl = `tel:${cleaned}`;
    Linking.openURL(dialUrl).catch(() => {
      Alert.alert('Dialing Direct', `Direct dialing ${cleaned} for ${leadName}...`);
    });
    callSyncEngine.initiateCall(leadId, leadName, phone);
  };

  const handleWhatsAppLeadDirect = (phone: string, leadName: string) => {
    let cleaned = (phone || '').replace(/[^\d]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    const waUrl = `whatsapp://send?phone=${cleaned}&text=Hi%20${encodeURIComponent(leadName)},%20following%20up%20regarding%20our%20scheduled%20meeting%20from%20DAS%20CRM.`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp Launch', `Opening WhatsApp for ${leadName}...`);
    });
  };

  const handleJumpToLeadDetail = (meeting: ManagerMeetingItem) => {
    setSelectedMeeting(null);
    try {
      navigation.navigate('Leads', {
        screen: 'LeadDetail',
        params: { leadId: meeting.leadId, leadName: meeting.leadName },
      });
    } catch {
      navigation.navigate('Leads');
    }
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: 4 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>

        {/* HEADER BANNER */}
        <TenantAdminHeaderBanner navigation={navigation} role="MANAGER" />

        {/* DEPARTMENT STAT CARDS */}
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

        {/* 🟢 LIVE INGESTION CHANNELS & TRAFFIC SOURCES WIDGET */}
        <IngestionChannelsWidget navigation={navigation} />

        {/* 📅 ASSIGNED EMPLOYEES SCHEDULED MEETINGS WIDGET */}
        <View style={[styles.cardBox, { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.06)' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.cardTitle, { color: '#818cf8' }]}>📅 Department Staff Scheduled Meetings</Text>
          </View>

          {/* Filter Bar */}
          <View style={styles.filterTabRow}>
            <TouchableOpacity
              style={[styles.filterChip, meetingFilter === 'TODAY' && styles.filterChipActive]}
              onPress={() => setMeetingFilter('TODAY')}
            >
              <Text style={[styles.filterChipText, meetingFilter === 'TODAY' && styles.filterChipTextActive]}>
                🟢 Today ({todayCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, meetingFilter === 'UPCOMING' && styles.filterChipActive]}
              onPress={() => setMeetingFilter('UPCOMING')}
            >
              <Text style={[styles.filterChipText, meetingFilter === 'UPCOMING' && styles.filterChipTextActive]}>
                🔵 Upcoming ({upcomingCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, meetingFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setMeetingFilter('ALL')}
            >
              <Text style={[styles.filterChipText, meetingFilter === 'ALL' && styles.filterChipTextActive]}>
                All Team ({MOCK_MANAGER_MEETINGS.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Meetings List */}
          <View style={{ marginTop: 8 }}>
            {filteredMeetings.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.meetingCardItem, idx < filteredMeetings.length - 1 && styles.borderBottom]}
                onPress={() => setSelectedMeeting(item)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.itemName}>{item.leadName}</Text>
                    <View style={[styles.statusPill, item.status === 'CONFIRMED' ? styles.pillConfirmed : styles.pillSched]}>
                      <Text style={[styles.statusPillText, item.status === 'CONFIRMED' ? { color: '#34d399' } : { color: '#38bdf8' }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemSub}>{item.company} • {item.phone}</Text>
                  <Text style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2, fontWeight: '700' }}>
                    💼 {item.meetingPurpose}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#818cf8', marginTop: 2, fontWeight: '800' }}>
                    👤 Supervised Rep: {item.assignedAgent} ({item.agentRole})
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.meetingTimeBadge, item.isToday ? { color: '#34d399' } : { color: '#38bdf8' }]}>
                    ⏰ {item.scheduledTimeStr}
                  </Text>
                  <Text style={styles.leadValBadge}>{item.value}</Text>
                  <Text style={{ fontSize: 9, color: '#38bdf8', fontWeight: '800', textDecorationLine: 'underline' }}>
                    Inspect Lead →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SYNCHRONIZED ATTENDANCE STATUS */}
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

        {/* SUBORDINATE PERFORMANCE OVERVIEW */}
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

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 SCHEDULED MEETING & LEAD INSPECTOR MODAL                                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!selectedMeeting} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {selectedMeeting && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>📅 Scheduled Meeting &amp; Lead Details</Text>
                  <Text style={styles.modalSub}>Scheduled: <Text style={{ color: '#34d399', fontWeight: '800' }}>{selectedMeeting.scheduledTimeStr}</Text></Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMeeting(null)} style={styles.modalCloseBtn}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>

                {/* Lead Profile Header Card */}
                <View style={styles.leadInspectHeaderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>{selectedMeeting.leadName}</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{selectedMeeting.company}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>{selectedMeeting.value}</Text>
                </View>

                {/* Meeting Agenda Card */}
                <View style={styles.inspectDetailBox}>
                  <Text style={styles.inspectLabel}>🎯 Meeting Agenda &amp; Purpose:</Text>
                  <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '700', marginTop: 2 }}>
                    {selectedMeeting.meetingPurpose}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.inspectLabel}>👤 Supervised Rep:</Text>
                    <Text style={{ fontSize: 11, color: '#818cf8', fontWeight: '800' }}>
                      {selectedMeeting.assignedAgent} ({selectedMeeting.agentRole})
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.inspectLabel}>📞 Phone:</Text>
                    <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '800' }}>{selectedMeeting.phone}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.inspectLabel}>✉️ Email:</Text>
                    <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '800' }}>{selectedMeeting.email}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => handleCallLeadDirect(selectedMeeting.phone, selectedMeeting.leadName, selectedMeeting.leadId)}
                  >
                    <Text style={styles.modalActionBtnText}>📞 Call Direct</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => handleWhatsAppLeadDirect(selectedMeeting.phone, selectedMeeting.leadName)}
                  >
                    <Text style={styles.modalActionBtnText}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.fullLeadBtn}
                  onPress={() => handleJumpToLeadDetail(selectedMeeting)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.fullLeadBtnText}>⚡ Open Full Lead File in Funnel →</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 24 },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  quickBarRow: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#4f46e5', alignItems: 'center' },
  quickChipText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '900', color: '#818cf8' },
  statLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  filterTabRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  filterChipTextActive: { color: '#818cf8', fontWeight: '900' },

  meetingCardItem: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  statusPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  pillConfirmed: { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' },
  pillSched: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.4)' },
  statusPillText: { fontSize: 8, fontWeight: '900' },

  meetingTimeBadge: { fontSize: 10, fontWeight: '900' },
  leadValBadge: { fontSize: 11, fontWeight: '900', color: '#34d399' },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  itemVal: { fontSize: 12, fontWeight: '800', color: '#34d399' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  leadInspectHeaderCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inspectDetailBox: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12 },
  inspectLabel: { fontSize: 10, fontWeight: '800', color: '#818cf8' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },

  modalActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modalActionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  fullLeadBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  fullLeadBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
