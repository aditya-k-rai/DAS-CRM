/**
 * RepDrilldownModal.tsx — DAS CRM Android (Sales Representative & Squad Performance Drilldown)
 *
 * Provides a mobile-optimized equivalent of the Web RepDrilldownModal:
 * 1. 4 Interactive Category Buttons:
 *    - CALLS: Total Calls vs Target with Sub-filters (ALL, FRESH, FOLLOWUP)
 *    - WHATSAPP MSG: Sent Direct Outreach Messages vs Target
 *    - PRODUCTS: Product Catalogues & Pitches Shared
 *    - QUOTES: Commercial Quotations generated (Count & ₹ Amount)
 * 2. Timeframe Switcher: Today (YYYY-MM-DD) vs Month (YYYY-MM)
 * 3. Real-Time Search Query filter (by lead name, phone, company, notes, quote no, product)
 * 4. Itemized Activity Card List with 1-tap Copy Phone, Direct Dial, Direct WhatsApp, and Open Lead Detail screen
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface DrilldownActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCompany: string;
  leadEmail?: string;
  leadStatus?: string;
  category: 'CALL' | 'WHATSAPP' | 'PRODUCT' | 'QUOTE';
  callSubtype?: 'FRESH' | 'FOLLOWUP';
  title: string;
  notes?: string;
  outcome?: string;
  timestamp: string;
  dateKey: string;
  quoteNo?: string;
  quoteAmount?: number;
  quoteStatus?: string;
  products?: string[];
  productCount?: number;
}

export interface PerformanceRepData {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  initials: string;
  avatarColor: string;
  teamLeaderName?: string;

  dailyCallsTarget: number;
  dailyWhatsappTarget: number;
  monthlyRevenueTarget: number;
  monthlyMeetingsTarget: number;

  dateCallsTotal?: number;
  dateNewCalls?: number;
  dateFollowupCalls?: number;
  dateWhatsappTotal?: number;
  dateMeetingsCount?: number;
  dateProductsShared?: number;
  dateQuotesCount?: number;
  dateQuotesAmount?: number;
  dateLeadsReceived?: number;

  monthlyCallsTotal?: number;
  monthlyNewCalls?: number;
  monthlyFollowupCalls?: number;
  monthlyWhatsappTotal?: number;
  monthlyMeetingsCount?: number;
  monthlyProductsShared?: number;
  monthlyQuotesCount?: number;
  monthlyQuotesAmount?: number;
  monthlyLeadsReceived?: number;
  monthlyDealsWon?: number;
  monthlyRevenueWon?: number;

  pipelineValue?: number;
  pipelineDealsCount?: number;

  callsCompletionPct?: number;
  whatsappCompletionPct?: number;
  revenueCompletionPct?: number;
  meetingsCompletionPct?: number;
  overallScore?: number;

  activitiesList: DrilldownActivityItem[];
}

export type PerformanceRecord = PerformanceRepData;

export interface RepDrilldownModalProps {
  visible: boolean;
  onClose: () => void;
  rep: PerformanceRepData | null;
  selectedDate?: string;
  selectedMonth?: string;
  isMonthView?: boolean;
  onToggleTimeframe?: (isM: boolean) => void;
  onOpenLead?: (leadId: string) => void;
}

export function RepDrilldownModal({
  visible,
  onClose,
  rep,
  selectedDate = new Date().toISOString().split('T')[0],
  selectedMonth = new Date().toISOString().slice(0, 7),
  onOpenLead,
}: RepDrilldownModalProps) {
  const { colors, isDark } = useTheme();

  // Active Category: 'CALLS' | 'WHATSAPP' | 'PRODUCTS' | 'QUOTES'
  const [activeCategory, setActiveCategory] = useState<'CALLS' | 'WHATSAPP' | 'PRODUCTS' | 'QUOTES'>('CALLS');

  // Call Subtype Filter: 'ALL' | 'FRESH' | 'FOLLOWUP'
  const [callSubtype, setCallSubtype] = useState<'ALL' | 'FRESH' | 'FOLLOWUP'>('ALL');

  // Timeframe View: false = Today, true = Month
  const [isMonth, setIsMonth] = useState<boolean>(false);

  // Search keyword
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Copied indicator tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allActivities = useMemo(() => rep?.activitiesList || [], [rep]);

  const timeframeActivities = useMemo(() => {
    return allActivities.filter((item) => {
      if (isMonth) {
        return item.dateKey.startsWith(selectedMonth);
      } else {
        return item.dateKey === selectedDate;
      }
    });
  }, [allActivities, isMonth, selectedMonth, selectedDate]);

  // Category counts
  const callsList = useMemo(
    () => timeframeActivities.filter((a) => a.category === 'CALL'),
    [timeframeActivities]
  );
  const freshCallsList = useMemo(
    () => callsList.filter((a) => a.callSubtype === 'FRESH'),
    [callsList]
  );
  const followupCallsList = useMemo(
    () => callsList.filter((a) => a.callSubtype === 'FOLLOWUP'),
    [callsList]
  );

  const waList = useMemo(
    () => timeframeActivities.filter((a) => a.category === 'WHATSAPP'),
    [timeframeActivities]
  );
  const prodsList = useMemo(
    () => timeframeActivities.filter((a) => a.category === 'PRODUCT'),
    [timeframeActivities]
  );
  const quotesList = useMemo(
    () => timeframeActivities.filter((a) => a.category === 'QUOTE'),
    [timeframeActivities]
  );

  const totalQuotesAmount = useMemo(
    () => quotesList.reduce((sum, q) => sum + (q.quoteAmount || 0), 0),
    [quotesList]
  );

  // Filtered displayed activities
  const displayedActivities = useMemo(() => {
    let list: DrilldownActivityItem[] = [];

    if (activeCategory === 'CALLS') {
      if (callSubtype === 'FRESH') list = freshCallsList;
      else if (callSubtype === 'FOLLOWUP') list = followupCallsList;
      else list = callsList;
    } else if (activeCategory === 'WHATSAPP') {
      list = waList;
    } else if (activeCategory === 'PRODUCTS') {
      list = prodsList;
    } else if (activeCategory === 'QUOTES') {
      list = quotesList;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      return (
        item.leadName.toLowerCase().includes(q) ||
        item.leadPhone.toLowerCase().includes(q) ||
        (item.leadCompany && item.leadCompany.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.quoteNo && item.quoteNo.toLowerCase().includes(q)) ||
        (item.products && item.products.some((p) => p.toLowerCase().includes(q)))
      );
    });
  }, [
    activeCategory,
    callSubtype,
    freshCallsList,
    followupCallsList,
    callsList,
    waList,
    prodsList,
    quotesList,
    searchQuery,
  ]);

  if (!visible || !rep) return null;

  const handleCopyPhone = (phone: string, id: string) => {
    Clipboard.setString(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDial = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Calling', `Direct dialing ${cleaned}...`);
    });
  };

  const handleWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() => {
      Alert.alert('WhatsApp', `Opening WhatsApp for ${phone}...`);
    });
  };

  const dailyCallsTarget = rep.dailyCallsTarget || 30;
  const callsTargetDisplay = isMonth ? dailyCallsTarget * 22 : dailyCallsTarget;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          
          {/* ── 1. MODAL HEADER ──────────────────────────────────────────────── */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={[
                  styles.avatarBox,
                  { backgroundColor: rep.avatarColor ? `${rep.avatarColor}25` : 'rgba(99,102,241,0.2)' },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: rep.avatarColor || '#818cf8' },
                  ]}
                >
                  {rep.initials || rep.userName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.repNameText, { color: colors.text }]} numberOfLines={1}>
                    {rep.userName}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#818cf8' }}>
                      {rep.userRole || 'SALES REP'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.repSubText, { color: colors.textMuted }]} numberOfLines={1}>
                  {rep.userEmail} {rep.teamLeaderName ? `· Squad: ${rep.teamLeaderName}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.cardBgElevated }]}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. TIMEFRAME SWITCHER ────────────────────────────────────────── */}
          <View style={[styles.timeframeBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.timeframeBtn,
                !isMonth && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
              ]}
              onPress={() => setIsMonth(false)}
            >
              <Text style={[styles.timeframeText, !isMonth ? { color: '#ffffff', fontWeight: '900' } : { color: colors.textMuted }]}>
                📅 Today ({selectedDate})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeBtn,
                isMonth && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
              ]}
              onPress={() => setIsMonth(true)}
            >
              <Text style={[styles.timeframeText, isMonth ? { color: '#ffffff', fontWeight: '900' } : { color: colors.textMuted }]}>
                📆 Month ({selectedMonth})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. 4 MAIN INTERACTIVE CATEGORY BUTTONS ──────────────────────── */}
          <View style={styles.categoriesGrid}>
            {/* BUTTON 1: CALLS */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                activeCategory === 'CALLS' && {
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setActiveCategory('CALLS')}
              activeOpacity={0.8}
            >
              <View style={styles.categoryTopRow}>
                <Text style={{ fontSize: 12 }}>📞 Calls</Text>
                <View style={[styles.countBadge, { backgroundColor: activeCategory === 'CALLS' ? 'rgba(16,185,129,0.25)' : colors.border }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: activeCategory === 'CALLS' ? '#34d399' : colors.textMuted }}>
                    {callsList.length} Done
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryBigVal, { color: colors.text }]}>
                {callsList.length}
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}> / {callsTargetDisplay}</Text>
              </Text>
              <View style={styles.subTypePillsRow}>
                <View style={[styles.miniPill, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                  <Text style={{ fontSize: 8, color: '#34d399', fontWeight: '800' }}>Fresh: {freshCallsList.length}</Text>
                </View>
                <View style={[styles.miniPill, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                  <Text style={{ fontSize: 8, color: '#818cf8', fontWeight: '800' }}>FO: {followupCallsList.length}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* BUTTON 2: WHATSAPP MSG */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                activeCategory === 'WHATSAPP' && {
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setActiveCategory('WHATSAPP')}
              activeOpacity={0.8}
            >
              <View style={styles.categoryTopRow}>
                <Text style={{ fontSize: 11, fontWeight: '800' }} numberOfLines={1}>💬 WhatsApp Cloud</Text>
                <View style={[styles.countBadge, { backgroundColor: activeCategory === 'WHATSAPP' ? 'rgba(99,102,241,0.25)' : colors.border }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: activeCategory === 'WHATSAPP' ? '#818cf8' : colors.textMuted }}>
                    {waList.length} Sent
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryBigVal, { color: colors.text }]}>
                {waList.length}
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>
                  {rep.dailyWhatsappTarget > 0 ? ` / ${isMonth ? rep.dailyWhatsappTarget * 22 : rep.dailyWhatsappTarget}` : ' (Direct)'}
                </Text>
              </Text>
              <Text style={{ fontSize: 8, color: '#818cf8', fontWeight: '700', marginTop: 4 }}>
                Direct Outreach Sent
              </Text>
            </TouchableOpacity>

            {/* BUTTON 3: PRODUCTS */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                activeCategory === 'PRODUCTS' && {
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245,158,11,0.12)',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setActiveCategory('PRODUCTS')}
              activeOpacity={0.8}
            >
              <View style={styles.categoryTopRow}>
                <Text style={{ fontSize: 11, fontWeight: '800' }} numberOfLines={1}>📦 Product Catalogue</Text>
                <View style={[styles.countBadge, { backgroundColor: activeCategory === 'PRODUCTS' ? 'rgba(245,158,11,0.25)' : colors.border }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: activeCategory === 'PRODUCTS' ? '#fbbf24' : colors.textMuted }}>
                    {prodsList.length} Shared
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryBigVal, { color: colors.text }]}>
                {prodsList.length}
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}> Pitches</Text>
              </Text>
              <Text style={{ fontSize: 8, color: '#fbbf24', fontWeight: '700', marginTop: 4 }}>
                Catalogues Pitched
              </Text>
            </TouchableOpacity>

            {/* BUTTON 4: QUOTE */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                activeCategory === 'QUOTES' && {
                  borderColor: '#a855f7',
                  backgroundColor: 'rgba(168,85,247,0.12)',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setActiveCategory('QUOTES')}
              activeOpacity={0.8}
            >
              <View style={styles.categoryTopRow}>
                <Text style={{ fontSize: 11, fontWeight: '800' }} numberOfLines={1}>📝 Quotations & Invoices</Text>
                <View style={[styles.countBadge, { backgroundColor: activeCategory === 'QUOTES' ? 'rgba(168,85,247,0.25)' : colors.border }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: activeCategory === 'QUOTES' ? '#c084fc' : colors.textMuted }}>
                    {quotesList.length} Quotes
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryBigVal, { color: colors.text }]}>
                {quotesList.length}
                <Text style={{ fontSize: 10, color: '#c084fc', fontWeight: '800' }}> (₹{(totalQuotesAmount / 1000).toFixed(0)}k)</Text>
              </Text>
              <Text style={{ fontSize: 8, color: '#c084fc', fontWeight: '700', marginTop: 4 }}>
                Commercial Invoices
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. CALLS SUB-FILTER (SHOWS ONLY WHEN CALLS IS ACTIVE) ────────── */}
          {activeCategory === 'CALLS' && (
            <View style={[styles.subFilterBar, { borderTopColor: colors.border }]}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginRight: 6 }}>
                Filter:
              </Text>
              <TouchableOpacity
                style={[
                  styles.subFilterBtn,
                  { backgroundColor: colors.cardBgElevated },
                  callSubtype === 'ALL' && { backgroundColor: '#10b981' },
                ]}
                onPress={() => setCallSubtype('ALL')}
              >
                <Text style={[styles.subFilterBtnText, callSubtype === 'ALL' ? { color: '#020617', fontWeight: '900' } : { color: colors.text }]}>
                  All Calls ({callsList.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subFilterBtn,
                  { backgroundColor: colors.cardBgElevated },
                  callSubtype === 'FRESH' && { backgroundColor: '#10b981' },
                ]}
                onPress={() => setCallSubtype('FRESH')}
              >
                <Text style={[styles.subFilterBtnText, callSubtype === 'FRESH' ? { color: '#020617', fontWeight: '900' } : { color: '#34d399' }]}>
                  🌱 Fresh ({freshCallsList.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subFilterBtn,
                  { backgroundColor: colors.cardBgElevated },
                  callSubtype === 'FOLLOWUP' && { backgroundColor: '#6366f1' },
                ]}
                onPress={() => setCallSubtype('FOLLOWUP')}
              >
                <Text style={[styles.subFilterBtnText, callSubtype === 'FOLLOWUP' ? { color: '#ffffff', fontWeight: '900' } : { color: '#818cf8' }]}>
                  🔄 Follow-up ({followupCallsList.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 5. SEARCH BAR ────────────────────────────────────────────────── */}
          <View style={[styles.searchBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by lead name, phone, company, or note..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── 6. ITEMIZED ACTIVITIES LIST ──────────────────────────────────── */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {displayedActivities.length === 0 ? (
              <View style={[styles.emptyStateBox, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No {activeCategory.toLowerCase()} records found
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  {searchQuery
                    ? 'No leads or entries match your search.'
                    : `No ${activeCategory.toLowerCase()} actions recorded for ${isMonth ? selectedMonth : selectedDate}. Switch timeframe to view monthly activities.`}
                </Text>
                {!isMonth && (
                  <TouchableOpacity
                    style={[styles.switchMonthBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setIsMonth(true)}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>
                      Switch to Monthly View
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              displayedActivities.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.activityCard,
                    { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                  ]}
                >
                  {/* Lead Info & Actions Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={[styles.leadAvatar, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                        <Text style={{ color: '#818cf8', fontWeight: '900', fontSize: 11 }}>
                          {item.leadName.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <TouchableOpacity
                            onPress={() => {
                              onClose();
                              if (onOpenLead) onOpenLead(item.leadId);
                            }}
                          >
                            <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>
                              {item.leadName} ↗
                            </Text>
                          </TouchableOpacity>
                          {item.leadStatus && (
                            <View style={[styles.leadStatusPill, { backgroundColor: colors.border }]}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.textMuted }}>
                                {item.leadStatus}
                              </Text>
                            </View>
                          )}
                        </View>
                        {item.leadCompany ? (
                          <Text style={[styles.companyText, { color: colors.textMuted }]} numberOfLines={1}>
                            🏢 {item.leadCompany}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Open Lead Button */}
                    <TouchableOpacity
                      style={[styles.openLeadBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        onClose();
                        if (onOpenLead) onOpenLead(item.leadId);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>Open Lead</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Phone & Contact Shortcuts */}
                  <View style={styles.phoneActionRow}>
                    <Text style={[styles.phoneText, { color: colors.text }]}>📞 {item.leadPhone}</Text>
                    <TouchableOpacity
                      style={[styles.smallIconBtn, { backgroundColor: colors.border }]}
                      onPress={() => handleCopyPhone(item.leadPhone, item.id)}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: copiedId === item.id ? '#34d399' : colors.text }}>
                        {copiedId === item.id ? '✓ Copied' : '📋 Copy'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallIconBtn, { backgroundColor: 'rgba(16,185,129,0.2)' }]}
                      onPress={() => handleDial(item.leadPhone)}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>📞 Dial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallIconBtn, { backgroundColor: 'rgba(37,211,102,0.2)' }]}
                      onPress={() => handleWhatsApp(item.leadPhone)}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#25D366' }}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Specific Action Details */}
                  <View style={[styles.actionDetailsBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {item.category === 'CALL' && (
                          <View
                            style={[
                              styles.catBadge,
                              item.callSubtype === 'FRESH'
                                ? { backgroundColor: 'rgba(16,185,129,0.2)' }
                                : { backgroundColor: 'rgba(99,102,241,0.2)' },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '800',
                                color: item.callSubtype === 'FRESH' ? '#34d399' : '#818cf8',
                              }}
                            >
                              {item.callSubtype === 'FRESH' ? '🌱 Fresh Call (1st Contact)' : '🔄 Follow-up Call'}
                            </Text>
                          </View>
                        )}

                        {item.category === 'WHATSAPP' && (
                          <View style={[styles.catBadge, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#818cf8' }}>
                              💬 Direct WhatsApp Outreach
                            </Text>
                          </View>
                        )}

                        {item.category === 'PRODUCT' && (
                          <View style={[styles.catBadge, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#fbbf24' }}>
                              📦 Product Pitch ({item.productCount || (item.products ? item.products.length : 1)})
                            </Text>
                          </View>
                        )}

                        {item.category === 'QUOTE' && (
                          <View style={[styles.catBadge, { backgroundColor: 'rgba(168,85,247,0.2)' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#c084fc' }}>
                              📄 Quote No: {item.quoteNo || 'QT-2026-0042'}
                            </Text>
                          </View>
                        )}

                        {item.quoteAmount ? (
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#c084fc' }}>
                            ₹{item.quoteAmount.toLocaleString('en-IN')}
                          </Text>
                        ) : null}

                        {item.outcome && (
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#34d399' }}>
                            ✓ {item.outcome}
                          </Text>
                        )}
                      </View>

                      <Text style={{ fontSize: 9, color: colors.textMuted }}>
                        ⏱️ {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.dateKey}
                      </Text>
                    </View>

                    {item.notes ? (
                      <Text style={[styles.notesText, { color: colors.text }]}>
                        {item.notes}
                      </Text>
                    ) : null}

                    {item.products && item.products.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textMuted }}>Items:</Text>
                        {item.products.map((p, pIdx) => (
                          <View key={pIdx} style={[styles.miniProductPill, { backgroundColor: colors.cardBgElevated }]}>
                            <Text style={{ fontSize: 8, color: '#fbbf24', fontWeight: '700' }}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* ── 7. MODAL FOOTER ──────────────────────────────────────────────── */}
          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerHint, { color: colors.textMuted }]}>
              Single Source of Truth · Real-time activity telemetry
            </Text>
            <TouchableOpacity
              style={[styles.footerCloseBtn, { backgroundColor: colors.cardBgElevated }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>Close Drilldown</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalBox: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '900',
    fontSize: 13,
  },
  repNameText: {
    fontSize: 14,
    fontWeight: '900',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  repSubText: {
    fontSize: 10,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  categoryCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryBigVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  subTypePillsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  miniPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  subFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 4,
    flexWrap: 'wrap',
  },
  subFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  subFilterBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  switchMonthBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  leadAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadName: {
    fontSize: 12,
    fontWeight: '800',
  },
  leadStatusPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  companyText: {
    fontSize: 9,
    marginTop: 1,
  },
  openLeadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  phoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  phoneText: {
    fontSize: 10,
    fontWeight: '700',
  },
  smallIconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  actionDetailsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  notesText: {
    fontSize: 10,
    lineHeight: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 6,
    borderRadius: 6,
  },
  miniProductPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: 9,
  },
  footerCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
});

export default RepDrilldownModal;
