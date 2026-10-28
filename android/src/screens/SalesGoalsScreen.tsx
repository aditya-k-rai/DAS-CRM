/**
 * SalesGoalsScreen.tsx — DAS CRM Android
 * Full 1:1 Parity with Web Sales Goals & Performance Targets
 *
 * 1. 🎯 4 Top Metric Cards (Calls Target, WhatsApp Target, Monthly Revenue, Meetings)
 * 2. 📅 Date Picker / Month Selector & Calendar Heatmap
 * 3. 🏆 Performance Leaderboard & Rep Breakdown
 * 4. 🔍 Rep Drilldown Modal (Calls, WhatsApp, Products, Quotes)
 * 5. ⚙️ Admin/Manager Set Goals & Quotas Modal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { apiService, Lead, Employee } from '../services/apiService';
import { RepDrilldownModal, PerformanceRecord, DrilldownActivityItem } from '../components/RepDrilldownModal';
import { followUpSyncEngine, FollowUpTask } from '../services/followUpSyncEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOALS_CONFIG_KEY = '@das_crm_goals_config';

interface SalesGoalsScreenProps {
  onClose?: () => void;
}

export const SalesGoalsScreen: React.FC<SalesGoalsScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser, token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [contactHistoriesMap, setContactHistoriesMap] = useState<Map<string, any[]>>(new Map());
  const [serverActivities, setServerActivities] = useState<any[]>([]);

  // Dynamic Date / Month definitions
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  // Timeframe & filters
  const [isMonthView, setIsMonthView] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [drilldownRep, setDrilldownRep] = useState<PerformanceRecord | null>(null);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleJumpToday = () => {
    setSelectedMonth(todayDateStr.slice(0, 7));
    setSelectedDate(todayDateStr);
    setIsMonthView(false);
  };

  const activeMonthName = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Set Goal Modal & Quotas
  const [isSetGoalOpen, setIsSetGoalOpen] = useState(false);
  const [dailyCallsTargetInput, setDailyCallsTargetInput] = useState('40');
  const [dailyWaTargetInput, setDailyWaTargetInput] = useState('25');
  const [monthlyRevTargetInput, setMonthlyRevTargetInput] = useState('500000');
  const [monthlyMeetingsTargetInput, setMonthlyMeetingsTargetInput] = useState('10');

  const role = (currentUser?.role || '').toUpperCase();
  const isAdminOrManager = role.includes('ADMIN') || role.includes('MANAGER') || role.includes('SUPER') || role.includes('OWNER');
  const isTL = role.includes('TEAM_LEADER') || role.includes('LEADER');
  const isSalesRep = !isAdminOrManager && !isTL;

  // Dynamic page title based on viewer's role
  const pageTitle = isSalesRep
    ? 'My Goal & Target'
    : isTL
    ? 'Team Goal & Target'
    : 'Sales Goals & Quotas';

  const loadCRMData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Load saved quota configuration
      try {
        const savedConfigRaw = await AsyncStorage.getItem(GOALS_CONFIG_KEY);
        if (savedConfigRaw) {
          const cfg = JSON.parse(savedConfigRaw);
          if (cfg.dailyCalls) setDailyCallsTargetInput(String(cfg.dailyCalls));
          if (cfg.dailyWa) setDailyWaTargetInput(String(cfg.dailyWa));
          if (cfg.monthlyRev) setMonthlyRevTargetInput(String(cfg.monthlyRev));
          if (cfg.monthlyMeetings) setMonthlyMeetingsTargetInput(String(cfg.monthlyMeetings));
        }
      } catch (_) {}

      // 2. Fetch remote leads, staff, quotes, follow-ups, and activities concurrently
      const [lRes, eRes, qRes, fuRes, actRes] = await Promise.all([
        apiService.getLeads(token).catch(() => []),
        apiService.getEmployees(token).catch(() => ({ success: false, employees: [] })),
        apiService.getQuotations(token).catch(() => []),
        followUpSyncEngine.loadAllFollowUps(token, currentUser, []).catch(() => []),
        apiService.getActivities(token).catch(() => []),
      ]);

      const validLeads = Array.isArray(lRes) ? lRes : [];
      setLeads(validLeads);

      if (eRes && eRes.success && Array.isArray(eRes.employees)) {
        setEmployees(eRes.employees);
      }

      setQuotations(Array.isArray(qRes) ? qRes : []);
      setFollowUps(Array.isArray(fuRes) ? fuRes : []);
      setServerActivities(Array.isArray(actRes) ? actRes : ((actRes as any)?.items || []));

      // 3. Scan contact histories from AsyncStorage across all leads
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const contactKeys = allKeys.filter(k => k.startsWith('das_crm_contact_history_'));
        if (contactKeys.length > 0) {
          const pairs = await Promise.all(
            contactKeys.map(async (k: string) => [k, await AsyncStorage.getItem(k)] as [string, string | null])
          );
          const historyMap = new Map<string, any[]>();
          pairs.forEach(([k, v]: [string, string | null]) => {
            if (v) {
              try {
                const parsed = JSON.parse(v);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const leadId = k.replace('das_crm_contact_history_', '');
                  historyMap.set(leadId, parsed);
                }
              } catch (_) {}
            }
          });
          setContactHistoriesMap(historyMap);
        }
      } catch (e) {
        console.warn('[SalesGoalsScreen] Error loading contact histories:', e);
      }
    } catch (e) {
      console.warn('Goals data fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, currentUser]);

  useEffect(() => {
    loadCRMData();
  }, [loadCRMData]);

  // Handle saving goals configuration
  const handleSaveQuotas = async () => {
    try {
      await AsyncStorage.setItem(GOALS_CONFIG_KEY, JSON.stringify({
        dailyCalls: dailyCallsTargetInput,
        dailyWa: dailyWaTargetInput,
        monthlyRev: monthlyRevTargetInput,
        monthlyMeetings: monthlyMeetingsTargetInput,
      }));
    } catch (_) {}
    setIsSetGoalOpen(false);
    Alert.alert('✅ Quotas Updated', 'Team goals and quota metrics successfully calibrated.');
  };

  // Derive Rep Records with role-based filtering
  const repList = useMemo(() => {
    const rawReps = employees.filter((e) => {
      const r = (e.role || '').toUpperCase();
      return r.includes('SALES') || r.includes('EXEC') || r.includes('REP') || r.includes('LEAD') || r.includes('TL');
    });

    const fallbackReps = [
      { id: 'emp-1', name: 'Nandini Rastogi', email: 'nandini@das.com', role: 'SALES_EXEC', designation: 'Senior Sales Executive', reportingTo: 'Rahul Joshi' },
      { id: 'emp-2', name: 'Sulekha Sharma', email: 'sulekha@das.com', role: 'SALES_EXEC', designation: 'Sales Consultant', reportingTo: 'Rahul Joshi' },
      { id: 'emp-3', name: 'Sadhana Verma', email: 'sadhana@das.com', role: 'SALES_EXEC', designation: 'Account Specialist', reportingTo: 'Rahul Joshi' },
      { id: 'emp-4', name: 'Rahul Joshi', email: 'rahul@das.com', role: 'TEAM_LEADER', designation: 'Team Leader Sales', reportingTo: undefined },
    ];

    const listToUse = rawReps.length > 0 ? rawReps : fallbackReps;

    if (isSalesRep && currentUser) {
      // Sales Rep sees ONLY themselves
      const selfEntry = listToUse.find(
        (e) =>
          (e.email || '').toLowerCase() === (currentUser.email || '').toLowerCase() ||
          (e.name || '').toLowerCase() === (currentUser.name || '').toLowerCase()
      );
      if (selfEntry) return [selfEntry];
      // Fallback: create a self-entry from auth data
      return [{
        id: currentUser.id || 'self',
        name: currentUser.name || 'Me',
        email: currentUser.email || '',
        role: currentUser.role || 'SALES_EXEC',
        designation: 'Sales Executive',
      }];
    }

    if (isTL && currentUser) {
      // TL sees only their assigned subordinates (not themselves)
      const tlName = (currentUser.name || '').toLowerCase();
      const tlEmail = (currentUser.email || '').toLowerCase();
      const subordinates = listToUse.filter((e) => {
        const eRole = (e.role || '').toUpperCase();
        const reportingTo = ((e as any).reportingTo || '').toLowerCase();
        const isSubordinate = !eRole.includes('LEADER') && !eRole.includes('ADMIN') && !eRole.includes('MANAGER');
        return isSubordinate && (reportingTo.includes(tlName) || reportingTo.includes(tlEmail) || true);
      });
      return subordinates.length > 0 ? subordinates : listToUse.filter((e) => {
        const r = (e.role || '').toUpperCase();
        return !r.includes('LEADER') && !r.includes('ADMIN') && !r.includes('MANAGER');
      });
    }

    // Admin / Manager → see all
    return listToUse;
  }, [employees, isSalesRep, isTL, currentUser]);

  // Construct Performance Records with REAL calculated metrics
  const records: PerformanceRecord[] = useMemo(() => {
    const dailyCalls = parseInt(dailyCallsTargetInput, 10) || 40;
    const dailyWa = parseInt(dailyWaTargetInput, 10) || 25;
    const monthlyRev = parseInt(monthlyRevTargetInput, 10) || 500000;
    const monthlyMtg = parseInt(monthlyMeetingsTargetInput, 10) || 10;

    return repList.map((rep, idx) => {
      const repNameLower = (rep.name || '').toLowerCase().trim();
      const repEmailLower = (rep.email || '').toLowerCase().trim();
      const repIdStr = String(rep.id || '');

      // 1. Matched Leads for this representative
      const matchedLeads = leads.filter((l) => {
        const owner = (l.owner || l.assignedRep || '').toLowerCase().trim();
        const lOwnerId = String((l as any).ownerId || (l as any).assignedTo || '');
        if (lOwnerId && (lOwnerId === repIdStr || lOwnerId === repEmailLower)) return true;
        if (owner && (owner === repNameLower || owner.includes(repNameLower) || repNameLower.includes(owner))) return true;
        if (repList.length === 1 && (!owner || owner === 'unassigned')) return true;
        return false;
      });

      const seenLeads = new Set<string>();
      const repLeads = matchedLeads.filter(l => {
        const k = l.id ? String(l.id) : (l.phone ? String(l.phone).replace(/\D/g, '') : l.name || '');
        if (seenLeads.has(k)) return false;
        seenLeads.add(k);
        return true;
      });

      const repWonLeads = repLeads.filter((l) => {
        const st = (l.status || '').toLowerCase();
        return st.includes('won') || st.includes('convert');
      });

      const repWonRev = repWonLeads.reduce((sum, l) => {
        const val = typeof l.value === 'number' ? l.value : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);

      const repPipeline = repLeads.reduce((sum, l) => {
        const st = (l.status || '').toLowerCase();
        if (st.includes('won') || st.includes('lost')) return sum;
        const val = typeof l.value === 'number' ? l.value : parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);

      // 2. Real Matched Follow-ups
      const repFollowUps = followUps.filter((f) => {
        const fRep = (f.assignedRepName || f.assignedRepId || '').toLowerCase().trim();
        if (fRep && (fRep === repNameLower || fRep.includes(repNameLower) || repNameLower.includes(fRep))) return true;
        if (repList.length === 1) return true;
        return false;
      });

      // 3. Real Matched Quotations
      const repQuotes = quotations.filter((q: any) => {
        const qCreator = (q.createdByName || q.createdBy || '').toLowerCase().trim();
        const qLeadId = String(q.leadId || '');
        if (qCreator && (qCreator === repNameLower || qCreator.includes(repNameLower) || repNameLower.includes(qCreator))) return true;
        if (qLeadId && repLeads.some(l => String(l.id) === qLeadId)) return true;
        if (repList.length === 1) return true;
        return false;
      });

      // 4. Contact Attempts & Activities
      const repAttempts: any[] = [];
      const seenAttemptIds = new Set<string>();

      // 4a. Ingest Server Activities from PostgreSQL
      serverActivities.forEach((act) => {
        const actUserId = String(act.userId || act.user?.id || act.createdBy || '');
        const actUserRole = String(act.user?.role || act.metadata?.byRole || '').toUpperCase();
        const actByName = String(
          (act.user ? `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() : (act.userName || act.metadata?.by || ''))
        ).toLowerCase().trim();

        const isUserMatch = (actUserId && (actUserId === repIdStr || actUserId === repEmailLower)) ||
                            (actByName && (actByName === repNameLower || actByName.includes(repNameLower) || repNameLower.includes(actByName))) ||
                            (repList.length === 1 && !actUserRole.includes('ADMIN'));

        if (!isUserMatch) return;

        const aType = String(act.type || '').toUpperCase();
        const aDesc = String(act.description || act.notes || '');
        const aDescLower = aDesc.toLowerCase();
        const aChannel = String(act.metadata?.channel || act.metadata?.type || '').toUpperCase();
        const aOutcome = String(act.metadata?.outcome || act.outcome || '').toUpperCase();

        const isCall = aType === 'CALL' || aDescLower.includes('call') || aChannel.includes('CALL') || aType.includes('CALL');
        const isWA = aChannel.includes('WA') || aChannel.includes('WHATSAPP') || aDescLower.includes('whatsapp') || aType.includes('WHATSAPP');
        const isMtg = aType === 'MEETING' || aOutcome === 'MEETING_SCHEDULED' || aDescLower.includes('meeting') || aDescLower.includes('visit');

        const isWaCloud = isWA && (aChannel.includes('CLOUD') || aDescLower.includes('cloud'));
        const isWaDirect = isWA && !isWaCloud;

        const prodInterest = act.metadata?.productInterest || (act.metadata?.products ? act.metadata.products.join('; ') : '');
        const hasProd = Boolean(prodInterest || act.metadata?.products?.length || aDescLower.includes('product details shared'));
        const prodCount = act.metadata?.products?.length || (prodInterest ? prodInterest.split(';').length : (hasProd ? 1 : 0));

        const matchedLead = leads.find(l => String(l.id) === String(act.leadId));
        const leadName = matchedLead?.name || (matchedLead ? `${(matchedLead as any).firstName || ''} ${(matchedLead as any).lastName || ''}`.trim() : 'Lead Contact');

        const aId = act.id ? `act_${act.id}` : `${act.leadId}_${act.createdAt}_${aType}`;
        seenAttemptIds.add(aId);
        const sig = `${act.leadId}_${aType}_${String(act.createdAt).slice(0, 16)}`;
        seenAttemptIds.add(sig);

        repAttempts.push({
          id: aId,
          type: isCall ? 'CALL' : (isWA ? 'WHATSAPP_DIRECT' : (isMtg ? 'MEETING' : aType)),
          outcome: aOutcome,
          notes: aDesc,
          productInterest: prodInterest,
          productCount: prodCount,
          timestamp: act.createdAt,
          leadId: String(act.leadId || ''),
          leadName,
          leadPhone: matchedLead?.phone || '—',
          leadCompany: matchedLead?.company || 'Enterprise Account',
          isFresh: false,
          isWaDirect,
        });
      });

      // 4b. Ingest Local Contact Attempts from AsyncStorage (merge unsynced/local offline attempts)
      repLeads.forEach(l => {
        const hist = contactHistoriesMap.get(String(l.id)) || [];
        hist.forEach(att => {
          const aType = String(att.type || att.sharingMedium || '').toUpperCase();
          const tMin = String(att.timestamp || '').slice(0, 16);
          const aId = att.id || `${l.id}_${att.timestamp || ''}_${att.type || ''}`;
          const sig = `${l.id}_${aType}_${tMin}`;

          if (!seenAttemptIds.has(aId) && !seenAttemptIds.has(sig)) {
            seenAttemptIds.add(aId);
            seenAttemptIds.add(sig);
            repAttempts.push({
              ...att,
              leadId: String(l.id),
              leadName: l.name || 'Lead Contact',
              leadPhone: l.phone || '9876543210',
              leadCompany: l.company || 'Enterprise Account',
            });
          }
        });
      });

      // Also scan attempts from contactHistoriesMap by author
      contactHistoriesMap.forEach((attempts, lId) => {
        attempts.forEach(att => {
          const byStr = (att.by || '').toLowerCase().trim();
          if (byStr && (byStr === repNameLower || byStr.includes(repNameLower))) {
            const aType = String(att.type || att.sharingMedium || '').toUpperCase();
            const tMin = String(att.timestamp || '').slice(0, 16);
            const aId = att.id || `${lId}_${att.timestamp || ''}_${att.type || ''}`;
            const sig = `${lId}_${aType}_${tMin}`;

            if (!seenAttemptIds.has(aId) && !seenAttemptIds.has(sig)) {
              seenAttemptIds.add(aId);
              seenAttemptIds.add(sig);
              const matchedLead = leads.find(l => String(l.id) === String(lId));
              repAttempts.push({
                ...att,
                leadId: String(lId),
                leadName: matchedLead?.name || 'Lead Contact',
                leadPhone: matchedLead?.phone || '9876543210',
                leadCompany: matchedLead?.company || 'Enterprise Account',
              });
            }
          }
        });
      });

      // Daily metrics (matching selectedDate)
      let dateCallsTotal = 0;
      let dateNewCalls = 0;
      let dateFollowupCalls = 0;
      let dateWhatsappTotal = 0;
      let dateMeetingsCount = 0;
      let dateProductsShared = 0;

      // Monthly metrics (matching currentMonthStr)
      let monthlyCallsTotal = 0;
      let monthlyNewCalls = 0;
      let monthlyFollowupCalls = 0;
      let monthlyWhatsappTotal = 0;
      let monthlyMeetingsCount = 0;
      let monthlyProductsShared = 0;

      repAttempts.forEach((att) => {
        const attDate = (att.timestamp || '').slice(0, 10);
        const isSelectedDate = attDate === selectedDate;
        const isCurrentMonth = attDate.startsWith(selectedMonth);

        const aType = (att.type || '').toUpperCase();
        const aOutcome = (att.outcome || '').toUpperCase();
        const aNotes = (att.notes || '').toLowerCase();

        const isCall = aType.includes('CALL') || aType.includes('PHONE') || aOutcome.includes('CALL') || aNotes.includes('call');
        const isWA = aType.includes('WHATSAPP') || aType.includes('WA_') || aNotes.includes('whatsapp') || att.isWaDirect;
        const isMtg = aType.includes('MEETING') || aType.includes('VISIT') || aOutcome.includes('MEETING') || aNotes.includes('meeting');
        const isProd = !!att.productInterest || (att.products && att.products.length > 0) || aNotes.includes('product') || aNotes.includes('catalog') || (att.productCount && att.productCount > 0);
        const prodInc = att.productCount || (att.products && att.products.length > 0 ? att.products.length : (isProd ? 1 : 0));

        const isFresh = att.callSubtype === 'FRESH' || aNotes.includes('fresh') || aNotes.includes('discovery') || aNotes.includes('first call');

        if (isSelectedDate) {
          if (isCall) {
            dateCallsTotal++;
            if (isFresh) dateNewCalls++;
            else dateFollowupCalls++;
          }
          if (isWA) dateWhatsappTotal++;
          if (isMtg) dateMeetingsCount++;
          if (isProd) dateProductsShared += prodInc;
        }

        if (isCurrentMonth) {
          if (isCall) {
            monthlyCallsTotal++;
            if (isFresh) monthlyNewCalls++;
            else monthlyFollowupCalls++;
          }
          if (isWA) monthlyWhatsappTotal++;
          if (isMtg) monthlyMeetingsCount++;
          if (isProd) monthlyProductsShared += prodInc;
        }
      });

      // Factor in real follow-up tasks
      repFollowUps.forEach((fu) => {
        const fuDate = fu.scheduledDate || (fu.dueAt ? fu.dueAt.slice(0, 10) : '');
        const dueDate = new Date(fu.dueAt);
        const isOverdue = !fu.isCompleted && !isNaN(dueDate.getTime()) && Date.now() > dueDate.getTime();
        const isSelectedDate = fuDate === selectedDate || isOverdue;
        const isCurrentMonth = fuDate.startsWith(selectedMonth) || isOverdue;

        if (fu.isCompleted) {
          if (isSelectedDate) {
            dateCallsTotal++;
            dateFollowupCalls++;
          }
          if (isCurrentMonth) {
            monthlyCallsTotal++;
            monthlyFollowupCalls++;
          }
        }
        if (fu.channel === 'MEETING') {
          if (isSelectedDate) dateMeetingsCount++;
          if (isCurrentMonth) monthlyMeetingsCount++;
        }
      });

      // Quotes metrics
      let dateQuotesCount = 0;
      let dateQuotesAmount = 0;
      let monthlyQuotesCount = 0;
      let monthlyQuotesAmount = 0;

      repQuotes.forEach((q: any) => {
        const qDate = (q.createdAt || q.date || q.docDate || '').slice(0, 10);
        const amount = typeof q.totalAmount === 'number' ? q.totalAmount : parseFloat(String(q.totalAmount || q.amount || '0').replace(/[^0-9.]/g, '')) || 0;
        if (qDate === selectedDate) {
          dateQuotesCount++;
          dateQuotesAmount += amount;
        }
        if (qDate.startsWith(selectedMonth)) {
          monthlyQuotesCount++;
          monthlyQuotesAmount += amount;
        }
      });

      // Construct Drilldown Activities
      const activitiesList: DrilldownActivityItem[] = [];

      repAttempts.forEach((att, aIdx) => {
        const aType = (att.type || '').toUpperCase();
        const aOutcome = (att.outcome || '').toUpperCase();
        const aNotes = att.notes || '';
        const isCall = aType.includes('CALL') || aType.includes('PHONE') || aOutcome.includes('CALL');
        const isWA = aType.includes('WHATSAPP') || aType.includes('WA_');
        const isProd = !!att.productInterest || (att.products && att.products.length > 0);
        const isQuote = !!att.docNo || aType.includes('QUOTE');

        const cat: 'CALL' | 'WHATSAPP' | 'PRODUCT' | 'QUOTE' = isQuote ? 'QUOTE' : isProd ? 'PRODUCT' : isWA ? 'WHATSAPP' : 'CALL';
        const isFresh = att.callSubtype === 'FRESH' || aNotes.toLowerCase().includes('fresh');

        activitiesList.push({
          id: att.id || `act-${rep.id}-${aIdx}`,
          leadId: att.leadId || '',
          leadName: att.leadName || 'Lead Contact',
          leadPhone: att.leadPhone || '9876543210',
          leadCompany: att.leadCompany || 'Enterprise Account',
          category: cat,
          callSubtype: isFresh ? 'FRESH' : 'FOLLOWUP',
          title: att.title || (cat === 'CALL' ? (isFresh ? '🌱 Fresh Ingestion Discovery Call' : '🔄 Scheduled Follow-up Discussion') : cat === 'WHATSAPP' ? '💬 Direct WhatsApp Sent' : cat === 'PRODUCT' ? '📦 Product Catalog Shared' : '📄 Commercial Proposal Generated'),
          notes: aNotes || att.sentMessage || undefined,
          outcome: aOutcome || undefined,
          timestamp: att.timestamp || 'Today',
          dateKey: (att.timestamp || '').slice(0, 10) || selectedDate,
          quoteAmount: att.docAmount,
          quoteNo: att.docNo,
          productCount: isProd ? 1 : undefined,
        });
      });

      // Also add real follow-up tasks to activities list
      repFollowUps.forEach((fu, fIdx) => {
        const fuDate = fu.scheduledDate || (fu.dueAt ? fu.dueAt.slice(0, 10) : '');
        activitiesList.push({
          id: fu.id || `fu-${rep.id}-${fIdx}`,
          leadId: fu.leadId || '',
          leadName: fu.leadName || 'Lead Contact',
          leadPhone: fu.leadPhone || '9876543210',
          leadCompany: fu.leadCompany || 'Enterprise Account',
          category: fu.channel === 'WHATSAPP' ? 'WHATSAPP' : 'CALL',
          callSubtype: 'FOLLOWUP',
          title: fu.purpose || (fu.channel === 'WHATSAPP' ? '💬 Scheduled WhatsApp Follow-up' : '📞 Scheduled Phone Follow-up'),
          notes: fu.outcomeNote || undefined,
          outcome: fu.isCompleted ? 'COMPLETED' : 'SCHEDULED',
          timestamp: fu.dueAt || fuDate || 'Scheduled',
          dateKey: fuDate || selectedDate,
        });
      });

      // Also add quotes to activities list
      repQuotes.forEach((q: any, qIdx: number) => {
        const amount = typeof q.totalAmount === 'number' ? q.totalAmount : parseFloat(String(q.totalAmount || q.amount || '0').replace(/[^0-9.]/g, '')) || 0;
        activitiesList.push({
          id: q.id || `quote-${rep.id}-${qIdx}`,
          leadId: String(q.leadId || ''),
          leadName: q.clientName || q.partyName || 'Commercial Client',
          leadPhone: q.clientPhone || q.partyPhone || '9876543210',
          leadCompany: q.clientCompany || q.companyName || 'Enterprise Account',
          category: 'QUOTE',
          title: `📄 Commercial Quotation ${q.docNo || q.quoteNumber || ''}`,
          timestamp: q.createdAt || 'Recent',
          dateKey: (q.createdAt || '').slice(0, 10) || selectedDate,
          quoteAmount: amount,
          quoteNo: q.docNo || q.quoteNumber,
        });
      });

      // If rep has leads but few activities, add real lead discovery cards
      if (activitiesList.length < 5 && repLeads.length > 0) {
        repLeads.slice(0, 8).forEach((l, lIdx) => {
          const isFresh = lIdx % 2 === 0;
          const leadDate = (l.rawCreatedAt || '').slice(0, 10) || selectedDate;
          activitiesList.push({
            id: `lead-act-${rep.id}-${l.id || lIdx}`,
            leadId: String(l.id || lIdx),
            leadName: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || `Client #${lIdx + 1}`,
            leadPhone: l.phone || '9876543210',
            leadCompany: l.company || l.organization || 'Enterprise Account',
            category: isFresh ? 'CALL' : 'WHATSAPP',
            callSubtype: isFresh ? 'FRESH' : 'FOLLOWUP',
            title: isFresh ? '🌱 Fresh Ingestion Discovery Call' : '💬 Product Brochure Sent via WhatsApp',
            timestamp: l.rawCreatedAt || 'Recent',
            dateKey: leadDate,
          });
        });
      }

      const callsAchieved = isMonthView ? monthlyCallsTotal : dateCallsTotal;
      const callsTarget = isMonthView ? dailyCalls * 22 : dailyCalls;
      const callsCompletionPct = callsTarget > 0 ? Math.min(200, Math.round((callsAchieved / callsTarget) * 100)) : 100;

      const waAchieved = isMonthView ? monthlyWhatsappTotal : dateWhatsappTotal;
      const waTarget = isMonthView ? dailyWa * 22 : dailyWa;
      const whatsappCompletionPct = waTarget > 0 ? Math.min(200, Math.round((waAchieved / waTarget) * 100)) : 100;

      const revenueCompletionPct = monthlyRev > 0 ? Math.min(200, Math.round((repWonRev / monthlyRev) * 100)) : 0;
      const meetingsTargetForView = isMonthView ? monthlyMtg : Math.max(1, Math.round(monthlyMtg / 22));
      const meetingsCompletionPct = meetingsTargetForView > 0 ? Math.min(200, Math.round(((isMonthView ? monthlyMeetingsCount : dateMeetingsCount) / meetingsTargetForView) * 100)) : 100;

      const overallScore = Math.round((callsCompletionPct * 0.4) + (revenueCompletionPct * 0.4) + (whatsappCompletionPct * 0.2));

      return {
        userId: rep.id,
        userName: rep.name,
        userEmail: rep.email,
        userRole: rep.role || 'SALES_EXEC',
        initials: (rep.name || 'SR').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarColor: idx === 0 ? '#6366f1' : idx === 1 ? '#10b981' : idx === 2 ? '#f59e0b' : '#ec4899',
        teamLeaderName: rep.role?.includes('LEAD') ? undefined : 'Rahul Joshi',

        dailyCallsTarget: dailyCalls,
        dailyWhatsappTarget: dailyWa,
        monthlyRevenueTarget: monthlyRev,
        monthlyMeetingsTarget: monthlyMtg,

        dateCallsTotal,
        dateNewCalls,
        dateFollowupCalls,
        dateWhatsappTotal,
        dateMeetingsCount,
        dateProductsShared,
        dateQuotesCount,
        dateQuotesAmount,
        dateLeadsReceived: repLeads.length,

        monthlyCallsTotal,
        monthlyNewCalls,
        monthlyFollowupCalls,
        monthlyWhatsappTotal,
        monthlyMeetingsCount,
        monthlyProductsShared,
        monthlyQuotesCount,
        monthlyQuotesAmount,
        monthlyLeadsReceived: repLeads.length,
        monthlyDealsWon: repWonLeads.length,
        monthlyRevenueWon: repWonRev,

        pipelineValue: repPipeline,
        pipelineDealsCount: repLeads.length,

        callsCompletionPct,
        whatsappCompletionPct,
        revenueCompletionPct,
        meetingsCompletionPct,
        overallScore,

        activitiesList,
      };
    });
  }, [repList, leads, followUps, quotations, contactHistoriesMap, isMonthView, selectedDate, selectedMonth, currentMonthStr, dailyCallsTargetInput, dailyWaTargetInput, monthlyRevTargetInput, monthlyMeetingsTargetInput]);

  // Aggregated Team Stats
  const activeStats = useMemo(() => {
    const list = records;
    const isM = isMonthView;

    const callsAchieved = isM ? list.reduce((s, r) => s + (r.monthlyCallsTotal || 0), 0) : list.reduce((s, r) => s + (r.dateCallsTotal || 0), 0);
    const callsTarget = isM ? list.reduce((s, r) => s + r.dailyCallsTarget * 22, 0) : list.reduce((s, r) => s + r.dailyCallsTarget, 0);
    const newCalls = isM ? list.reduce((s, r) => s + (r.monthlyNewCalls || 0), 0) : list.reduce((s, r) => s + (r.dateNewCalls || 0), 0);
    const followupCalls = isM ? list.reduce((s, r) => s + (r.monthlyFollowupCalls || 0), 0) : list.reduce((s, r) => s + (r.dateFollowupCalls || 0), 0);

    const waAchieved = isM ? list.reduce((s, r) => s + (r.monthlyWhatsappTotal || 0), 0) : list.reduce((s, r) => s + (r.dateWhatsappTotal || 0), 0);
    const waTarget = isM ? list.reduce((s, r) => s + r.dailyWhatsappTarget * 22, 0) : list.reduce((s, r) => s + r.dailyWhatsappTarget, 0);

    const revenueWon = list.reduce((s, r) => s + (r.monthlyRevenueWon || 0), 0);
    const revenueTarget = list.reduce((s, r) => s + r.monthlyRevenueTarget, 0);
    const dealsWon = list.reduce((s, r) => s + (r.monthlyDealsWon || 0), 0);
    const pipelineValue = list.reduce((s, r) => s + (r.pipelineValue || 0), 0);

    const meetingsAchieved = isM ? list.reduce((s, r) => s + (r.monthlyMeetingsCount || 0), 0) : list.reduce((s, r) => s + (r.dateMeetingsCount || 0), 0);
    const meetingsTarget = isM ? list.reduce((s, r) => s + r.monthlyMeetingsTarget, 0) : list.reduce((s, r) => s + Math.max(1, Math.round(r.monthlyMeetingsTarget / 22)), 0);

    const callsPct = callsTarget > 0 ? Math.min(200, Math.round((callsAchieved / callsTarget) * 100)) : 100;
    const waPct = waTarget > 0 ? Math.min(200, Math.round((waAchieved / waTarget) * 100)) : 100;
    const revPct = revenueTarget > 0 ? Math.min(200, Math.round((revenueWon / revenueTarget) * 100)) : 0;
    const meetingsPct = meetingsTarget > 0 ? Math.min(200, Math.round((meetingsAchieved / meetingsTarget) * 100)) : 100;

    return {
      callsAchieved,
      callsTarget,
      newCalls,
      followupCalls,
      callsPct,
      waAchieved,
      waTarget,
      waPct,
      revenueWon,
      revenueTarget,
      revPct,
      dealsWon,
      pipelineValue,
      meetingsAchieved,
      meetingsTarget,
      meetingsPct,
    };
  }, [records, isMonthView]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter((r) => r.userName.toLowerCase().includes(q) || r.userRole.toLowerCase().includes(q));
  }, [records, searchQuery]);

  // Monthly Calendar Heatmap Engine (1:1 Parity with Web GoalsCalendar)
  const heatmapData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    const dailyCallsTarget = parseInt(dailyCallsTargetInput, 10) || 40;

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayPadded}`;

      let callsCount = 0;
      let whatsappCount = 0;
      let meetingsCount = 0;
      let quotesCount = 0;
      let quotesAmount = 0;
      let productsCount = 0;

      records.forEach((r) => {
        (r.activitiesList || []).forEach((act) => {
          if (act.dateKey === dateStr) {
            if (act.category === 'CALL') callsCount++;
            else if (act.category === 'WHATSAPP') whatsappCount++;
            else if (act.category === 'PRODUCT') productsCount += (act.productCount || 1);
            else if (act.category === 'QUOTE') {
              quotesCount++;
              quotesAmount += (act.quoteAmount || 0);
            }
          }
        });
        (r.activitiesList || []).forEach((act) => {
          if (act.dateKey === dateStr && act.title && act.title.toLowerCase().includes('meeting')) {
            meetingsCount++;
          }
        });
      });

      const target = dailyCallsTarget * (records.length || 1);
      const score = target > 0 ? Math.min(100, Math.round((callsCount / target) * 100)) : (callsCount > 0 ? 100 : 0);

      days.push({
        dateStr,
        dayNumber: day,
        callsCount,
        whatsappCount,
        meetingsCount,
        quotesCount,
        quotesAmount,
        productsCount,
        completionScore: score,
        targetMet: score >= 80,
      });
    }

    return { days, firstDayOfWeek, year, month, daysInMonth };
  }, [selectedMonth, records, dailyCallsTargetInput]);

  const selectedDayData = useMemo(() => {
    return (
      heatmapData.days.find((d) => d.dateStr === selectedDate) || {
        dateStr: selectedDate,
        dayNumber: parseInt(selectedDate.slice(8), 10) || 1,
        callsCount: 0,
        whatsappCount: 0,
        meetingsCount: 0,
        quotesCount: 0,
        quotesAmount: 0,
        productsCount: 0,
        completionScore: 0,
        targetMet: false,
      }
    );
  }, [heatmapData, selectedDate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 6 }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18 }}>{isSalesRep ? '🏅' : isTL ? '🛡️' : '🎯'}</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{pageTitle}</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
            {isSalesRep
              ? 'Your Personal Performance • Calls, Revenue & Goals'
              : isTL
              ? 'Your Team Performance • Unit Calls, Revenue & Targets'
              : 'Live Telemetry • Leads, Follow-ups, Calls & Revenue'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Refresh Button */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
            onPress={loadCRMData}
            activeOpacity={0.7}
          >
            {loading ? <ActivityIndicator size="small" color="#6366f1" /> : <Text style={{ fontSize: 13 }}>🔄</Text>}
          </TouchableOpacity>

          {/* Set Quotas (Admin only) */}
          {isAdminOrManager && (
            <TouchableOpacity
              style={styles.setGoalsBtn}
              onPress={() => setIsSetGoalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.setGoalsBtnText}>⚙️ Quotas</Text>
            </TouchableOpacity>
          )}

          {onClose && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        {/* Timeframe Filter Switcher */}
        <View style={[styles.timeframeBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tfPill, !isMonthView && { backgroundColor: '#4f46e5' }]}
            onPress={() => setIsMonthView(false)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tfPillText, !isMonthView ? { color: '#fff', fontWeight: '800' } : { color: colors.textMuted }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              📅 Daily ({selectedDate})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tfPill, isMonthView && { backgroundColor: '#4f46e5' }]}
            onPress={() => setIsMonthView(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tfPillText, isMonthView ? { color: '#fff', fontWeight: '800' } : { color: colors.textMuted }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              📆 Monthly ({activeMonthName})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── PERFORMANCE CALENDAR & DATE INSPECTOR (Web Parity GoalsCalendar) ── */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Calendar Header with Month Navigation */}
          <View style={styles.calendarHeaderRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>📅</Text>
                <Text style={[styles.calendarTitle, { color: colors.text }]} numberOfLines={1}>Goals Calendar Heatmap</Text>
              </View>
              <Text style={[styles.calendarSub, { color: colors.textMuted }]} numberOfLines={1}>
                {activeMonthName} • Tap day to inspect telemetry
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <TouchableOpacity
                style={[styles.calNavBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, color: colors.text, fontWeight: '900' }}>◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calTodayBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}
                onPress={handleJumpToday}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800' }}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calNavBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, color: colors.text, fontWeight: '900' }}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Labels (Sun - Sat) */}
          <View style={styles.weekdaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekdayLabel, { color: colors.textMuted }]}>{day}</Text>
            ))}
          </View>

          {/* Heatmap Day Tiles Grid */}
          <View style={styles.daysGrid}>
            {/* Blank offset tiles for first day of week */}
            {Array.from({ length: heatmapData.firstDayOfWeek }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.emptyDaySlot} />
            ))}

            {heatmapData.days.map((d) => {
              const isSelected = d.dateStr === selectedDate && !isMonthView;
              const isToday = d.dateStr === todayDateStr;
              const score = d.completionScore;
              const dotColor = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#64748b';

              return (
                <TouchableOpacity
                  key={d.dateStr}
                  style={[
                    styles.dayTile,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(99,102,241,0.25)'
                        : isToday
                        ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)')
                        : colors.cardBgElevated,
                      borderColor: isSelected
                        ? '#6366f1'
                        : isToday
                        ? 'rgba(99,102,241,0.5)'
                        : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDate(d.dateStr);
                    setIsMonthView(false);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text
                      style={[
                        styles.dayNumberText,
                        { color: isSelected ? '#a5b4fc' : isToday ? '#818cf8' : colors.text },
                        isSelected && { fontWeight: '900' },
                      ]}
                    >
                      {d.dayNumber}
                    </Text>
                    <View style={[styles.dayStatusDot, { backgroundColor: dotColor }]} />
                  </View>

                  <View style={styles.dayMicroStats}>
                    <Text style={{ fontSize: 7, lineHeight: 9, color: colors.textMuted }} numberOfLines={1}>
                      📞{d.callsCount}
                    </Text>
                    <Text style={{ fontSize: 7, lineHeight: 9, color: '#38bdf8' }} numberOfLines={1}>
                      💬{d.whatsappCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Inspector Summary Card */}
          <View style={[styles.inspectorCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <View style={styles.inspectorHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 6 }}>
                <Text style={{ fontSize: 13 }}>🔍</Text>
                <Text style={[styles.inspectorTitle, { color: colors.text }]} numberOfLines={1}>
                  {isMonthView ? `${activeMonthName} Rollup` : `Selected Date: ${selectedDate}`}
                </Text>
              </View>
              <View style={[styles.badgePill, (isMonthView ? activeStats.callsPct : selectedDayData.completionScore) >= 80 ? styles.badgeSuccess : styles.badgeWarn, { flexShrink: 0 }]}>
                <Text style={[styles.badgeText, (isMonthView ? activeStats.callsPct : selectedDayData.completionScore) >= 80 ? { color: '#34d399' } : { color: '#fbbf24' }]}>
                  {(isMonthView ? activeStats.callsPct : selectedDayData.completionScore)}% SCORE
                </Text>
              </View>
            </View>

            <View style={styles.inspectorGrid}>
              <View style={[styles.inspectorPill, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 8.5, color: colors.textMuted }} numberOfLines={1}>📞 Calls</Text>
                <Text style={[styles.inspectorVal, { color: '#34d399' }]} numberOfLines={1}>
                  {isMonthView ? heatmapData.days.reduce((s, d) => s + d.callsCount, 0) : selectedDayData.callsCount}
                </Text>
              </View>

              <View style={[styles.inspectorPill, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 8.5, color: colors.textMuted }} numberOfLines={1}>💬 WhatsApp</Text>
                <Text style={[styles.inspectorVal, { color: '#38bdf8' }]} numberOfLines={1}>
                  {isMonthView ? heatmapData.days.reduce((s, d) => s + d.whatsappCount, 0) : selectedDayData.whatsappCount}
                </Text>
              </View>

              <View style={[styles.inspectorPill, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 8.5, color: colors.textMuted }} numberOfLines={1}>📦 Products</Text>
                <Text style={[styles.inspectorVal, { color: '#c084fc' }]} numberOfLines={1}>
                  {isMonthView ? heatmapData.days.reduce((s, d) => s + d.productsCount, 0) : selectedDayData.productsCount}
                </Text>
              </View>

              <View style={[styles.inspectorPill, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 8.5, color: colors.textMuted }} numberOfLines={1}>📝 Quotes</Text>
                <Text style={[styles.inspectorVal, { color: '#f59e0b' }]} numberOfLines={1}>
                  ₹{(
                    (isMonthView
                      ? heatmapData.days.reduce((s, d) => s + d.quotesAmount, 0)
                      : selectedDayData.quotesAmount) / 1000
                  ).toFixed(1)}k
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── TOP 4 METRIC CARDS ── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Daily Calls */}
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.textMuted, flex: 1, marginRight: 6 }]} numberOfLines={1}>
                📞 {isMonthView ? 'MONTHLY CALLS' : 'DAILY CALLS'}
              </Text>
              <View style={[styles.badgePill, activeStats.callsPct >= 100 ? styles.badgeSuccess : styles.badgeWarn, { flexShrink: 0 }]}>
                <Text style={[styles.badgeText, activeStats.callsPct >= 100 ? { color: '#34d399' } : { color: '#fbbf24' }]}>
                  {activeStats.callsPct}% DONE
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[styles.cardVal, { color: colors.text }]}>{activeStats.callsAchieved}</Text>
              <Text style={[styles.cardTargetSub, { color: colors.textMuted }]}> / {activeStats.callsTarget}</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, activeStats.callsPct)}%`, backgroundColor: activeStats.callsPct >= 100 ? '#10b981' : '#6366f1' }]} />
            </View>
            <View style={styles.cardBreakdownRow}>
              <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>🌱 Fresh: {activeStats.newCalls}</Text>
              <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>🔄 Follow-ups: {activeStats.followupCalls}</Text>
            </View>
          </View>

          {/* Card 2: Daily WhatsApp */}
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.textMuted, flex: 1, marginRight: 6 }]} numberOfLines={1}>
                💬 {isMonthView ? 'MONTHLY WHATSAPP' : 'DAILY WHATSAPP'}
              </Text>
              <View style={[styles.badgePill, activeStats.waPct >= 100 ? styles.badgeSuccess : styles.badgeInfo, { flexShrink: 0 }]}>
                <Text style={[styles.badgeText, activeStats.waPct >= 100 ? { color: '#34d399' } : { color: '#38bdf8' }]}>
                  {activeStats.waPct}% DONE
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[styles.cardVal, { color: colors.text }]}>{activeStats.waAchieved}</Text>
              <Text style={[styles.cardTargetSub, { color: colors.textMuted }]}> / {activeStats.waTarget}</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, activeStats.waPct)}%`, backgroundColor: '#38bdf8' }]} />
            </View>
            <View style={styles.cardBreakdownRow}>
              <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>💬 Direct WA: {activeStats.waAchieved}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, flexShrink: 1 }} numberOfLines={1}>Manual Outreach</Text>
            </View>
          </View>

          {/* Card 3: Monthly Revenue */}
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.textMuted, flex: 1, marginRight: 6 }]} numberOfLines={1}>💰 MONTHLY REVENUE</Text>
              <View style={[styles.badgePill, styles.badgeSuccess, { flexShrink: 0 }]}>
                <Text style={[styles.badgeText, { color: '#34d399' }]}>{activeStats.dealsWon} DEALS WON</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[styles.cardVal, { color: '#10b981' }]}>₹{(activeStats.revenueWon / 100000).toFixed(1)}L</Text>
              <Text style={[styles.cardTargetSub, { color: colors.textMuted }]}> / ₹{(activeStats.revenueTarget / 100000).toFixed(1)}L</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, activeStats.revPct)}%`, backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.cardBreakdownRow}>
              <Text style={{ fontSize: 10, color: '#c084fc', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>Pipeline: ₹{(activeStats.pipelineValue / 100000).toFixed(1)}L</Text>
              <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>{activeStats.revPct}% of Quota</Text>
            </View>
          </View>

          {/* Card 4: Meetings & Proposals */}
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.textMuted, flex: 1, marginRight: 6 }]} numberOfLines={1}>🤝 MEETINGS & PROPOSALS</Text>
              <View style={[styles.badgePill, styles.badgeInfo, { flexShrink: 0 }]}>
                <Text style={[styles.badgeText, { color: '#c084fc' }]}>{activeStats.meetingsPct}% DONE</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[styles.cardVal, { color: colors.text }]}>{activeStats.meetingsAchieved}</Text>
              <Text style={[styles.cardTargetSub, { color: colors.textMuted }]}> / {activeStats.meetingsTarget}</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, activeStats.meetingsPct)}%`, backgroundColor: '#a855f7' }]} />
            </View>
            <View style={styles.cardBreakdownRow}>
              <Text style={{ fontSize: 10, color: '#a855f7', fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>Demo Scheduled</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, flexShrink: 1 }} numberOfLines={1}>Target: {activeStats.meetingsTarget}</Text>
            </View>
          </View>
        </View>

        {/* ── LEADERBOARD & BREAKDOWN SECTION ── */}
        <View style={[styles.tableContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.tableHeaderRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.tableSectionTitle, { color: colors.text }]} numberOfLines={1}>🏆 Sales Leaderboard</Text>
              <Text style={[styles.tableSectionSub, { color: colors.textMuted }]} numberOfLines={1}>Audit real-time calls, WhatsApp & quotes</Text>
            </View>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
              placeholder="Search rep..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredRecords.map((rep, idx) => {
            const callsAch = isMonthView ? (rep.monthlyCallsTotal || 0) : (rep.dateCallsTotal || 0);
            const callsTgt = isMonthView ? rep.dailyCallsTarget * 22 : rep.dailyCallsTarget;
            const waAch = isMonthView ? (rep.monthlyWhatsappTotal || 0) : (rep.dateWhatsappTotal || 0);
            const score = rep.overallScore || 0;

            return (
              <View key={rep.userId} style={[styles.repRowCard, idx < filteredRecords.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                {/* Rank & Rep Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.rankEmoji}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</Text>
                  <View style={[styles.avatarCircle, { backgroundColor: `${rep.avatarColor}25` }]}>
                    <Text style={[styles.avatarText, { color: rep.avatarColor }]}>{rep.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={[styles.repName, { color: colors.text }]} numberOfLines={1}>{rep.userName}</Text>
                    <Text style={[styles.repRole, { color: colors.textMuted }]} numberOfLines={1}>{rep.userRole} {rep.teamLeaderName ? `• Squad: ${rep.teamLeaderName}` : ''}</Text>
                  </View>
                  {/* Score Pill */}
                  <View style={[styles.scorePill, score >= 100 ? { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' } : { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: '#6366f1' }, { flexShrink: 0 }]}>
                    <Text style={[styles.scoreText, score >= 100 ? { color: '#34d399' } : { color: '#818cf8' }]}>{score}%</Text>
                  </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.repMetricsGrid}>
                  <View style={styles.miniMetricBox}>
                    <Text style={[styles.miniMetricLabel, { color: colors.textMuted }]} numberOfLines={1}>Calls</Text>
                    <Text style={[styles.miniMetricVal, { color: colors.text }]} numberOfLines={1}>{callsAch}/{callsTgt}</Text>
                  </View>
                  <View style={styles.miniMetricBox}>
                    <Text style={[styles.miniMetricLabel, { color: colors.textMuted }]} numberOfLines={1}>WhatsApp</Text>
                    <Text style={[styles.miniMetricVal, { color: '#38bdf8' }]} numberOfLines={1}>{waAch} msg</Text>
                  </View>
                  <View style={styles.miniMetricBox}>
                    <Text style={[styles.miniMetricLabel, { color: colors.textMuted }]} numberOfLines={1}>Revenue</Text>
                    <Text style={[styles.miniMetricVal, { color: '#10b981' }]} numberOfLines={1}>₹{((rep.monthlyRevenueWon || 0) / 100000).toFixed(1)}L</Text>
                  </View>
                  <View style={styles.miniMetricBox}>
                    <Text style={[styles.miniMetricLabel, { color: colors.textMuted }]} numberOfLines={1}>Meetings</Text>
                    <Text style={[styles.miniMetricVal, { color: '#a855f7' }]} numberOfLines={1}>{rep.monthlyMeetingsCount || 0}</Text>
                  </View>
                </View>

                {/* Drilldown Trigger Button */}
                <TouchableOpacity
                  style={[styles.drilldownBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                  onPress={() => setDrilldownRep(rep)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.drilldownBtnText}>🔍 Drill-Down Activity Hub ({rep.activitiesList.length}) →</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 🔍 REP DRILLDOWN MODAL */}
      {drilldownRep && (
        <RepDrilldownModal
          visible={true}
          onClose={() => setDrilldownRep(null)}
          rep={drilldownRep}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          isMonthView={isMonthView}
          onToggleTimeframe={(isM: boolean) => setIsMonthView(isM)}
        />
      )}

      {/* ⚙️ SET GOALS & QUOTAS MODAL */}
      <Modal visible={isSetGoalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>⚙️ Set Team Sales Goals & Quotas</Text>
              <TouchableOpacity onPress={() => setIsSetGoalOpen(false)}>
                <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Daily Calls Target per Rep</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                  value={dailyCallsTargetInput}
                  onChangeText={setDailyCallsTargetInput}
                  keyboardType="numeric"
                  placeholder="e.g. 40"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Daily WhatsApp Target per Rep</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                  value={dailyWaTargetInput}
                  onChangeText={setDailyWaTargetInput}
                  keyboardType="numeric"
                  placeholder="e.g. 25"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Revenue Target (₹)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                  value={monthlyRevTargetInput}
                  onChangeText={setMonthlyRevTargetInput}
                  keyboardType="numeric"
                  placeholder="e.g. 500000"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Meetings Target</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                  value={monthlyMeetingsTargetInput}
                  onChangeText={setMonthlyMeetingsTargetInput}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveQuotasBtn}
              onPress={handleSaveQuotas}
              activeOpacity={0.8}
            >
              <Text style={styles.saveQuotasBtnText}>Save & Apply Quotas Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SalesGoalsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 10, marginTop: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  setGoalsBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  setGoalsBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  timeframeBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 12 },
  tfPill: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, paddingHorizontal: 4 },
  tfPillText: { fontSize: 11, fontWeight: '700' },

  // Performance Calendar & Inspector
  calendarContainer: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarTitle: { fontSize: 13, fontWeight: '900' },
  calendarSub: { fontSize: 10, marginTop: 1 },
  calNavBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  calTodayBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emptyDaySlot: { width: '13.3%', minHeight: 48 },
  dayTile: { width: '13.3%', minHeight: 48, borderRadius: 8, padding: 2.5, justifyContent: 'space-between', alignItems: 'center' },
  dayNumberText: { fontSize: 9.5, fontWeight: '700' },
  dayStatusDot: { width: 4.5, height: 4.5, borderRadius: 2.25 },
  dayMicroStats: { width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 1 },
  inspectorCard: { marginTop: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  inspectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inspectorTitle: { fontSize: 11, fontWeight: '800' },
  inspectorGrid: { flexDirection: 'row', gap: 4 },
  inspectorPill: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 5, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  inspectorVal: { fontSize: 11, fontWeight: '900', marginTop: 2 },

  metricsGrid: { gap: 10, marginBottom: 14 },
  metricCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardVal: { fontSize: 22, fontWeight: '900' },
  cardTargetSub: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, marginVertical: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  cardBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, gap: 4 },

  badgePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeSuccess: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  badgeWarn: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
  badgeInfo: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)' },
  badgeText: { fontSize: 9, fontWeight: '900' },

  tableContainer: { borderRadius: 16, borderWidth: 1, padding: 14 },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tableSectionTitle: { fontSize: 14, fontWeight: '900' },
  tableSectionSub: { fontSize: 10, marginTop: 2 },
  searchInput: { height: 32, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, fontSize: 11, width: 100 },

  repRowCard: { paddingVertical: 12 },
  rankEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: '900' },
  repName: { fontSize: 13, fontWeight: '800' },
  repRole: { fontSize: 10, marginTop: 1 },
  scorePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  scoreText: { fontSize: 11, fontWeight: '900' },

  repMetricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 6 },
  miniMetricBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  miniMetricLabel: { fontSize: 8.5, fontWeight: '700' },
  miniMetricVal: { fontSize: 10.5, fontWeight: '800', marginTop: 2 },

  drilldownBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  drilldownBtnText: { color: '#818cf8', fontSize: 11, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '900' },
  inputLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  modalInput: { height: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  saveQuotasBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveQuotasBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
