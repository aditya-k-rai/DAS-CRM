/**
 * TeamLeaderDashboardScreen.tsx — DAS CRM Android (Team Leader Unit Workspace)
 * Complete 16-section Team Leader dashboard implementation:
 *  1. Dashboard & Header Banner (Home for all roles)
 *  2. My Team (Total Team Members, Active Members, Inactive Members)
 *  3. Leads (Team Total Leads, New Leads, Contacted, Qualified, Unqualified / Lost)
 *  4. Follow-ups (Due Today, Upcoming, Overdue, Completed)
 *  5. Sales (Open Opportunities, Won Deals, Lost Deals, Pipeline Value, Won Revenue)
 *  6. Team Activity
 *  7. Team Member Details
 *  8. Team Leads (All, Unassigned, New, Contacted, Qualified, Proposal, Negotiation, Converted, Lost)
 *  9. Lead Assignment (Distribute assigned leads)
 *  10. Unassigned Leads Queue
 *  11. Team Pipeline Overview
 *  12. Team Follow-ups
 *  13. Team Calls
 *  14. Team WhatsApp Direct
 *  15. Team WhatsApp Cloud
 *  16. Team Performance Leaderboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';

export default function TeamLeaderDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [selectedRep, setSelectedRep] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLeadToAssign, setSelectedLeadToAssign] = useState<string | null>(null);
  const [unassignedLeads, setUnassignedLeads] = useState<string[]>([
    'Solar Commercial Lead #1042 — Acme Mills',
    'Residential Solar Setup — Priya Sharma',
  ]);

  const [repsList, setRepsList] = useState<Array<{ name: string; leads: number; won: number; rev: string; calls: number }>>([
    { name: 'Nandini Rastogi', leads: 4, won: 1, rev: '₹45,000', calls: 14 },
    { name: 'Rajesh Verma', leads: 3, won: 0, rev: '₹0', calls: 8 },
  ]);

  const firstName = currentUser?.name?.split(' ')?.[0] || 'TL';

  const handleConfirmAssignLead = () => {
    if (!selectedRep || !selectedLeadToAssign) return;
    setRepsList((prev) =>
      prev.map((r) => (r.name === selectedRep ? { ...r, leads: r.leads + 1 } : r))
    );
    setUnassignedLeads((prev) => prev.filter((l) => l !== selectedLeadToAssign));
    setAssignModalOpen(false);
    Alert.alert(
      '✅ Lead Re-assigned',
      `Assigned "${selectedLeadToAssign}" to ${selectedRep} successfully!`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Dashboard & Header Banner ──────────────────────────────────── */}
        <View style={[styles.headerBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.avatarBox, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.avatarText}>{currentUser?.avatar || 'TL'}</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Welcome, {firstName}! 🛡️</Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  {currentUser?.companyName || 'DAS CRM Workspace'}
                </Text>
              </View>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>TEAM LEADER</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
            Team Unit Dashboard · Supervising Sales Executives & tracking unit performance.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.quickHeaderBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              onPress={() => navigation?.navigate('Leads')}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickHeaderBtnText, { color: colors.text }]}>🎯 Distribute Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickHeaderBtn, { backgroundColor: '#3b82f6', borderColor: '#2563eb' }]}
              onPress={() => navigation?.navigate('Menu', { initialModule: 'GOALS' })}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickHeaderBtnText, { color: '#ffffff' }]}>📈 Unit Goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. My Team ────────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.pillBar, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Team</Text>
          </View>
        </View>

        <View style={styles.grid3}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(59,130,246,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#60a5fa' }]}>{repsList.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Total Members</Text>
            <Text style={[styles.statSub, { color: '#60a5fa' }]}>Assigned unit</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>{repsList.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Active Members</Text>
            <Text style={[styles.statSub, { color: '#34d399' }]}>Working today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(239,68,68,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#f87171' }]}>0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Inactive</Text>
            <Text style={[styles.statSub, { color: '#f87171' }]}>On leave</Text>
          </View>
        </View>

        {/* ── 3. Leads ──────────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.pillBar, { backgroundColor: '#6366f1' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Leads</Text>
          </View>
          <TouchableOpacity onPress={() => navigation?.navigate('Leads')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridWrap}>
          {[
            { label: 'Team Leads', val: '7', color: '#818cf8', icon: '📋' },
            { label: 'New Leads', val: '2', color: '#34d399', icon: '✨' },
            { label: 'Contacted', val: '3', color: '#38bdf8', icon: '📞' },
            { label: 'Qualified', val: '1', color: '#fbbf24', icon: '⭐' },
            { label: 'Lost', val: '1', color: '#f87171', icon: '⚠️' },
          ].map(item => (
            <View key={item.label} style={[styles.miniStatCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 13 }}>{item.icon}</Text>
              <Text style={[styles.miniStatVal, { color: item.color }]}>{item.val}</Text>
              <Text style={[styles.miniStatLbl, { color: colors.textMuted }]} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── 4. Follow-ups ─────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.pillBar, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Follow-ups</Text>
          </View>
        </View>

        <View style={styles.gridWrap}>
          {[
            { label: 'Due Today', val: '2', color: '#fbbf24', dot: '#fbbf24' },
            { label: 'Upcoming', val: '3', color: '#38bdf8', dot: '#38bdf8' },
            { label: 'Overdue', val: '0', color: '#f87171', dot: '#f87171' },
            { label: 'Completed', val: '5', color: '#34d399', dot: '#34d399' },
          ].map(f => (
            <View key={f.label} style={[styles.followupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.statusDot, { backgroundColor: f.dot }]} />
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>{f.label}</Text>
              </View>
              <Text style={[styles.miniStatVal, { color: f.color, marginTop: 4 }]}>{f.val}</Text>
            </View>
          ))}
        </View>

        {/* ── 5. Sales ──────────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.pillBar, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales Overview</Text>
          </View>
        </View>

        <View style={styles.gridWrap}>
          {[
            { label: 'Open Opps', val: '3', color: '#38bdf8' },
            { label: 'Won Deals', val: '1', color: '#34d399' },
            { label: 'Lost Deals', val: '1', color: '#f87171' },
            { label: 'Pipeline Value', val: '₹1,20,000', color: '#c084fc' },
            { label: 'Won Revenue', val: '₹45,000', color: '#34d399' },
          ].map(s => (
            <View key={s.label} style={[styles.miniStatCard, { backgroundColor: colors.cardBg, borderColor: colors.border, minWidth: 95 }]}>
              <Text style={[styles.miniStatVal, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.miniStatLbl, { color: colors.textMuted }]} numberOfLines={1}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── 6. Team Activity & 7. Member Details ──────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Team Member Performance</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {repsList.map((rep, idx) => (
            <View key={rep.name} style={[styles.repRow, idx < repsList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{rep.name}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {rep.leads} Leads Assigned • {rep.calls} Calls Logged
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary }}>{rep.rev}</Text>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: '#3b82f6' }]}
                  onPress={() => {
                    setSelectedRep(rep.name);
                    setAssignModalOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>Assign Lead →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── 8. Team Leads (Pipeline Stages) ───────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔀 Team Leads (Workforce Structure Stages)</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, padding: 10 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { stage: 'All Leads', count: 7, color: '#94a3b8' },
              { stage: 'Unassigned', count: unassignedLeads.length, color: '#f59e0b' },
              { stage: 'New', count: 2, color: '#6366f1' },
              { stage: 'Contacted', count: 3, color: '#0ea5e9' },
              { stage: 'Qualified', count: 1, color: '#eab308' },
              { stage: 'Proposal', count: 1, color: '#a855f7' },
              { stage: 'Negotiation', count: 0, color: '#f97316' },
              { stage: 'Converted', count: 1, color: '#10b981' },
              { stage: 'Lost', count: 1, color: '#ef4444' },
            ].map(st => (
              <View key={st.stage} style={[styles.stagePill, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={[styles.stageCount, { color: st.color }]}>{st.count}</Text>
                <Text style={[styles.stageLabel, { color: colors.textMuted }]}>{st.stage}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 9 & 10. Lead Assignment & Unassigned Queue ────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 Lead Assignment & Queue</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Unassigned Queue ({unassignedLeads.length})</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Leads')}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>Manage Queue →</Text>
            </TouchableOpacity>
          </View>

          {unassignedLeads.length === 0 ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#34d399', fontWeight: '800' }}>✓ All team leads are assigned!</Text>
            </View>
          ) : (
            unassignedLeads.map((item, idx) => (
              <View key={idx} style={[styles.unassignedRow, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>{item}</Text>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={() => {
                    setSelectedLeadToAssign(item);
                    setSelectedRep(repsList[0]?.name || null);
                    setAssignModalOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>Distribute</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── 11, 12, 13, 14, 15: Comms Overview Grid ───────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💬 Team Communications & Touchpoints</Text>
        </View>

        <View style={styles.gridWrap}>
          {[
            { title: 'Team Calls', icon: '📞', count: '22', color: '#38bdf8', mod: null },
            { title: 'WA Direct', icon: '💬', count: '14', color: '#34d399', mod: 'WA_TEMPLATES' },
            { title: 'WA Cloud', icon: '☁️', count: '8', color: '#818cf8', mod: 'COMMUNICATIONS' },
            { title: 'Attendance', icon: '⏱️', count: '100%', color: '#34d399', mod: 'ATTENDANCE' },
          ].map(c => (
            <TouchableOpacity
              key={c.title}
              style={[styles.commCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => {
                if (c.mod === 'ATTENDANCE') onNavigateToAttendance?.();
                else if (c.mod) navigation?.navigate('Menu', { initialModule: c.mod });
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>{c.icon}</Text>
              <Text style={[styles.commVal, { color: c.color }]}>{c.count}</Text>
              <Text style={[styles.commLbl, { color: colors.textMuted }]}>{c.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 16. Team Performance ──────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Team Performance Leaderboard</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Unit Top Performer</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Nandini Rastogi (₹45,000 Won)</Text>
            </View>
            <View style={[styles.trophyPill, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }]}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fbbf24' }}>🏆 #1 Rank</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ── Lead Assignment Modal ──────────────────────────────────────────── */}
      <Modal visible={assignModalOpen} transparent animationType="fade" onRequestClose={() => setAssignModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
              🎯 Distribute Lead
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>
              Assign {selectedLeadToAssign || 'Lead'} to a team representative:
            </Text>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {repsList.map(rep => (
                <TouchableOpacity
                  key={rep.name}
                  style={[
                    styles.repSelectRow,
                    { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                    selectedRep === rep.name && { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)' },
                  ]}
                  onPress={() => setSelectedRep(rep.name)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: selectedRep === rep.name ? '#3b82f6' : colors.text }}>
                    {rep.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{rep.leads} Active Leads</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setAssignModalOpen(false)}
              >
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#3b82f6' }]}
                onPress={handleConfirmAssignLead}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>Confirm Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  avatarBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  roleBadge: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleBadgeText: { color: '#60a5fa', fontSize: 9, fontWeight: '800' },

  quickHeaderBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  quickHeaderBtnText: { fontSize: 11, fontWeight: '800' },

  sectionHeaderRow: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800' },
  pillBar: { width: 4, height: 14, borderRadius: 2 },

  cardBox: { width: '100%', maxWidth: 600, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },

  grid3: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: 8, fontWeight: '600', marginTop: 1, textAlign: 'center' },

  gridWrap: { width: '100%', maxWidth: 600, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  miniStatCard: { flex: 1, minWidth: 60, borderRadius: 12, borderWidth: 1, padding: 8, alignItems: 'center' },
  miniStatVal: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  miniStatLbl: { fontSize: 9, fontWeight: '600', marginTop: 2 },

  followupCard: { flex: 1, minWidth: 70, borderRadius: 12, borderWidth: 1, padding: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },

  repRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  smallActionBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  stagePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', minWidth: 70 },
  stageCount: { fontSize: 14, fontWeight: '900' },
  stageLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  unassignedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 6 },

  commCard: { flex: 1, minWidth: 68, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  commVal: { fontSize: 14, fontWeight: '900', marginTop: 3 },
  commLbl: { fontSize: 8, fontWeight: '700', marginTop: 2 },

  trophyPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 18, borderWidth: 1, padding: 18 },
  repSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
