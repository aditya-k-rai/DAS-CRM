/**
 * ProfileScreen.tsx — DAS CRM Android
 * Mirrors the web user profile panel in the Sidebar footer.
 * Reads live data from authStore (no more hardcoded "Vikram Mehta").
 */

import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { currentUser, subscription, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  // Role color coding — mirrors Sidebar role badge
  const roleColor =
    currentUser.role === 'ADMIN'
      ? '#818cf8'
      : currentUser.role === 'HR'
      ? '#38bdf8'
      : currentUser.role === 'MANAGER'
      ? '#c084fc'
      : currentUser.role === 'TEAM_LEADER'
      ? '#fbbf24'
      : '#34d399';

  // Plan badge color
  const planColor =
    subscription.planType === 'FREE_TRIAL'
      ? '#fbbf24'
      : subscription.planType === 'PRO' || subscription.planType === 'PRO_50'
      ? '#34d399'
      : subscription.planType === 'ENTERPRISE'
      ? '#c084fc'
      : '#818cf8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>User &amp; Workspace Profile</Text>

        {/* ── USER CARD ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.userHeader}>
            <View style={[styles.avatarBadge, { backgroundColor: roleColor + '30' }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>
                {currentUser.avatar}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '60' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  ROLE: {currentUser.role.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── WORKSPACE CARD ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Company Workspace Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>{currentUser.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company ID</Text>
            <Text style={styles.monoValue}>{currentUser.companyId.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={[styles.activeValue, { color: planColor }]}>
              {subscription.planType.replace('_', ' ')} ({subscription.userSeatsAllocated} Seats)
            </Text>
          </View>
          {subscription.planType === 'FREE_TRIAL' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trial Days Remaining</Text>
              <Text style={[styles.activeValue, { color: '#fbbf24' }]}>
                {subscription.trialDaysLeft} Days Left
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Seats Used / Allocated</Text>
            <Text style={styles.infoValue}>
              {subscription.userSeatsUsed} / {subscription.userSeatsAllocated}
            </Text>
          </View>
        </View>

        {/* ── FEATURES CARD ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Plan Features</Text>
        <View style={styles.card}>
          {(
            [
              ['WhatsApp Cloud API', subscription.features.whatsApp],
              ['Email Automation', subscription.features.emailAutomation],
              ['AI Lead Scoring', subscription.features.aiLeadScoring],
              ['Custom Salary Builder', subscription.features.customSalaryBuilder],
              ['Export to CSV', subscription.features.exportCSV],
            ] as [string, boolean][]
          ).map(([label, enabled], i) => (
            <View
              key={label}
              style={[styles.infoRow, i < 4 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
            >
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: enabled ? '#34d399' : '#f87171' }}>
                {enabled ? '✓ Enabled' : '✗ Blocked'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── SECURITY & SYSTEM ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Security &amp; Mobile App</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>DAS CRM v1.0.0 (Release)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>2FA Authentication</Text>
            <Text style={styles.activeValue}>Enabled (Gmail Verified)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session Token</Text>
            <Text style={styles.monoValue}>••••••••••••••</Text>
          </View>
        </View>

        {/* ── LOGOUT ────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>🚪 Sign Out of Workspace</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },

  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900' },
  userName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  monoValue: {
    fontSize: 12,
    color: '#c084fc',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  activeValue: { fontSize: 12, color: '#34d399', fontWeight: '700' },

  logoutButton: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: { color: '#fca5a5', fontSize: 13, fontWeight: '800' },
});
