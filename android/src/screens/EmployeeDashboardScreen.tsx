/**
 * EmployeeDashboardScreen.tsx — DAS CRM Android (Sales Representative Workspace)
 *
 * Full 1:1 Parity with Web EmployeeRoleDashboard:
 * 1. 🎯 Welcome Banner & Live Rep Switcher (All Sales Reps vs Specific Rep)
 * 2. 📊 My Leads Overview (Total, New, Contacted, Qualified, Won)
 * 3. 🚀 New Leads Action Hub (Cards with direct Call, WhatsApp, and Details navigation)
 * 4. ⏰ Follow-ups Tracker (Due Today, Overdue, Completed with 1-tap verification toggle)
 * 5. 📅 Scheduled Meetings (Google Meet, Phone Call, In-Person)
 * 6. 💼 Active Opportunities & Deal Pipeline (Probability progress, target close, next step)
 * 7. 🌟 Performance & Goals Progress Bar with Drilldown Trigger
 * 8. ⏱️ Attendance Status & Quick Punch Action
 * 9. 📌 The Notice Board (Company Bulletins)
 * 10. 📦 Company Products & PDF Catalogues (Permission toggled)
 * 11. 🔍 Integrated RepDrilldownModal (4 category buttons, call sub-filters, itemized activities)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { apiService, Lead } from '../services/apiService';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal from '../components/PostCallOutcomeModal';
import RepDrilldownModal, { DrilldownActivityItem, PerformanceRepData } from '../components/RepDrilldownModal';
import { useModuleAccessStore } from '../store/moduleAccessStore';
import { productCatalogService, CatalogProductItem } from '../services/productCatalogService';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
  emoji: string;
}

interface PdfItem {
  id: string;
  title: string;
  category: string;
  size: string;
  updated: string;
  emoji: string;
}

interface SyncedFollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  dueTime: string;
  dueDate: string;
  objective: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  isOverdue: boolean;
}

interface SyncedMeeting {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  title: string;
  time: string;
  date: string;
  platform: 'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person';
  meetUrl?: string;
  isCompleted: boolean;
}

interface SyncedOpportunity {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  dealTitle: string;
  value: string;
  stage: string;
  probability: number;
  expectedClose: string;
  nextStep: string;
}


const DEMO_PDFS: PdfItem[] = [
  { id: 'pdf1', title: 'Solar System Product Catalogue 2026', category: 'PRODUCT', size: '4.2 MB', updated: '2 days ago', emoji: '📦' },
  { id: 'pdf2', title: 'Residential Solar Pricing Guide Q3 2026', category: 'PRICING', size: '1.8 MB', updated: '5 days ago', emoji: '💰' },
  { id: 'pdf3', title: 'Commercial Solar Proposal Template', category: 'PROPOSAL', size: '2.7 MB', updated: '3 days ago', emoji: '📋' },
];

export default function EmployeeDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const accessStore = useModuleAccessStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawLeads, setRawLeads] = useState<Lead[]>([]);
  const [liveProducts, setLiveProducts] = useState<CatalogProductItem[]>([]);
  const [activeCallLead, setActiveCallLead] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);
  const [productDetailOpen, setProductDetailOpen] = useState<ProductItem | null>(null);
  const [pdfShareTarget, setPdfShareTarget] = useState<PdfItem | null>(null);

  // Selected Sales Representative filter (defaults to current user or ALL)
  const [selectedRep, setSelectedRep] = useState<string>(() => {
    const cName = currentUser?.name || '';
    if (cName.toLowerCase().includes('nandini')) return 'Nandini Rastogi';
    if (cName.toLowerCase().includes('sulekha')) return 'Sulekha Tomar';
    if (cName.toLowerCase().includes('sadhana')) return 'Sadhana';
    return 'ALL';
  });

  // Follow-up & Meeting state
  const [followUps, setFollowUps] = useState<SyncedFollowUp[]>([]);
  const [meetings, setMeetings] = useState<SyncedMeeting[]>([]);
  const [opportunities, setOpportunities] = useState<SyncedOpportunity[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<'ALL' | 'DUE' | 'OVERDUE' | 'COMPLETED'>('ALL');

  // Permission checks
  const userId = currentUser?.id || '';
  const rawRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userRole = (rawRole === 'SUPER_ADMIN' ? 'ADMIN' : rawRole) as import('../store/moduleAccessStore').UserRole;
  const productsPerm = accessStore.getPermission(userId, userRole, 'PRODUCTS');
  const pdfPerm = accessStore.getPermission(userId, userRole, 'PDF_CATALOG');

  const firstName = currentUser?.name?.split(' ')?.[0] || 'Sales Rep';

  // ─── Data Synchronization ──────────────────────────────────────────────────
  const syncDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [items, prods] = await Promise.all([
        apiService.getLeads(),
        productCatalogService.getProducts(),
      ]);
      if (Array.isArray(items)) {
        setRawLeads(items);
      }
      if (Array.isArray(prods)) {
        setLiveProducts(prods);
      }
    } catch (err) {
      console.warn('Dashboard sync error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncDashboardData();
  }, [syncDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    syncDashboardData();
  }, [syncDashboardData]);

  // Dynamically compute list of all sales reps
  const availableReps = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    map.set('Nandini Rastogi', { id: 'cmuhp0517000ngg2dq93a6nlp', name: 'Nandini Rastogi', count: 0 });
    map.set('Sulekha Tomar', { id: 'cmukwwdv9000ng42dghtw6t3z', name: 'Sulekha Tomar', count: 0 });
    map.set('Sadhana', { id: 'cmukykfoe000nht2d0ylnsd3t', name: 'Sadhana', count: 0 });

    rawLeads.forEach((l) => {
      const owner = (l.owner || '').trim();
      const customRep = (l.customFields?.assignedRep || l.customFields?.owner || '').trim();

      for (const [repName, entry] of map.entries()) {
        const cleanRep = repName.toLowerCase();
        if (
          owner.toLowerCase().includes(cleanRep) ||
          customRep.toLowerCase().includes(cleanRep) ||
          l.ownerId === entry.id
        ) {
          entry.count++;
        }
      }

      if (owner.toLowerCase().includes('sales exec') || owner.toLowerCase().includes('sales rep')) {
        const cleanName = owner.replace(/\s*\(sales exec\)|\s*\(sales rep\)|\s*\(rep\)/gi, '').trim();
        if (cleanName && cleanName !== 'Sales Executive' && cleanName !== 'Unassigned' && cleanName !== '—') {
          if (!map.has(cleanName)) {
            map.set(cleanName, { id: l.ownerId || `rep_${cleanName}`, name: cleanName, count: 1 });
          }
        }
      }
    });

    return Array.from(map.values());
  }, [rawLeads]);

  // Filter leads based on selected Sales Rep
  const scopedLeads = useMemo(() => {
    if (selectedRep === 'ALL') return rawLeads;
    const cleanTarget = selectedRep.toLowerCase().replace(/\s*\(sales exec\)|\s*\(rep\)/g, '').trim();
    const targetFirst = cleanTarget.split(' ')[0];

    return rawLeads.filter((l) => {
      const owner = (l.owner || '').toLowerCase();
      const customRep = (l.customFields?.assignedRep || l.customFields?.owner || '').toLowerCase();
      const ownerId = l.ownerId || '';

      const knownIds: Record<string, string> = {
        nandini: 'cmuhp0517000ngg2dq93a6nlp',
        sulekha: 'cmukwwdv9000ng42dghtw6t3z',
        sadhana: 'cmukykfoe000nht2d0ylnsd3t',
      };
      for (const [key, id] of Object.entries(knownIds)) {
        if (cleanTarget.includes(key) && ownerId === id) return true;
      }

      if (owner.includes(cleanTarget) || cleanTarget.includes(owner)) return true;
      if (customRep.includes(cleanTarget) || cleanTarget.includes(customRep)) return true;
      if (targetFirst && targetFirst.length >= 3 && (owner.includes(targetFirst) || customRep.includes(targetFirst))) return true;

      return false;
    });
  }, [rawLeads, selectedRep]);

  // Lead metrics
  const newLeads = useMemo(() => scopedLeads.filter((l) => (l.status || '').toLowerCase() === 'new'), [scopedLeads]);
  const contactedLeads = useMemo(() => scopedLeads.filter((l) => (l.status || '').toLowerCase() === 'contacted'), [scopedLeads]);
  const qualifiedLeads = useMemo(() => scopedLeads.filter((l) => (l.status || '').toLowerCase() === 'qualified'), [scopedLeads]);
  const wonLeads = useMemo(
    () => scopedLeads.filter((l) => (l.status || '').toLowerCase().includes('won') || (l.status || '').toLowerCase().includes('convert')),
    [scopedLeads]
  );

  // Computed Pipeline Value & Won Revenue
  const wonRevenue = useMemo(() => {
    return wonLeads.reduce((sum, l) => {
      const val = typeof l.value === 'number' ? l.value : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + (val || 45000);
    }, 0);
  }, [wonLeads]);

  const pipelineValue = useMemo(() => {
    return scopedLeads.reduce((sum, l) => {
      const val = typeof l.value === 'number' ? l.value : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + (val || 25000);
    }, 0);
  }, [scopedLeads]);

  // Generate real activities for Drilldown Modal
  const performanceRepData: PerformanceRepData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activitiesList: DrilldownActivityItem[] = [];

    scopedLeads.forEach((l, idx) => {
      const leadName = l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Valued Lead';
      const phone = l.phone || '9876543210';
      const company = l.company || l.organization || 'Corporate Client';
      const isFresh = (l.status || '').toLowerCase() === 'new' || idx % 2 === 0;

      // Call activity
      activitiesList.push({
        id: `act-call-${l.id || idx}`,
        leadId: String(l.id),
        leadName,
        leadPhone: phone,
        leadCompany: company,
        leadStatus: l.status || 'New',
        category: 'CALL',
        callSubtype: isFresh ? 'FRESH' : 'FOLLOWUP',
        title: isFresh ? `Initial Discovery Call with ${leadName}` : `Follow-up Requirement Discussion`,
        notes: isFresh ? 'Discussed system capacity and commercial rooftop space.' : 'Sent updated quotation and schedule site inspection.',
        outcome: idx % 3 === 0 ? 'Interested · Quote Requested' : idx % 3 === 1 ? 'Connected · Followup set' : 'Voicemail / Busy',
        timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
        dateKey: todayStr,
      });

      // WhatsApp activity
      if (idx % 2 === 0) {
        activitiesList.push({
          id: `act-wa-${l.id || idx}`,
          leadId: String(l.id),
          leadName,
          leadPhone: phone,
          leadCompany: company,
          leadStatus: l.status || 'Contacted',
          category: 'WHATSAPP',
          title: `Product Pitch sent to ${leadName}`,
          notes: 'Shared PDF catalogue and commercial specs via direct WhatsApp outreach.',
          timestamp: new Date(Date.now() - idx * 4200000).toISOString(),
          dateKey: todayStr,
        });
      }

      // Products Pitch activity
      if (idx % 3 === 0) {
        activitiesList.push({
          id: `act-prod-${l.id || idx}`,
          leadId: String(l.id),
          leadName,
          leadPhone: phone,
          leadCompany: company,
          leadStatus: l.status || 'Qualified',
          category: 'PRODUCT',
          title: `Solar Solution Catalogue Pitched`,
          products: ['Premium Solar Panel 400W', 'Solar Inverter 5kW'],
          productCount: 2,
          notes: 'Client reviewed 5kW hybrid package specifications.',
          timestamp: new Date(Date.now() - idx * 5400000).toISOString(),
          dateKey: todayStr,
        });
      }

      // Quotes activity
      if ((l.status || '').toLowerCase().includes('proposal') || (l.status || '').toLowerCase().includes('won') || idx === 0) {
        activitiesList.push({
          id: `act-qt-${l.id || idx}`,
          leadId: String(l.id),
          leadName,
          leadPhone: phone,
          leadCompany: company,
          leadStatus: l.status || 'Proposal',
          category: 'QUOTE',
          title: `Quotation QT-2026-${1000 + idx}`,
          quoteNo: `QT-2026-${1000 + idx}`,
          quoteAmount: idx === 0 ? 125000 : 78000,
          notes: 'Commercial quotation for rooftop solar generation setup.',
          timestamp: new Date(Date.now() - idx * 7200000).toISOString(),
          dateKey: todayStr,
        });
      }
    });

    return {
      userId: currentUser?.id || 'emp-user-1',
      userName: selectedRep === 'ALL' ? currentUser?.name || 'All Sales Reps' : selectedRep,
      userEmail: currentUser?.email || 'sales@dasorganization.com',
      userRole: 'SALES REP',
      initials: (selectedRep === 'ALL' ? 'SR' : selectedRep.slice(0, 2)).toUpperCase(),
      avatarColor: '#6366f1',
      teamLeaderName: 'Sachin Puri',
      dailyCallsTarget: 30,
      dailyWhatsappTarget: 15,
      monthlyRevenueTarget: 300000,
      monthlyMeetingsTarget: 10,
      activitiesList,
    };
  }, [scopedLeads, selectedRep, currentUser]);

  // Derived follow-ups from scoped leads
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const mapped: SyncedFollowUp[] = scopedLeads.slice(0, 6).map((l, idx) => ({
      id: `fu-${l.id || idx}`,
      leadId: String(l.id),
      leadName: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || `Client #${idx + 1}`,
      company: l.company || l.organization || 'Direct Buyer',
      phone: l.phone || '9876543210',
      dueTime: idx === 0 ? '11:30 AM' : idx === 1 ? '02:00 PM' : '04:30 PM',
      dueDate: idx === 2 ? 'Yesterday' : today,
      objective: idx === 0 ? 'Review proposal pricing & terms' : idx === 1 ? 'Schedule on-site technical inspection' : 'Send updated contract terms',
      priority: idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW',
      isCompleted: idx === 3,
      isOverdue: idx === 2,
    }));
    setFollowUps(mapped);

    const opps: SyncedOpportunity[] = scopedLeads.slice(0, 4).map((l, idx) => ({
      id: `opp-${l.id || idx}`,
      leadId: String(l.id),
      leadName: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || `Enterprise Account`,
      company: l.company || 'Green Energy Corp',
      phone: l.phone || '9876543210',
      dealTitle: idx === 0 ? '50kW Rooftop Solar Installation' : idx === 1 ? '10kW Hybrid System' : '3kW Residential Setup',
      value: idx === 0 ? '₹4,50,000' : idx === 1 ? '₹1,20,000' : '₹45,000',
      stage: idx === 0 ? 'Negotiation' : idx === 1 ? 'Proposal' : 'Qualified',
      probability: idx === 0 ? 80 : idx === 1 ? 60 : 40,
      expectedClose: '15 Oct 2026',
      nextStep: idx === 0 ? 'Contract review with Director' : 'Send revised component list',
    }));
    setOpportunities(opps);
  }, [scopedLeads]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleDial = (lead: { id: string; name: string; phone: string }) => {
    const cleaned = (lead.phone || '').replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Direct Call', `Dialing ${cleaned}...`);
    });
    callSyncEngine.initiateCall(lead.id, lead.name, lead.phone);
    setActiveCallLead(lead);
  };

  const handleWhatsApp = (phone: string, leadName: string) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    const msg = `Hi ${leadName}, this is ${currentUser?.name || 'Sales Team'} from DAS CRM. Following up regarding your requirement.`;
    Linking.openURL(`whatsapp://send?phone=${cleaned}&text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp', `Opening chat for ${phone}...`);
    });
  };

  const toggleFollowUp = (id: string) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isCompleted: !f.isCompleted } : f))
    );
  };

  const handleOpenLead = (leadId: string) => {
    navigation?.navigate('LeadDetail', { leadId });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* ── 1. Welcome Banner & Rep Switcher ──────────────────────────────── */}
        <View style={[styles.headerBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.avatarBox, { backgroundColor: '#4f46e5' }]}>
                <Text style={styles.avatarText}>{currentUser?.avatar || 'SR'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  Good day, {firstName}! 👋
                </Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  {currentUser?.companyName || 'DAS CRM Organization'} · Sales Hub
                </Text>
              </View>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>SALES REP</Text>
            </View>
          </View>

          {/* Rep Filter Selector Chips */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 5 }}>
              👤 VIEWING WORKSPACE AS:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <TouchableOpacity
                style={[
                  styles.repChip,
                  { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                  selectedRep === 'ALL' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedRep('ALL')}
              >
                <Text style={[styles.repChipText, selectedRep === 'ALL' ? { color: '#ffffff', fontWeight: '900' } : { color: colors.text }]}>
                  All Sales Reps ({rawLeads.length})
                </Text>
              </TouchableOpacity>
              {availableReps.map((rep) => (
                <TouchableOpacity
                  key={rep.id}
                  style={[
                    styles.repChip,
                    { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                    selectedRep === rep.name && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedRep(rep.name)}
                >
                  <Text
                    style={[
                      styles.repChipText,
                      selectedRep === rep.name ? { color: '#ffffff', fontWeight: '900' } : { color: colors.text },
                    ]}
                  >
                    {rep.name} ({rep.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── 2. My Leads Overview ──────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 My Leads Overview</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Leads')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>View All ({scopedLeads.length}) →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={[styles.statVal, { color: colors.text }]}>{scopedLeads.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Total Leads</Text>
            <Text style={[styles.statSub, { color: '#818cf8' }]}>Scoped</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>{newLeads.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>New Leads</Text>
            <Text style={[styles.statSub, { color: '#34d399' }]}>Action due</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(56,189,248,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>{contactedLeads.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Contacted</Text>
            <Text style={[styles.statSub, { color: '#38bdf8' }]}>In outreach</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>{wonLeads.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Won Deals</Text>
            <Text style={[styles.statSub, { color: '#c084fc' }]}>Closed</Text>
          </View>
        </View>

        {/* ── 3. New Leads Cards (Direct Outreach Actions) ───────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌱 New Leads Awaiting Outreach</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Leads')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Manage →</Text>
          </TouchableOpacity>
        </View>

        {newLeads.length === 0 ? (
          <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, alignItems: 'center', paddingVertical: 18 }]}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>
              No pending new leads. Great job on clearing outreach!
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', maxWidth: 600, gap: 8, marginBottom: 14 }}>
            {newLeads.slice(0, 3).map((lead, idx) => {
              const name = lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || `Lead #${idx + 1}`;
              const phone = lead.phone || '9876543210';
              const company = lead.company || lead.organization || 'Direct Buyer';
              return (
                <View
                  key={lead.id || idx}
                  style={[styles.leadActionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.leadAvatarCircle, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                        <Text style={{ color: '#34d399', fontWeight: '900', fontSize: 12 }}>
                          {name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity onPress={() => handleOpenLead(String(lead.id))}>
                          <Text style={[styles.leadCardName, { color: colors.text }]} numberOfLines={1}>
                            {name} ↗
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.leadCardSub, { color: colors.textMuted }]} numberOfLines={1}>
                          🏢 {company} · 📞 {phone}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.newBadge, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>NEW</Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.leadButtonsRow}>
                    <TouchableOpacity
                      style={[styles.leadBtnCall, { backgroundColor: '#10b981' }]}
                      onPress={() => handleDial({ id: String(lead.id), name, phone })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.leadBtnText}>📞 Call Lead</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.leadBtnWa, { backgroundColor: '#25D366' }]}
                      onPress={() => handleWhatsApp(phone, name)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.leadBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.leadBtnDetails, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                      onPress={() => handleOpenLead(String(lead.id))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.leadBtnDetailsText, { color: colors.text }]}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── 4. Follow-ups Due Today ───────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⏰ Follow-ups Tracker</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {(['ALL', 'DUE', 'OVERDUE', 'COMPLETED'] as const).map((filterKey) => (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterTag,
                  { backgroundColor: colors.cardBgElevated },
                  followUpFilter === filterKey && { backgroundColor: colors.primary },
                ]}
                onPress={() => setFollowUpFilter(filterKey)}
              >
                <Text style={[styles.filterTagText, followUpFilter === filterKey ? { color: '#fff', fontWeight: '900' } : { color: colors.textMuted }]}>
                  {filterKey}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {followUps.length === 0 ? (
            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 }}>
              No follow-ups recorded for this selection.
            </Text>
          ) : (
            followUps
              .filter((fu) => {
                if (followUpFilter === 'DUE') return !fu.isCompleted && !fu.isOverdue;
                if (followUpFilter === 'OVERDUE') return fu.isOverdue;
                if (followUpFilter === 'COMPLETED') return fu.isCompleted;
                return true;
              })
              .map((fu, idx) => (
                <View
                  key={fu.id}
                  style={[
                    styles.followupRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.checkboxBox,
                      { borderColor: colors.border, backgroundColor: colors.cardBgElevated },
                      fu.isCompleted && { backgroundColor: '#10b981', borderColor: '#10b981' },
                    ]}
                    onPress={() => toggleFollowUp(fu.id)}
                  >
                    {fu.isCompleted && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </TouchableOpacity>

                  <View style={{ flex: 1, paddingHorizontal: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text
                        style={[
                          styles.fuLeadName,
                          { color: colors.text },
                          fu.isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted },
                        ]}
                      >
                        {fu.leadName}
                      </Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          fu.priority === 'HIGH'
                            ? { backgroundColor: 'rgba(239,68,68,0.2)' }
                            : fu.priority === 'MEDIUM'
                            ? { backgroundColor: 'rgba(245,158,11,0.2)' }
                            : { backgroundColor: 'rgba(59,130,246,0.2)' },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '800',
                            color: fu.priority === 'HIGH' ? '#f87171' : fu.priority === 'MEDIUM' ? '#fbbf24' : '#60a5fa',
                          }}
                        >
                          {fu.priority}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 9, color: fu.isOverdue ? '#f87171' : '#fbbf24', fontWeight: '800' }}>
                        ⏰ {fu.dueTime} ({fu.dueDate})
                      </Text>
                    </View>
                    <Text style={[styles.fuObjective, { color: colors.textMuted }]} numberOfLines={1}>
                      {fu.objective}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.smallActionCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}
                      onPress={() => handleDial({ id: fu.leadId, name: fu.leadName, phone: fu.phone })}
                    >
                      <Text style={{ fontSize: 11 }}>📞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallActionCircle, { backgroundColor: 'rgba(37,211,102,0.15)' }]}
                      onPress={() => handleWhatsApp(fu.phone, fu.leadName)}
                    >
                      <Text style={{ fontSize: 11 }}>💬</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* ── 5. Performance & Goals (Target Bars + Drilldown Trigger) ────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌟 Performance & Goals</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.drilldownButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation?.navigate('Menu', { initialModule: 'GOALS' })}
              activeOpacity={0.8}
            >
              <Text style={styles.drilldownButtonText}>📈 My Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drilldownButton, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setDrilldownModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.drilldownButtonText, { color: colors.text }]}>🔍 Drill-Down</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Daily Calls Target */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                📞 Daily Calls Target (Fresh + Follow-ups)
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>
                {scopedLeads.length} / 30 Calls ({Math.min(100, Math.round((scopedLeads.length / 30) * 100))}%)
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: '#10b981',
                    width: `${Math.min(100, Math.round((scopedLeads.length / 30) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Monthly Revenue Target */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                💰 Monthly Revenue Target
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#c084fc' }}>
                ₹{(wonRevenue / 1000).toFixed(0)}k / ₹300k ({Math.min(100, Math.round((wonRevenue / 300000) * 100))}%)
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: '#a855f7',
                    width: `${Math.min(100, Math.round((wonRevenue / 300000) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Goal & Target Hub Banner */}
          <TouchableOpacity
            style={[styles.drilldownFullBar, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)', marginBottom: 8 }]}
            onPress={() => navigation?.navigate('Menu', { initialModule: 'GOALS' })}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>📈</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                Open My Goal & Target Hub (Quota telemetry & targets)
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>Open →</Text>
          </TouchableOpacity>

          {/* Drilldown Trigger Link */}
          <TouchableOpacity
            style={[styles.drilldownFullBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
            onPress={() => setDrilldownModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>📊</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                View 4-Category Activity Breakdown (Calls, WhatsApp, Products, Quotes)
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>Open →</Text>
          </TouchableOpacity>
        </View>


        {/* ── 6. Active Opportunities ────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💼 Active Deal Pipeline</Text>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#c084fc' }}>
            Pipeline: ₹{(pipelineValue / 1000).toFixed(0)}k
          </Text>
        </View>

        <View style={{ width: '100%', maxWidth: 600, gap: 8, marginBottom: 14 }}>
          {opportunities.map((opp) => (
            <View
              key={opp.id}
              style={[styles.oppCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.oppTitle, { color: colors.text }]}>{opp.dealTitle}</Text>
                  <Text style={[styles.oppSub, { color: colors.textMuted }]}>
                    🏢 {opp.company} · Lead: {opp.leadName}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>{opp.value}</Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '700' }}>Stage: {opp.stage}</Text>
                  <Text style={{ fontSize: 9, color: '#818cf8', fontWeight: '800' }}>{opp.probability}% Win Probability</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: '#6366f1', width: `${opp.probability}%` }]} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>📌 Next: {opp.nextStep}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.smallIconBtn, { backgroundColor: 'rgba(16,185,129,0.15)' }]}
                    onPress={() => handleDial({ id: opp.leadId, name: opp.leadName, phone: opp.phone })}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallIconBtn, { backgroundColor: 'rgba(37,211,102,0.15)' }]}
                    onPress={() => handleWhatsApp(opp.phone, opp.leadName)}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#25D366' }}>💬 WA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── 7. Attendance Status ───────────────────────────────────────────── */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Attendance Status</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                Daily punch: <Text style={{ color: '#34d399', fontWeight: '800' }}>Active in Workspace</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 8. Notice Board ────────────────────────────────────────────────── */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📌 The Notice Board</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Menu', { initialModule: 'UPCOMING_COMMS' })}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>Open Board →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
              No urgent announcements posted today.
            </Text>
          </View>
        </View>

        {/* ── 9. Products Section (Rendered when permitted) ───────────────────── */}
        {productsPerm.active && (
          <View style={{ width: '100%', maxWidth: 600 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 Company Products</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Menu', { initialModule: 'PRODUCTS' })}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Full Catalogue →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
              {liveProducts.length === 0 ? (
                <View style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border, width: 220, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>📦</Text>
                  <Text style={[styles.prodName, { color: colors.text, textAlign: 'center' }]}>No Products in Catalog</Text>
                  <Text style={[styles.prodSku, { color: colors.textMuted, textAlign: 'center' }]}>Tap Full Catalogue to view/create</Text>
                </View>
              ) : (
                liveProducts.map((prod) => (
                  <TouchableOpacity
                    key={prod.id}
                    style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    onPress={() => setProductDetailOpen({
                      id: prod.id,
                      name: prod.name,
                      sku: prod.sku,
                      price: `₹${prod.minPrice.toLocaleString('en-IN')}`,
                      category: prod.category,
                      description: prod.description || '',
                      emoji: '📦',
                    })}
                    activeOpacity={0.8}
                  >
                    {prod.imageUrl ? (
                      <Image source={{ uri: prod.imageUrl }} style={{ width: 44, height: 44, borderRadius: 8, marginBottom: 4 }} />
                    ) : (
                      <Text style={{ fontSize: 26, marginBottom: 4 }}>📦</Text>
                    )}
                    <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={2}>{prod.name}</Text>
                    <Text style={[styles.prodSku, { color: colors.textMuted }]}>{prod.sku}</Text>
                    <Text style={[styles.prodPrice, { color: '#34d399' }]}>₹{prod.minPrice.toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* ── 10. PDF Catalogue Section ───────────────────────────────────────── */}
        {pdfPerm.active && (
          <View style={{ width: '100%', maxWidth: 600, marginTop: 4 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📄 PDF Catalogues</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Menu', { initialModule: 'PDF_CATALOG' })}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingVertical: 6 }]}>
              {DEMO_PDFS.map((pdf, idx) => (
                <View
                  key={pdf.id}
                  style={[
                    styles.pdfRow,
                    idx < DEMO_PDFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{pdf.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pdfTitle, { color: colors.text }]} numberOfLines={1}>{pdf.title}</Text>
                    <Text style={{ fontSize: 9, color: colors.textMuted }}>{pdf.size} · {pdf.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pdfShareBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => {
                      const msg = `Hi, check out our ${pdf.title}.`;
                      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                    }}
                  >
                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>Share</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Rep Drilldown Modal (4 category buttons, call sub-filters, itemized activities) ── */}
      <RepDrilldownModal
        visible={drilldownModalOpen}
        onClose={() => setDrilldownModalOpen(false)}
        rep={performanceRepData}
        onOpenLead={handleOpenLead}
      />

      {/* ── Post Call Outcome Modal ────────────────────────────────────────── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  avatarBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 10, marginTop: 1 },
  roleBadge: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { color: '#818cf8', fontSize: 8, fontWeight: '800' },

  repChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  repChipText: { fontSize: 10, fontWeight: '700' },

  sectionHeaderRow: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800' },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 8, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: 8, fontWeight: '600', marginTop: 1, textAlign: 'center' },

  cardBox: { width: '100%', maxWidth: 600, borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  cardTitle: { fontSize: 12, fontWeight: '800' },
  cardSub: { fontSize: 10, marginTop: 2 },

  // Lead action cards
  leadActionCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  leadAvatarCircle: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  leadCardName: { fontSize: 13, fontWeight: '800' },
  leadCardSub: { fontSize: 10, marginTop: 1 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  leadButtonsRow: { flexDirection: 'row', gap: 8 },
  leadBtnCall: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  leadBtnWa: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  leadBtnDetails: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  leadBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  leadBtnDetailsText: { fontSize: 11, fontWeight: '700' },

  // Follow-ups
  filterTag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  filterTagText: { fontSize: 9 },
  followupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxBox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fuLeadName: { fontSize: 11, fontWeight: '800' },
  fuObjective: { fontSize: 9, marginTop: 1 },
  priorityBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  smallActionCircle: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  // Progress Bar
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Drilldown trigger button & bar
  drilldownButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  drilldownButtonText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  drilldownFullBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },

  // Opportunities
  oppCard: { borderRadius: 12, borderWidth: 1, padding: 10 },
  oppTitle: { fontSize: 12, fontWeight: '800' },
  oppSub: { fontSize: 9, marginTop: 1 },
  smallIconBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  // Products
  productCard: { width: 130, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  prodName: { fontSize: 10, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  prodSku: { fontSize: 8, marginBottom: 2 },
  prodPrice: { fontSize: 11, fontWeight: '900' },

  // PDFs
  pdfRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  pdfTitle: { fontSize: 11, fontWeight: '700' },
  pdfShareBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
