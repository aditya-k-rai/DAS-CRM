/**
 * DashboardScreen.tsx — DAS CRM Android (Tab 1: Home / Reports)
 * Live Enterprise Executive Cockpit:
 * 1. 👑 Top Executive Command Banner with role indicators
 * 2. 📊 Executive Performance Summary Cards (Live Total Ingested, Pipeline Value, Fresh Unassigned, Won Deals)
 * 3. 📅 Upcoming Lead Follow-ups & Scheduled Calls with one-touch dialers
 * 4. 📋 Recent Ingested Leads with direct Call & WhatsApp triggers
 * 5. 🔄 Pull-to-refresh connected to live NestJS backend with multi-candidate failover
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { TenantAdminHeaderBanner } from '../components/TenantAdminHeaderBanner';
import { apiService, LeadItem } from '../services/apiService';

interface DashboardScreenProps {
  userRole?: UserRole;
  onNavigateToLeads?: () => void;
  onNavigateToAttendance?: () => void;
  navigation?: any;
}

export default function DashboardScreen({
  userRole,
  onNavigateToLeads,
  onNavigateToAttendance,
  navigation,
}: DashboardScreenProps) {
  const { colors, isDark } = useTheme();
  const { currentUser, subscription, token } = useAuthStore();
  const selectedRole: UserRole = normalizeRoleStr(userRole || currentUser.role);

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [telemetry, setTelemetry] = useState<any>({
    todayLeads: 0,
    todayCalls: 0,
    salesToday: 0,
    activePipeline: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, summaryRes] = await Promise.all([
        apiService.getLeads(token),
        apiService.getTodayActivitySummary(token),
      ]);

      if (Array.isArray(leadsRes)) {
        setLeads(leadsRes);
      }
      if (summaryRes) {
        setTelemetry(summaryRes);
      }
    } catch (e) {
      console.warn('[DashboardScreen] Failed to fetch data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── Computed Live Metrics ──────────────────────────────────────────────────
  const wonLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        (l.status || '').toLowerCase().includes('won') ||
        (l.status || '').toLowerCase().includes('convert'),
    );
  }, [leads]);

  const openDeals = useMemo(() => {
    return leads.filter(
      (l) =>
        !(l.status || '').toLowerCase().includes('won') &&
        !(l.status || '').toLowerCase().includes('lost'),
    );
  }, [leads]);

  const pipelineValue = useMemo(() => {
    return openDeals.reduce((sum, l) => {
      const val =
        typeof l.value === 'number'
          ? l.value
          : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [openDeals]);

  const wonRevenue = useMemo(() => {
    return wonLeads.reduce((sum, l) => {
      const val =
        typeof l.value === 'number'
          ? l.value
          : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [wonLeads]);

  const unassignedCount = useMemo(() => {
    return leads.filter(
      (l) =>
        !l.assignedRep ||
        l.assignedRep === '—' ||
        l.assignedRep.toLowerCase().includes('unassigned'),
    ).length;
  }, [leads]);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return '0.0%';
    return `${((wonLeads.length / leads.length) * 100).toFixed(1)}%`;
  }, [leads, wonLeads]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleCall = (phone: string, name: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    if (!clean) {
      Alert.alert('Phone Unavailable', 'No valid contact number found for this lead.');
      return;
    }
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) {
      Alert.alert('WhatsApp Unavailable', 'No phone number for WhatsApp message.');
      return;
    }
    const intlPhone = clean.length === 10 ? `91${clean}` : clean;
    const msg = encodeURIComponent(`Hi ${name}, this is ${currentUser?.name || 'our team'} from ${currentUser?.companyName || 'DAS CRM'}. Following up on your requirement.`);
    Linking.openURL(`whatsapp://send?phone=${intlPhone}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${intlPhone}?text=${msg}`);
    });
  };

  // Recent 5 leads preview
  const recentLeads = useMemo(() => {
    return leads.slice(0, 5);
  }, [leads]);

  // Upcoming follow-up items
  const upcomingFollowUps = useMemo(() => {
    return leads.filter(
      (l) => l.status && !l.status.toLowerCase().includes('won') && !l.status.toLowerCase().includes('lost'),
    ).slice(0, 3);
  }, [leads]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 4 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 85 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 👑 Top Executive Command Banner */}
        <TenantAdminHeaderBanner
          role={selectedRole}
          navigation={navigation}
        />

        {/* 📊 Executive Performance Summary Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Executive Performance Overview
          </Text>
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Total Leads */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={[styles.statBadge, { color: colors.primary, backgroundColor: colors.primary + '15' }]}>
                Live Sync
              </Text>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {leads.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Total Ingested Leads
            </Text>
          </View>

          {/* Card 2: Pipeline Value */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statBadge, { color: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                Open Deals
              </Text>
            </View>
            <Text style={[styles.statValue, { color: '#34d399' }]}>
              {formatCurrency(pipelineValue)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Active Pipeline Value
            </Text>
          </View>

          {/* Card 3: Fresh Unassigned */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={[styles.statBadge, { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                Pool
              </Text>
            </View>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>
              {unassignedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Fresh Unassigned Leads
            </Text>
          </View>

          {/* Card 4: Won Conversion */}
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={[styles.statBadge, { color: '#c084fc', backgroundColor: 'rgba(192,132,252,0.15)' }]}>
                Closed
              </Text>
            </View>
            <Text style={[styles.statValue, { color: '#c084fc' }]}>
              {conversionRate}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {wonLeads.length} Deals Won ({formatCurrency(wonRevenue)})
            </Text>
          </View>
        </View>

        {/* 📅 UPCOMING LEADS & FOLLOW-UPS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Upcoming Lead Follow-ups
        </Text>
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {upcomingFollowUps.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                No pending follow-ups scheduled. All leads up to date.
              </Text>
            </View>
          ) : (
            upcomingFollowUps.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.followUpItem,
                  idx < upcomingFollowUps.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.leadItemName, { color: colors.text }]}>{item.name}</Text>
                    <View style={[styles.stagePill, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                      <Text style={[styles.stagePillText, { color: colors.primary }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.leadItemSub, { color: colors.textMuted }]}>
                    {item.company} · {item.phone}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.primary, marginTop: 2, fontWeight: '700' }}>
                    👤 Rep: {item.assignedRep || 'Unassigned'} · 💰 {item.value}
                  </Text>
                </View>

                {/* Quick One-touch communication buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {item.phone && item.phone !== '—' && (
                    <>
                      <TouchableOpacity
                        style={[styles.quickActionIconBtn, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: '#34d399' }]}
                        onPress={() => handleCall(item.phone, item.name)}
                      >
                        <Text style={{ fontSize: 12 }}>📞</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickActionIconBtn, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: '#34d399' }]}
                        onPress={() => handleWhatsApp(item.phone, item.name)}
                      >
                        <Text style={{ fontSize: 12 }}>💬</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* 📋 RECENT INGESTED LEADS PREVIEW WIDGET */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Recent Ingested Leads ({leads.length})
          </Text>
          <TouchableOpacity onPress={onNavigateToLeads}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
              View More Leads →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {recentLeads.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                No leads ingested yet. Ingest via Google Sheets, File Import, or Ads.
              </Text>
            </View>
          ) : (
            recentLeads.map((item, idx) => {
              const isWon = (item.status || '').toLowerCase().includes('won');
              return (
                <View
                  key={item.id}
                  style={[
                    styles.recentLeadRow,
                    idx < recentLeads.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.leadItemName, { color: colors.text }]}>{item.name}</Text>
                      <View
                        style={[
                          styles.stagePill,
                          isWon
                            ? { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }
                            : { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.stagePillText, { color: isWon ? '#34d399' : colors.textSecondary }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.leadItemSub, { color: colors.textMuted }]}>
                      {item.company} · {item.city !== '—' ? item.city : item.source}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800', marginTop: 2 }}>
                      {item.value} · Rep: {item.assignedRep || 'Unassigned'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {item.phone && item.phone !== '—' && (
                      <TouchableOpacity
                        style={[styles.quickActionIconBtn, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: '#34d399' }]}
                        onPress={() => handleCall(item.phone, item.name)}
                      >
                        <Text style={{ fontSize: 12 }}>📞</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.viewDetailsChip, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                      onPress={onNavigateToLeads}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>View ›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* View More Button */}
          <TouchableOpacity
            style={[styles.viewMoreBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.1)', borderColor: colors.primary }]}
            onPress={onNavigateToLeads}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewMoreBtnText, { color: colors.primary }]}>
              View All Leads &amp; Distribution Controls ({leads.length} Records) →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 14, alignItems: 'center', paddingBottom: 24 },

  sectionHeaderRow: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    width: '100%',
    maxWidth: 600,
  },

  statsGrid: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 140,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: { fontSize: 16 },
  statBadge: {
    fontSize: 8,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

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

  followUpItem: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentLeadRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadItemName: { fontSize: 13, fontWeight: '800' },
  leadItemSub: { fontSize: 10, marginTop: 1 },
  stagePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  stagePillText: { fontSize: 8, fontWeight: '900' },

  quickActionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },

  viewMoreBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '800' },
});
