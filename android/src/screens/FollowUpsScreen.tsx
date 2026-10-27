/**
 * FollowUpsScreen.tsx — DAS CRM Android
 * Full 1:1 Functional & Visual Parity with Web Follow-ups & Tasks Module
 *
 * Capabilities:
 * 1. Live Multi-source Pipeline: Backend (/follow-ups) + Offline Cache + Real Contact History Scanner.
 * 2. 4 Telemetry Metrics: Today Due, Upcoming, Overdue, Done (Real-time count & completion rate).
 * 3. 5 Pipeline Tabs: Today, Upcoming, Overdue, Completed, All Tasks.
 * 4. Channel Filters: All Channels, Calls, WhatsApp, Email, Meetings & Demos.
 * 5. Admin / Manager Sales Rep Filter Bar (Scoping by representative).
 * 6. Interactive 1-Tap Execution: Native Phone Call, Direct WhatsApp with prefilled message.
 * 7. Complete & Log Outcome Modal with "Schedule Next Follow-up" chaining.
 * 8. Reschedule Modal with quick 1-tap presets (+1 hr, +3 hrs, Tomorrow 10 AM, In 2 Days, Custom Date/Time & Reason).
 * 9. Cancel Modal with reason categorization.
 * 10. "+ Schedule Follow-up" Modal with searchable real lead picker & rep assignment.
 * 11. Lead Navigation: Tap prospect or "Open ↗" to jump directly into Lead Profile Workspace.
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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { apiService, LeadItem } from '../services/apiService';
import {
  followUpSyncEngine,
  FollowUpTask,
  ChannelType,
  PriorityLevel,
  parseDateAndTimeToIso,
} from '../services/followUpSyncEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabId = 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL';
export type ChannelFilter = 'ALL' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'HIGH_PRIORITY';
export { FollowUpTask };

interface Props {
  onClose?: () => void;
  onNavigateToLead?: (leadId: string) => void;
  navigation?: any;
  embedded?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FollowUpsScreen: React.FC<Props> = ({ onClose, onNavigateToLead, navigation, embedded = false }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [realLeads, setRealLeads] = useState<LeadItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('TODAY');
  const [activeChannel, setActiveChannel] = useState<ChannelFilter>('ALL');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [rescheduleTask, setRescheduleTask] = useState<FollowUpTask | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:30 AM');
  const [rescheduleReasonCategory, setRescheduleReasonCategory] = useState('Client requested different time');
  const [rescheduleNote, setRescheduleNote] = useState('');

  const [completeTask, setCompleteTask] = useState<FollowUpTask | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('Connected & Interested');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [scheduleNextAfterComplete, setScheduleNextAfterComplete] = useState<boolean>(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00 AM');
  const [nextFollowUpChannel, setNextFollowUpChannel] = useState<ChannelType>('CALL');

  const [cancelTask, setCancelTask] = useState<FollowUpTask | null>(null);
  const [cancelReasonCategory, setCancelReasonCategory] = useState('Client Cancelled / Postponed Indefinitely');
  const [cancelNotes, setCancelNotes] = useState('');

  // New Follow-up Form States
  const [newLeadId, setNewLeadId] = useState('');
  const [newLeadSearch, setNewLeadSearch] = useState('');
  const [newChannel, setNewChannel] = useState<ChannelType>('CALL');
  const [newPurpose, setNewPurpose] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('HIGH');
  const [newCustomDate, setNewCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newCustomTime, setNewCustomTime] = useState('10:30 AM');
  const [newDuePreset, setNewDuePreset] = useState<'TODAY_1130' | 'TODAY_1500' | 'TOMORROW_1000' | 'NEXT_WEEK' | 'CUSTOM'>('TODAY_1130');
  const [newAssignedRep, setNewAssignedRep] = useState<string>(currentUser?.name || 'Admin');

  // Role resolution
  const userRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const isAdminOrManager = userRole.includes('ADMIN') || userRole.includes('MANAGER') || userRole === 'SUPER_ADMIN';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleOpenLead = (leadId: string, leadName?: string) => {
    if (onNavigateToLead) {
      onNavigateToLead(leadId);
    } else if (navigation) {
      if (onClose) onClose();
      try {
        navigation.navigate('Leads', {
          screen: 'LeadDetail',
          params: { leadId, leadName: leadName || 'Lead File', origin: 'Menu' },
        });
      } catch (_) {
        try {
          navigation.navigate('LeadDetail', { leadId, leadName });
        } catch {}
      }
    }
  };

  // ─── Fetch Real Leads & Multi-Source Follow-ups ─────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real leads from API / storage
      const fetchedLeads = await apiService.getLeads();
      const validLeads = Array.isArray(fetchedLeads) ? fetchedLeads : [];
      setRealLeads(validLeads);

      // 2. Multi-source Follow-ups Load (Server + Local Cache + Lead Contact History Scanner)
      const allFollowUps = await followUpSyncEngine.loadAllFollowUps(token, currentUser, validLeads);
      setTasks(allFollowUps);
    } catch (err) {
      console.warn('Follow-ups fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Telemetry Summary Metrics ──────────────────────────────────────────────

  const summary = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const twoMinutesAgoMs = nowMs - 2 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayIsoDate = `${yyyy}-${mm}-${dd}`;

    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach((t) => {
      if (t.isCompleted) {
        completedCount++;
        return;
      }
      const dueTime = new Date(t.dueAt).getTime();
      const taskDateIso = t.dueAt ? t.dueAt.slice(0, 10) : (t.scheduledDate || '');
      // Transitions to OVERDUE only after 2 minutes have crossed
      const isPastDue = !isNaN(dueTime) && dueTime < twoMinutesAgoMs;

      if (isPastDue) {
        overdueCount++;
      } else {
        const isScheduledToday = taskDateIso === todayIsoDate || (!isNaN(dueTime) && dueTime >= todayStart && dueTime < todayEnd);
        if (isScheduledToday) {
          todayCount++;
        } else if (taskDateIso > todayIsoDate || (!isNaN(dueTime) && dueTime >= todayEnd)) {
          upcomingCount++;
        }
      }
    });

    const totalActive = tasks.length;
    const completionRate = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

    return {
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
      completed: completedCount,
      total: totalActive,
      completionRate,
    };
  }, [tasks]);

  // ─── Filtered Tasks List ────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const twoMinutesAgoMs = nowMs - 2 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayIsoDate = `${yyyy}-${mm}-${dd}`;

    return tasks.filter((t) => {
      const taskTime = new Date(t.dueAt).getTime();
      const taskDateIso = t.dueAt ? t.dueAt.slice(0, 10) : (t.scheduledDate || '');
      // Overdue after 2 minutes past due time
      const isPastDue = !isNaN(taskTime) && taskTime < twoMinutesAgoMs;
      const isScheduledToday = !isPastDue && (taskDateIso === todayIsoDate || (!isNaN(taskTime) && taskTime >= todayStart && taskTime < todayEnd));
      const isUpcoming = !isPastDue && (taskDateIso > todayIsoDate || (!isNaN(taskTime) && taskTime >= todayEnd));

      // Tab filter
      if (activeTab === 'TODAY') {
        if (t.isCompleted) return false;
        if (!isScheduledToday) return false;
      } else if (activeTab === 'UPCOMING') {
        if (t.isCompleted) return false;
        if (!isUpcoming) return false;
      } else if (activeTab === 'OVERDUE') {
        if (t.isCompleted) return false;
        if (!isPastDue) return false;
      } else if (activeTab === 'COMPLETED') {
        if (!t.isCompleted) return false;
      }
      // 'ALL' tab includes all tasks regardless of completed/pending status

      // Channel & Type filter (Web parity)
      if (activeChannel === 'HIGH_PRIORITY') {
        if (t.priority !== 'URGENT' && t.priority !== 'HIGH') return false;
      } else if (activeChannel !== 'ALL' && t.channel !== activeChannel) {
        return false;
      }

      // Rep filter (Optional dropdown/chip selection)
      if (selectedRepFilter !== 'ALL') {
        if (!t.assignedRepName.toLowerCase().includes(selectedRepFilter.toLowerCase())) {
          return false;
        }
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          t.leadName.toLowerCase().includes(q) ||
          t.leadCompany.toLowerCase().includes(q) ||
          t.leadPhone.toLowerCase().includes(q) ||
          t.purpose.toLowerCase().includes(q) ||
          t.assignedRepName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [tasks, activeTab, activeChannel, selectedRepFilter, search, isAdminOrManager, currentUser]);

  // ─── Quick Actions ──────────────────────────────────────────────────────────

  // ─── Quick Preset Launcher (Web Parity) ───────────────────────────────────

  const handleQuickCreatePreset = (channel: ChannelType) => {
    setNewChannel(channel);
    setNewLeadSearch('');
    setNewLeadId('');
    setNewPurpose('');
    if (channel === 'MEETING') {
      setNewDuePreset('TOMORROW_1000');
    } else {
      setNewDuePreset('TODAY_1130');
    }
    setShowScheduleModal(true);
  };

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean) {
      Linking.openURL(`tel:${clean}`).catch(() => {
        Alert.alert('Unable to Dial', `Could not initiate call to ${clean}`);
      });
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    const text = encodeURIComponent(`Hi ${name}, following up from DAS CRM regarding our recent discussion. Are you available for a quick update?`);
    Linking.openURL(`https://wa.me/${clean}?text=${text}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Please ensure WhatsApp is installed.');
    });
  };

  // ─── Reschedule Task Handler ────────────────────────────────────────────────

  const submitReschedule = async (newDateStr: string, newTimeStr: string, quickLabel?: string) => {
    if (!rescheduleTask) return;
    const finalReason = rescheduleNote.trim()
      ? `${rescheduleReasonCategory} — ${rescheduleNote.trim()}`
      : rescheduleReasonCategory;

    await followUpSyncEngine.rescheduleFollowUp(
      token,
      rescheduleTask.id,
      newDateStr,
      newTimeStr,
      finalReason
    );

    showToast(`⏰ Rescheduled to ${quickLabel || `${newDateStr} @ ${newTimeStr}`}`);
    setRescheduleTask(null);
    setRescheduleNote('');
    fetchData();
  };

  // ─── Complete Task Handler ──────────────────────────────────────────────────

  const submitCompleteTask = async () => {
    if (!completeTask) return;
    const nextPayload = scheduleNextAfterComplete
      ? {
          leadId: completeTask.leadId,
          leadName: completeTask.leadName,
          leadCompany: completeTask.leadCompany,
          leadPhone: completeTask.leadPhone,
          leadEmail: completeTask.leadEmail,
          followUpType: nextFollowUpChannel,
          scheduledDate: nextFollowUpDate,
          scheduledTime: nextFollowUpTime,
          purpose: `Next touchpoint following ${selectedOutcome}`,
          notes: outcomeNote || 'Next scheduled follow-up',
        }
      : undefined;

    await followUpSyncEngine.completeFollowUp(
      token,
      completeTask.id,
      selectedOutcome,
      outcomeNote,
      nextPayload
    );

    showToast(`✓ Follow-up marked as Completed!`);
    setCompleteTask(null);
    setOutcomeNote('');
    setScheduleNextAfterComplete(false);
    fetchData();
  };

  // ─── Cancel Task Handler ────────────────────────────────────────────────────

  const submitCancelTask = async () => {
    if (!cancelTask) return;
    const finalReason = cancelNotes.trim()
      ? `${cancelReasonCategory} — ${cancelNotes.trim()}`
      : cancelReasonCategory;

    await followUpSyncEngine.cancelFollowUp(token, cancelTask.id, finalReason);

    showToast(`🚫 Follow-up cancelled`);
    setCancelTask(null);
    setCancelNotes('');
    fetchData();
  };

  // ─── Create New Follow-up Handler ───────────────────────────────────────────

  const handleCreateFollowUp = async () => {
    if (!newLeadSearch.trim()) {
      Alert.alert('Missing Lead', 'Please select or type a prospect name for this follow-up.');
      return;
    }

    const selectedLeadObj = realLeads.find(
      (l) => l.id === newLeadId || l.name?.toLowerCase() === newLeadSearch.toLowerCase()
    );

    let schedDate = newCustomDate;
    let schedTime = newCustomTime;

    const now = new Date();
    if (newDuePreset === 'TODAY_1130') {
      schedDate = now.toISOString().split('T')[0];
      schedTime = '11:30 AM';
    } else if (newDuePreset === 'TODAY_1500') {
      schedDate = now.toISOString().split('T')[0];
      schedTime = '03:00 PM';
    } else if (newDuePreset === 'TOMORROW_1000') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      schedDate = tomorrow.toISOString().split('T')[0];
      schedTime = '10:00 AM';
    } else if (newDuePreset === 'NEXT_WEEK') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      schedDate = nextWeek.toISOString().split('T')[0];
      schedTime = '11:00 AM';
    }

    await followUpSyncEngine.saveAndSyncFollowUp(token, {
      leadId: newLeadId || selectedLeadObj?.id || `lead_${Date.now()}`,
      leadName: selectedLeadObj?.name || newLeadSearch.trim(),
      leadCompany: selectedLeadObj?.company || 'Corporate Client',
      leadPhone: selectedLeadObj?.phone || '+91 98000 00000',
      leadEmail: selectedLeadObj?.email || 'client@example.com',
      followUpType: newChannel,
      scheduledDate: schedDate,
      scheduledTime: schedTime,
      purpose: newPurpose.trim() || `${newChannel === 'MEETING' ? 'Demo Walkthrough' : 'Scheduled Follow-up'} with ${newLeadSearch.trim()}`,
      notes: newPurpose.trim(),
      priority: newPriority,
      assignedRepName: newAssignedRep,
    });

    showToast(`✓ Scheduled ${newChannel} for ${selectedLeadObj?.name || newLeadSearch}`);
    setShowScheduleModal(false);
    setNewLeadSearch('');
    setNewLeadId('');
    setNewPurpose('');
    fetchData();
  };

  // Filtered list for lead search inside modal
  const filteredLeadPicker = useMemo(() => {
    if (!newLeadSearch.trim()) return realLeads.slice(0, 5);
    const q = newLeadSearch.toLowerCase().trim();
    return realLeads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.company?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [realLeads, newLeadSearch]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Toast */}
      {toastMessage && (
        <View style={[styles.toastBanner, { top: Math.max(insets.top + 8, 20) }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: embedded ? 8 : Math.max(insets.top + 4, 16),
            backgroundColor: colors.cardBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {!embedded && Boolean(onClose) && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.btnAction, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.btnActionText, { color: colors.primary }]}>← Dashboard</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1, paddingHorizontal: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {embedded ? '⏱️ Tasks & Follow-ups' : '📞 Follow-ups'}
            </Text>
            <View style={styles.badgeLive}>
              <Text style={styles.badgeLiveText}>Pipeline</Text>
            </View>
          </View>
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
            {isAdminOrManager ? 'Team interaction & callback queue' : 'Your personal daily callback queue'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btnSchedule, { backgroundColor: '#4f46e5' }]}
          onPress={() => setShowScheduleModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnScheduleText}>+ Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={fetchData}
          disabled={isLoading}
          style={[styles.btnAction, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, marginLeft: 4 }]}
          activeOpacity={0.75}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 13 }}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Web-Parity Quick Actions Launcher Bar ────────────────────────────── */}
      <View style={[styles.quickBarContainer, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.btnQuickLaunch, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.35)' }]}
            onPress={() => handleQuickCreatePreset('CALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnQuickLaunchText, { color: '#fbbf24' }]}>📞 + Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnQuickLaunch, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }]}
            onPress={() => handleQuickCreatePreset('WHATSAPP')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnQuickLaunchText, { color: '#34d399' }]}>💬 + WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnQuickLaunch, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.35)' }]}
            onPress={() => handleQuickCreatePreset('MEETING')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnQuickLaunchText, { color: '#38bdf8' }]}>🏢 + Meeting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnQuickLaunch, { backgroundColor: '#4f46e5', borderColor: '#6366f1' }]}
            onPress={() => setShowScheduleModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnQuickLaunchText, { color: '#ffffff' }]}>+ New Follow-up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={fetchData}
            disabled={isLoading}
            style={[styles.btnQuickLaunch, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.btnQuickLaunchText, { color: colors.textMuted }]}>🔄 Live Sync</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 80 }} showsVerticalScrollIndicator={false}>

        {/* ── 4 Live Telemetry Metrics Cards ─────────────────────────────────── */}
        <View style={[styles.metricsGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.metricCardItem, activeTab === 'TODAY' && { backgroundColor: isDark ? '#312e81' : '#e0e7ff' }]}
            onPress={() => setActiveTab('TODAY')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>📅</Text>
            <Text style={[styles.metricVal, { color: colors.primary }]}>{summary.today}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Today Due</Text>
          </TouchableOpacity>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.metricCardItem, activeTab === 'UPCOMING' && { backgroundColor: isDark ? '#312e81' : '#e0e7ff' }]}
            onPress={() => setActiveTab('UPCOMING')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>⏳</Text>
            <Text style={[styles.metricVal, { color: '#38bdf8' }]}>{summary.upcoming}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Upcoming</Text>
          </TouchableOpacity>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.metricCardItem, activeTab === 'OVERDUE' && { backgroundColor: isDark ? '#4c0519' : '#ffe4e6' }]}
            onPress={() => setActiveTab('OVERDUE')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>⚠️</Text>
            <Text style={[styles.metricVal, { color: '#f43f5e' }]}>{summary.overdue}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Overdue</Text>
          </TouchableOpacity>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.metricCardItem, activeTab === 'COMPLETED' && { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}
            onPress={() => setActiveTab('COMPLETED')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>✅</Text>
            <Text style={[styles.metricVal, { color: '#34d399' }]}>{summary.completed}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Done</Text>
          </TouchableOpacity>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.metricCardItem, activeTab === 'ALL' && { backgroundColor: isDark ? '#4c1d95' : '#ede9fe' }]}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>📋</Text>
            <Text style={[styles.metricVal, { color: '#a855f7' }]}>{summary.total}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Total</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search prospect name, company, phone, purpose..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollBarRow} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {[
            { id: 'TODAY' as TabId, label: `📅 Today (${summary.today})` },
            { id: 'UPCOMING' as TabId, label: `⏳ Upcoming (${summary.upcoming})` },
            { id: 'OVERDUE' as TabId, label: `⚠️ Overdue (${summary.overdue})` },
            { id: 'COMPLETED' as TabId, label: `✅ Completed (${summary.completed})` },
            { id: 'ALL' as TabId, label: `📋 All (${summary.total})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabChip,
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  !active && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabChipText, { color: active ? '#ffffff' : colors.textMuted }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Channel Filter Chips (Web Parity) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollBarRow} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {[
            { id: 'ALL' as ChannelFilter, label: '🌐 All Actions' },
            { id: 'CALL' as ChannelFilter, label: '📞 Phone Calls' },
            { id: 'WHATSAPP' as ChannelFilter, label: '💬 WhatsApp' },
            { id: 'EMAIL' as ChannelFilter, label: '✉️ Email' },
            { id: 'MEETING' as ChannelFilter, label: '🏢 Meetings & Demos' },
            { id: 'HIGH_PRIORITY' as ChannelFilter, label: '🔥 High Priority' },
          ].map((ch) => {
            const active = activeChannel === ch.id;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.channelChip,
                  active && { backgroundColor: isDark ? '#312e81' : '#e0e7ff', borderColor: colors.primary },
                  !active && { backgroundColor: colors.cardBg, borderColor: colors.border },
                ]}
                onPress={() => setActiveChannel(ch.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.channelChipText, { color: active ? colors.primary : colors.textMuted }]}>
                  {ch.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Admin / Manager Sales Rep Filter */}
        {isAdminOrManager && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollBarRow} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {[
              { id: 'ALL', label: '👥 All Reps' },
              { id: 'Aditya', label: 'AR · Aditya (Mgr)' },
              { id: 'Sachin', label: 'SP · Sachin (TL)' },
              { id: 'Nandini', label: 'NR · Nandini (Sales)' },
              { id: 'Sulekha', label: 'ST · Sulekha (Sales)' },
              { id: 'Sadhana', label: 'SD · Sadhana (Sales)' },
            ].map((rep) => {
              const active = selectedRepFilter === rep.id;
              return (
                <TouchableOpacity
                  key={rep.id}
                  style={[
                    styles.repChip,
                    active && { backgroundColor: '#7c3aed', borderColor: '#a855f7' },
                    !active && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedRepFilter(rep.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.repChipText, { color: active ? '#ffffff' : colors.textMuted }]}>
                    {rep.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Follow-ups Task Cards List ──────────────────────────────────────── */}
        {filteredTasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>✨</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {activeTab === 'TODAY'
                ? 'No follow-ups left for today!'
                : activeTab === 'UPCOMING'
                ? 'No upcoming follow-ups scheduled.'
                : activeTab === 'OVERDUE'
                ? 'Great job! No overdue tasks.'
                : activeTab === 'COMPLETED'
                ? 'No completed follow-ups yet.'
                : 'No follow-ups found.'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Tap '+ Schedule' above to queue new follow-ups or callbacks for your leads.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {filteredTasks.map((task) => {
              const dueDate = new Date(task.dueAt);
              const nowMs = Date.now();
              // Transitions to OVERDUE only after 2 minutes have crossed
              const isPastDue = !task.isCompleted && !isNaN(dueDate.getTime()) && nowMs > dueDate.getTime() + 2 * 60 * 1000;
              const timeStr = !isNaN(dueDate.getTime()) ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (task.scheduledTime || '10:30 AM');
              const dateStr = !isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : (task.scheduledDate || 'Scheduled');

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    {
                      backgroundColor: task.isCompleted ? (isDark ? 'rgba(6,78,59,0.15)' : 'rgba(220,252,231,0.5)') : colors.cardBg,
                      borderColor: task.isCompleted ? 'rgba(16,185,129,0.3)' : (isPastDue ? '#f43f5e' : colors.border),
                      borderLeftWidth: isPastDue ? 4 : 1,
                      borderLeftColor: isPastDue ? '#f43f5e' : colors.border,
                      opacity: task.isCompleted ? 0.8 : 1,
                    },
                  ]}
                >
                  {/* Top Row: Prospect Info + Channel Badge + Due Date */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <TouchableOpacity
                        onPress={() => handleOpenLead(task.leadId, task.leadName)}
                        activeOpacity={0.75}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                        <Text style={[styles.prospectName, { color: colors.text }]} numberOfLines={1}>
                          {task.leadName}
                        </Text>
                        <View style={styles.openLeadBadge}>
                          <Text style={styles.openLeadBadgeText}>Open ↗</Text>
                        </View>
                      </TouchableOpacity>
                      <Text style={[styles.prospectCompany, { color: colors.textMuted }]} numberOfLines={1}>
                        {task.leadCompany} {task.leadPhone ? `• ${task.leadPhone}` : ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {/* Channel Badge */}
                      <View
                        style={[
                          styles.channelBadge,
                          task.channel === 'CALL' && { backgroundColor: 'rgba(14,165,233,0.15)', borderColor: 'rgba(14,165,233,0.35)' },
                          task.channel === 'WHATSAPP' && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' },
                          task.channel === 'EMAIL' && { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' },
                          task.channel === 'MEETING' && { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.35)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.channelBadgeText,
                            task.channel === 'CALL' && { color: '#38bdf8' },
                            task.channel === 'WHATSAPP' && { color: '#34d399' },
                            task.channel === 'EMAIL' && { color: '#fbbf24' },
                            task.channel === 'MEETING' && { color: '#c084fc' },
                          ]}
                        >
                          {task.channel === 'CALL'
                            ? '📞 CALL'
                            : task.channel === 'WHATSAPP'
                            ? '💬 WHATSAPP'
                            : task.channel === 'EMAIL'
                            ? '✉️ EMAIL'
                            : '🏢 MEETING'}
                        </Text>
                      </View>

                      {/* Due Time */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {isPastDue && (
                          <View style={styles.overdueBadge}>
                            <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                          </View>
                        )}
                        <Text style={[styles.dueTimeText, { color: isPastDue ? '#f43f5e' : colors.textMuted }]}>
                          {dateStr} • {timeStr}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Purpose / Agenda Note */}
                  <Text style={[styles.purposeText, { color: colors.text }]}>{task.purpose}</Text>

                  {/* Assigned Rep & Priority Pills */}
                  <View style={styles.repPriorityRow}>
                    <View style={styles.repBadge}>
                      <Text style={styles.repBadgeText}>👤 {task.assignedRepName}</Text>
                    </View>
                    <View style={[styles.priorityBadge, task.priority === 'HIGH' ? { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)' } : { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                      <Text style={[styles.priorityBadgeText, { color: task.priority === 'HIGH' ? '#f43f5e' : '#818cf8' }]}>
                        {task.priority === 'HIGH' ? '⚡ High Priority' : 'Normal'}
                      </Text>
                    </View>
                  </View>

                  {/* Completed Outcome Note if resolved */}
                  {task.isCompleted && (
                    <View style={styles.completedBox}>
                      <Text style={styles.completedBoxText}>
                        ✅ {task.outcomeNote || 'Completed'}
                      </Text>
                    </View>
                  )}

                  {/* ── Action Buttons Row ─────────────────────────────────── */}
                  {!task.isCompleted && (
                    <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                      {/* Call */}
                      {Boolean(task.leadPhone) && (
                        <TouchableOpacity
                          style={[styles.btnActionCall, { backgroundColor: '#059669' }]}
                          onPress={() => handleCall(task.leadPhone)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnActionTextWhite}>📞 Call</Text>
                        </TouchableOpacity>
                      )}

                      {/* WhatsApp */}
                      {Boolean(task.leadPhone) && (
                        <TouchableOpacity
                          style={[styles.btnActionWA, { backgroundColor: '#16a34a' }]}
                          onPress={() => handleWhatsApp(task.leadPhone, task.leadName)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnActionTextWhite}>💬 WhatsApp</Text>
                        </TouchableOpacity>
                      )}

                      {/* Reschedule / Later */}
                      <TouchableOpacity
                        style={[styles.btnActionOutline, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                        onPress={() => {
                          setRescheduleTask(task);
                          setRescheduleNote('');
                          setRescheduleDate(task.dueAt ? task.dueAt.slice(0, 10) : new Date().toISOString().split('T')[0]);
                          setRescheduleTime('10:30 AM');
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.btnActionTextOutline, { color: colors.text }]}>⏰ Later</Text>
                      </TouchableOpacity>

                      {/* Done / Complete */}
                      <TouchableOpacity
                        style={[styles.btnActionDone, { backgroundColor: '#4f46e5' }]}
                        onPress={() => {
                          setCompleteTask(task);
                          setOutcomeNote('');
                          setSelectedOutcome('Connected & Interested');
                          setScheduleNextAfterComplete(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.btnActionTextWhite}>✓ Done</Text>
                      </TouchableOpacity>

                      {/* Cancel */}
                      <TouchableOpacity
                        style={[styles.btnActionCancel, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                        onPress={() => {
                          setCancelTask(task);
                          setCancelNotes('');
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: '800' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ─── Modal 1: Schedule New Follow-up / Task ───────────────────────────── */}
      <Modal visible={showScheduleModal} transparent animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>+ Schedule New Follow-up</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {/* Prospect / Lead Search */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PROSPECT / LEAD NAME *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                placeholder="Type or search lead..."
                placeholderTextColor={colors.textMuted}
                value={newLeadSearch}
                onChangeText={(txt) => {
                  setNewLeadSearch(txt);
                  setNewLeadId('');
                }}
              />

              {/* Lead Quick Suggestions */}
              {newLeadSearch.length > 0 && !newLeadId && (
                <View style={[styles.leadPickerDropdown, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                  {filteredLeadPicker.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.leadPickerItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setNewLeadId(l.id);
                        setNewLeadSearch(l.name);
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{l.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>{l.company || 'Corporate'} • {l.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Activity Channel */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>ACTIVITY CHANNEL</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { id: 'CALL' as ChannelType, label: '📞 Call' },
                  { id: 'WHATSAPP' as ChannelType, label: '💬 WhatsApp' },
                  { id: 'EMAIL' as ChannelType, label: '✉️ Email' },
                  { id: 'MEETING' as ChannelType, label: '🏢 Meeting' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.channelSelectBtn,
                      newChannel === item.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                      newChannel !== item.id && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                    ]}
                    onPress={() => setNewChannel(item.id)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: newChannel === item.id ? '#ffffff' : colors.textMuted }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Presets */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>SCHEDULED DATE &amp; TIME</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'TODAY_1130' as const, label: 'Today 11:30 AM' },
                  { id: 'TODAY_1500' as const, label: 'Today 3:00 PM' },
                  { id: 'TOMORROW_1000' as const, label: 'Tomorrow 10:00 AM' },
                  { id: 'NEXT_WEEK' as const, label: 'Next Week' },
                  { id: 'CUSTOM' as const, label: 'Custom' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.timePresetBtn,
                      newDuePreset === preset.id && { backgroundColor: '#7c3aed', borderColor: '#a855f7' },
                      newDuePreset !== preset.id && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                    ]}
                    onPress={() => setNewDuePreset(preset.id)}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: newDuePreset === preset.id ? '#ffffff' : colors.textMuted }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newDuePreset === 'CUSTOM' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 2 }}>Date (YYYY-MM-DD):</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                      value={newCustomDate}
                      onChangeText={setNewCustomDate}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 2 }}>Time:</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                      value={newCustomTime}
                      onChangeText={setNewCustomTime}
                    />
                  </View>
                </View>
              )}

              {/* Purpose / Agenda */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>AGENDA / PURPOSE NOTE</Text>
              <TextInput
                style={[styles.formInput, { height: 64, color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                placeholder="E.g. Review GST quotation and close annual subscription..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={newPurpose}
                onChangeText={setNewPurpose}
              />

              {/* Assigned Representative */}
              {isAdminOrManager && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>ASSIGN TO REPRESENTATIVE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {['Admin', 'Aditya Kumar Rai', 'Sachin Puri', 'Nandini Rastogi', 'Sulekha Tomar'].map((rep) => (
                      <TouchableOpacity
                        key={rep}
                        style={[
                          styles.repAssignBtn,
                          newAssignedRep === rep && { backgroundColor: colors.primary, borderColor: colors.primary },
                          newAssignedRep !== rep && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                        ]}
                        onPress={() => setNewAssignedRep(rep)}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: newAssignedRep === rep ? '#ffffff' : colors.textMuted }}>
                          {rep}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.btnSubmitCreate, { backgroundColor: '#4f46e5', marginTop: 14 }]}
                onPress={handleCreateFollowUp}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSubmitCreateText}>✓ Confirm &amp; Schedule Follow-up</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 2: Reschedule Follow-up ─────────────────────────────────────── */}
      <Modal visible={rescheduleTask !== null} transparent animationType="fade" onRequestClose={() => setRescheduleTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>⏰ Postpone / Reschedule</Text>
              <TouchableOpacity onPress={() => setRescheduleTask(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
              Postpone callback for <Text style={{ fontWeight: '800', color: colors.text }}>{rescheduleTask?.leadName}</Text>:
            </Text>

            {/* Quick Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {[
                { label: '+1 Hour Later', getTarget: () => { const d = new Date(Date.now() + 60*60*1000); return { date: d.toISOString().split('T')[0], time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; } },
                { label: '+3 Hours Later', getTarget: () => { const d = new Date(Date.now() + 3*60*60*1000); return { date: d.toISOString().split('T')[0], time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; } },
                { label: 'Tomorrow 10 AM', getTarget: () => { const d = new Date(); d.setDate(d.getDate() + 1); return { date: d.toISOString().split('T')[0], time: '10:00 AM' }; } },
                { label: 'Next Monday', getTarget: () => { const d = new Date(); d.setDate(d.getDate() + 7); return { date: d.toISOString().split('T')[0], time: '11:00 AM' }; } },
              ].map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.reschedulePresetBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                  onPress={() => {
                    const t = p.getTarget();
                    submitReschedule(t.date, t.time, p.label);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.reschedulePresetText, { color: colors.primary }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Date & Time Inputs */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 2 }}>New Date:</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                  value={rescheduleDate}
                  onChangeText={setRescheduleDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 2 }}>New Time:</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated }]}
                  value={rescheduleTime}
                  onChangeText={setRescheduleTime}
                />
              </View>
            </View>

            {/* Reason Category */}
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 4 }}>Reason for Reschedule:</Text>
            <View style={{ gap: 4, marginBottom: 8 }}>
              {[
                'Client requested different time',
                'Prospect travelling / busy',
                'Need more preparation / custom proposal',
                'Other custom reason',
              ].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: rescheduleReasonCategory === cat ? (isDark ? '#312e81' : '#e0e7ff') : colors.cardBgElevated,
                    borderWidth: 1,
                    borderColor: rescheduleReasonCategory === cat ? '#818cf8' : colors.border,
                  }}
                  onPress={() => setRescheduleReasonCategory(cat)}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: rescheduleReasonCategory === cat ? colors.primary : colors.text }}>
                    {rescheduleReasonCategory === cat ? '✓ ' : '○ '}{cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.formInput, { height: 46, color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated, marginBottom: 12 }]}
              placeholder="Additional explanation notes..."
              placeholderTextColor={colors.textMuted}
              value={rescheduleNote}
              onChangeText={setRescheduleNote}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.btnSubmitCreate, { flex: 1, backgroundColor: colors.cardBgElevated, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setRescheduleTask(null)}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmitCreate, { flex: 2, backgroundColor: '#4f46e5' }]}
                onPress={() => submitReschedule(rescheduleDate, rescheduleTime)}
              >
                <Text style={[styles.btnSubmitCreateText, { textAlign: 'center' }]}>Confirm Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 3: Complete & Log Outcome ──────────────────────────────────── */}
      <Modal visible={completeTask !== null} transparent animationType="fade" onRequestClose={() => setCompleteTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>✅ Complete &amp; Log Outcome</Text>
              <TouchableOpacity onPress={() => setCompleteTask(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
              Resolution outcome for <Text style={{ fontWeight: '800', color: colors.text }}>{completeTask?.leadName}</Text>:
            </Text>

            {/* Outcome choices */}
            <View style={{ gap: 4, marginBottom: 10 }}>
              {[
                'Connected & Interested',
                'Demo / Meeting Scheduled',
                'Quotation / Proposal Sent',
                'Busy / Callback Requested',
                'Deal Won & Finalized',
                'Not Interested / Closed Lost',
              ].map((out) => {
                const selected = selectedOutcome === out;
                return (
                  <TouchableOpacity
                    key={out}
                    style={[
                      styles.outcomeOption,
                      selected && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' },
                      !selected && { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                    ]}
                    onPress={() => setSelectedOutcome(out)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: selected ? '#34d399' : colors.text }}>
                      {selected ? '✓ ' : '○ '}{out}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.formInput, { height: 46, color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated, marginBottom: 10 }]}
              placeholder="Enter outcome notes..."
              placeholderTextColor={colors.textMuted}
              value={outcomeNote}
              onChangeText={setOutcomeNote}
            />

            {/* Schedule Next Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setScheduleNextAfterComplete(!scheduleNextAfterComplete)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, { borderColor: colors.primary, backgroundColor: scheduleNextAfterComplete ? colors.primary : 'transparent' }]}>
                {scheduleNextAfterComplete && <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                Chain Next Follow-up immediately
              </Text>
            </TouchableOpacity>

            {scheduleNextAfterComplete && (
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textMuted }}>Next Date:</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated, height: 38 }]}
                    value={nextFollowUpDate}
                    onChangeText={setNextFollowUpDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textMuted }}>Next Time:</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated, height: 38 }]}
                    value={nextFollowUpTime}
                    onChangeText={setNextFollowUpTime}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnSubmitCreate, { backgroundColor: '#10b981', marginTop: 10 }]}
              onPress={submitCompleteTask}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSubmitCreateText}>✓ Save &amp; Resolve Follow-up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Modal 4: Cancel Follow-up ────────────────────────────────────────── */}
      <Modal visible={cancelTask !== null} transparent animationType="fade" onRequestClose={() => setCancelTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: '#f43f5e' }]}>🚫 Cancel Follow-up</Text>
              <TouchableOpacity onPress={() => setCancelTask(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
              Cancel follow-up for <Text style={{ fontWeight: '800', color: colors.text }}>{cancelTask?.leadName}</Text>:
            </Text>

            <View style={{ gap: 4, marginBottom: 8 }}>
              {[
                'Client Cancelled / Postponed Indefinitely',
                'Wrong Number / Unqualified Lead',
                'Duplicate Follow-up Entry',
                'Other Custom Reason',
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: cancelReasonCategory === reason ? (isDark ? '#4c0519' : '#ffe4e6') : colors.cardBgElevated,
                    borderWidth: 1,
                    borderColor: cancelReasonCategory === reason ? '#f43f5e' : colors.border,
                  }}
                  onPress={() => setCancelReasonCategory(reason)}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: cancelReasonCategory === reason ? '#f43f5e' : colors.text }}>
                    {cancelReasonCategory === reason ? '✓ ' : '○ '}{reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.formInput, { height: 46, color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBgElevated, marginBottom: 12 }]}
              placeholder="Cancellation notes / context..."
              placeholderTextColor={colors.textMuted}
              value={cancelNotes}
              onChangeText={setCancelNotes}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.btnSubmitCreate, { flex: 1, backgroundColor: colors.cardBgElevated, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setCancelTask(null)}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' }}>Keep Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmitCreate, { flex: 2, backgroundColor: '#f43f5e' }]}
                onPress={submitCancelTask}
              >
                <Text style={[styles.btnSubmitCreateText, { textAlign: 'center' }]}>Confirm Cancellation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Toast
  toastBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: { color: '#ffffff', fontSize: 12, fontWeight: '800', textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 10, marginTop: 1 },
  badgeLive: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  badgeLiveText: { fontSize: 8, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase' },
  btnAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionText: { fontSize: 11, fontWeight: '800' },
  btnSchedule: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnScheduleText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricCardItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  metricDivider: { width: 1, height: '70%' },
  metricVal: { fontSize: 18, fontWeight: '900' },
  metricLbl: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 },

  // Quick Launch Bar (Web Parity)
  quickBarContainer: {
    borderBottomWidth: 1,
  },
  btnQuickLaunch: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnQuickLaunchText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 12, padding: 0 },

  // Scroll Row Chips
  scrollBarRow: { marginBottom: 8 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabChipText: { fontSize: 11, fontWeight: '800' },
  channelChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  channelChipText: { fontSize: 10, fontWeight: '800' },
  repChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  repChipText: { fontSize: 10, fontWeight: '800' },

  // Task Cards
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  emptyDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  taskCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prospectName: { fontSize: 13, fontWeight: '900' },
  openLeadBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  openLeadBadgeText: { fontSize: 9, fontWeight: '800', color: '#818cf8' },
  prospectCompany: { fontSize: 10, marginTop: 1 },
  channelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  channelBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  overdueBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  overdueBadgeText: { fontSize: 8, fontWeight: '900', color: '#f43f5e' },
  dueTimeText: { fontSize: 10, fontWeight: '700' },
  purposeText: { fontSize: 11, lineHeight: 16 },
  repPriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repBadge: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repBadgeText: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityBadgeText: { fontSize: 9, fontWeight: '800' },
  completedBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    padding: 8,
    borderRadius: 8,
  },
  completedBoxText: { fontSize: 10, color: '#10b981', fontWeight: '800' },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  btnActionCall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionWA: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionOutline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionDone: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionCancel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionTextWhite: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  btnActionTextOutline: { fontSize: 11, fontWeight: '800' },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 14, fontWeight: '900' },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 11,
  },
  leadPickerDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  leadPickerItem: {
    padding: 8,
    borderBottomWidth: 1,
  },
  channelSelectBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timePresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  repAssignBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnSubmitCreate: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitCreateText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  // Reschedule Modal
  reschedulePresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  reschedulePresetText: { fontSize: 10, fontWeight: '800' },

  // Complete Modal
  outcomeOption: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FollowUpsScreen;
