/**
 * DashboardScreen.tsx — DAS CRM Android (Tab 1: Home / Reports)
 * Focused on Executive Performance Reports, Summary Cards, Upcoming Leads,
 * and Recent 5 Leads preview with a View More Leads button.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

interface DashboardScreenProps {
  userRole?: UserRole;
  onNavigateToLeads?: () => void;
  onNavigateToAttendance?: () => void;
}

export default function DashboardScreen({ userRole, onNavigateToLeads }: DashboardScreenProps) {
  const { currentUser, subscription } = useAuthStore();
  const selectedRole: UserRole = normalizeRoleStr(userRole || currentUser.role);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 👑 Top Executive Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={{ width: 40, height: 40, borderRadius: 10 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>🔒 ROLE: {selectedRole.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.companyName}>{currentUser.companyName}</Text>
            </View>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{subscription.planType.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* 📊 Executive Performance Summary Cards */}
        <Text style={styles.sectionTitle}>Executive Performance Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>1,420</Text>
            <Text style={styles.statLabel}>Total Ingested Leads</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: '#34d399' }]}>$148,500</Text>
            <Text style={styles.statLabel}>Pipeline Value</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>42</Text>
            <Text style={styles.statLabel}>Fresh Unassigned</Text>
          </View>

          <View style={[styles.statCard, { borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={[styles.statValue, { color: '#c084fc' }]}>28.5%</Text>
            <Text style={styles.statLabel}>Conversion Target</Text>
          </View>
        </View>

        {/* 📅 UPCOMING LEADS & FOLLOW-UPS */}
        <Text style={styles.sectionTitle}>Upcoming Lead Follow-ups</Text>
        <View style={styles.cardBox}>
          {[
            { title: 'Call Rajesh Kumar — Quote Discussion', time: 'Today 2:00 PM', priority: 'HIGH' },
            { title: 'Demo Presentation for TechCorp', time: 'Today 4:30 PM', priority: 'HIGH' },
            { title: 'Follow-up with Sunita Real Estate', time: 'Tomorrow 11:00 AM', priority: 'MEDIUM' },
          ].map((u, i) => (
            <View key={i} style={[styles.infoRow, i < 2 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{u.title}</Text>
                <Text style={styles.teamSub}>📅 {u.time}</Text>
              </View>
              <View style={styles.priorityTag}>
                <Text style={styles.priorityText}>{u.priority}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 📋 RECENT 5 LEADS PREVIEW WIDGET */}
        <View style={{ width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Recent 5 Ingested Leads</Text>
          <TouchableOpacity onPress={onNavigateToLeads}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#818cf8' }}>View More Leads →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardBox}>
          {[
            { name: 'Rajesh Kumar', company: 'TechCorp Ltd', val: '₹5,20,000', status: 'Proposal', score: 91 },
            { name: 'Priya Sharma', company: 'LogiTech Solutions', val: '₹3,50,000', status: 'Won', score: 98 },
            { name: 'Vikram Mehta', company: 'Acme Sales Solutions', val: '₹1,42,000', status: 'Qualified', score: 85 },
            { name: 'Sunita Rao', company: 'Real Estate Group', val: '₹8,50,000', status: 'Negotiation', score: 77 },
            { name: 'Amit Patel', company: 'Global Freight Ltd', val: '₹90,000', status: 'New Lead', score: 63 },
          ].map((l, idx) => (
            <View key={l.name} style={[styles.infoRow, idx < 4 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{l.name}</Text>
                <Text style={styles.teamSub}>{l.company} • {l.status}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={[styles.teamProgress, { fontSize: 13 }]}>{l.val}</Text>
                <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>🔥 Score {l.score}</Text>
              </View>
            </View>
          ))}

          {/* View More Button */}
          <TouchableOpacity
            style={styles.viewMoreBtn}
            onPress={onNavigateToLeads}
            activeOpacity={0.8}
          >
            <Text style={styles.viewMoreBtnText}>View All Leads &amp; Distribution Controls →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16, alignItems: 'center' },

  headerCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    padding: 12,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginBottom: 2,
  },
  roleBadgeText: { fontSize: 8, fontWeight: '800', color: '#a5b4fc' },
  companyName: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  planPill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planPillText: { fontSize: 9, fontWeight: '800', color: '#34d399' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 130,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
  },
  statIcon: { fontSize: 15, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginBottom: 1 },
  statLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },

  cardBox: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  teamName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  teamSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  teamProgress: { fontSize: 12, fontWeight: '800', color: '#34d399' },

  priorityTag: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 8, fontWeight: '800', color: '#fbbf24' },

  viewMoreBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  viewMoreBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '800' },
});
