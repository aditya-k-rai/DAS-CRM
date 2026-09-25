/**
 * NotificationsScreen.tsx — DAS CRM Android
 * Dedicated Notifications & Real-Time Task Alert Center.
 * Features:
 * 1. 5-Minute Prior Automated Task & Call Reminders.
 * 2. Detailed Notification Inspector with Full Lead Metadata.
 * 3. Direct Route Navigation to Lead Details, Deals Kanban, or Attendance Portal.
 * 4. Action Launchers: Direct Call & Direct WhatsApp.
 */

import React, { useState, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { callSyncEngine } from '../services/callSyncEngine';
import { useTheme } from '../context/ThemeContext';

export interface DetailedNotification {
  id: string;
  title: string;
  message: string;
  timeStr: string;
  exactTime: string;
  type: 'TASK_5MIN_ALERT' | 'CALL_REMINDER' | 'LEAD_ASSIGNED' | 'SYSTEM' | 'DEAL_UPDATE';
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  isRead: boolean;
  leadId?: string;
  leadName?: string;
  company?: string;
  phone?: string;
  email?: string;
  value?: string;
  meetingPurpose?: string;
  routeTarget: 'LeadDetail' | 'Leads' | 'Attendance' | 'Deals' | 'Tasks' | 'Employees' | 'Products';
}

export function getRoleNotifications(_roleStr: string): DetailedNotification[] {
  return [];
}

export const INITIAL_DETAILED_NOTIFICATIONS: DetailedNotification[] = getRoleNotifications('ADMIN');

interface NotificationsScreenProps {
  navigation?: any;
  onClose?: () => void;
  onNavigateToLead?: (leadId: string, leadName: string) => void;
  onNavigateToRoute?: (routeName: string) => void;
  onUnreadCountChange?: (unreadCount: number) => void;
}

export default function NotificationsScreen({
  navigation: propNavigation,
  onClose,
  onNavigateToLead,
  onNavigateToRoute,
  onUnreadCountChange,
}: NotificationsScreenProps) {
  let navFromHook = null;
  try {
    navFromHook = useNavigation<any>();
  } catch (e) {
    // Rendered outside navigation context or in modal
  }
  const navigation = propNavigation || navFromHook;
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { currentUser } = useAuthStore();
  const userRole = currentUser?.role || 'SALES_EXEC';

  const [notifications, setNotifications] = useState<DetailedNotification[]>(() =>
    getRoleNotifications(userRole)
  );
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'TASK_ALERTS' | 'LEADS'>('ALL');
  const [selectedNotif, setSelectedNotif] = useState<DetailedNotification | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'TASK_ALERTS') return n.type === 'TASK_5MIN_ALERT' || n.type === 'CALL_REMINDER';
    if (activeFilter === 'LEADS') return n.type === 'LEAD_ASSIGNED';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      if (onUnreadCountChange) onUnreadCountChange(0);
      return next;
    });
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      const count = next.filter((n) => !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(count);
      return next;
    });
  };

  const handleRouteToTarget = (notif: DetailedNotification) => {
    handleMarkSingleRead(notif.id);
    setSelectedNotif(null);
    if (onClose) onClose();

    if (notif.routeTarget === 'LeadDetail' && notif.leadId) {
      if (onNavigateToLead) {
        onNavigateToLead(notif.leadId, notif.leadName || 'Lead File');
      } else {
        try {
          navigation.navigate('Leads', {
            screen: 'LeadDetail',
            params: { leadId: notif.leadId, leadName: notif.leadName },
          });
        } catch {
          navigation.navigate('Leads');
        }
      }
    } else if (notif.routeTarget === 'Attendance') {
      if (onNavigateToRoute) onNavigateToRoute('Attendance');
      else navigation.navigate('Attendance');
    } else if (notif.routeTarget === 'Employees') {
      if (onNavigateToRoute) onNavigateToRoute('Employees');
      else navigation.navigate('Employees');
    } else if (notif.routeTarget === 'Leads') {
      if (onNavigateToRoute) onNavigateToRoute('Leads');
      else navigation.navigate('Leads');
    } else if (notif.routeTarget === 'Products') {
      if (onNavigateToRoute) onNavigateToRoute('Menu');
      else navigation.navigate('Menu');
    } else {
      if (onNavigateToRoute) onNavigateToRoute('Menu');
      else navigation.navigate('Menu');
    }
  };

  const handleCallDirect = (phone?: string, name?: string, leadId?: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/[^\d+]/g, '');
    Linking.openURL('tel:' + cleaned).catch(() => {
      Alert.alert('Direct Dialing', `Dialing ${cleaned} for ${name}...`);
    });
    if (leadId && name) {
      callSyncEngine.initiateCall(leadId, name, phone);
    }
  };

  const handleWhatsAppDirect = (phone?: string, name?: string) => {
    if (!phone) return;
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    const waUrl = `whatsapp://send?phone=${cleaned}&text=Hi%20${encodeURIComponent(name || 'Client')},%20following%20up%20regarding%20our%20scheduled%20task/meeting%20from%20DAS%20CRM.`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp Launch', `Opening WhatsApp for ${name}...`);
    });
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 20 }]} showsVerticalScrollIndicator={false}>

        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.screenTitle}>🔔 Notifications &amp; Alerts</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountBadgeText}>{unreadCount} New</Text>
                </View>
              )}
            </View>
            <Text style={styles.screenSub}>5-Minute Prior Automated Task &amp; Call Reminders</Text>
          </View>

          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>✕ Close</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5-Min Prior Automated Notification Banner */}
        <View style={styles.alertBanner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.alertBannerTitle}>⏰ 5-Minute Prior Reminder Engine Active</Text>
            <View style={styles.liveTag}><Text style={styles.liveTagText}>ACTIVE</Text></View>
          </View>
          <Text style={styles.alertBannerSub}>
            Meetings and tasks scheduled on your dashboard will notify you 5 minutes earlier with direct call &amp; lead navigation shortcuts.
          </Text>
        </View>

        {/* Filter Bar & Mark All Read */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {[
              { key: 'ALL', label: `All (${notifications.length})` },
              { key: 'UNREAD', label: `🟢 Unread (${unreadCount})` },
              { key: 'TASK_ALERTS', label: '⏰ 5-Min Task Alerts' },
              { key: 'LEADS', label: '🎯 Lead Alerts' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key as any)}
              >
                <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markAllBtnText}>✓ Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Cards List */}
        <View style={{ width: '100%', maxWidth: 600, marginTop: 8 }}>
          {filteredNotifs.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              onPress={() => setSelectedNotif(item)}
              activeOpacity={0.85}
            >
              {/* Card Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadGlowDot} />}
                </View>
                <View style={[styles.timeBadge, item.type === 'TASK_5MIN_ALERT' && styles.timeBadgeHigh]}>
                  <Text style={[styles.timeBadgeText, item.type === 'TASK_5MIN_ALERT' && { color: '#facc15' }]}>
                    ⏰ {item.timeStr}
                  </Text>
                </View>
              </View>

              {/* Message Body */}
              <Text style={styles.notifMsg}>{item.message}</Text>

              {/* Lead Context Metadata Bar */}
              {item.leadName && (
                <View style={styles.leadContextBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                      👤 {item.leadName} {item.company ? `(${item.company})` : ''}
                    </Text>
                    {item.meetingPurpose && (
                      <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 1 }}>
                        💼 {item.meetingPurpose}
                      </Text>
                    )}
                  </View>
                  {item.value && (
                    <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>{item.value}</Text>
                  )}
                </View>
              )}

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.routeActionBtn}
                  onPress={() => handleRouteToTarget(item)}
                >
                  <Text style={styles.routeActionBtnText}>
                    ⚡ Route to {item.routeTarget === 'LeadDetail' ? 'Lead File' : item.routeTarget} →
                  </Text>
                </TouchableOpacity>

                {item.phone && (
                  <TouchableOpacity
                    style={styles.callActionBtn}
                    onPress={() => handleCallDirect(item.phone, item.leadName, item.leadId)}
                  >
                    <Text style={styles.callActionBtnText}>📞 Call Direct</Text>
                  </TouchableOpacity>
                )}

                {!item.isRead && (
                  <TouchableOpacity
                    style={styles.readActionBtn}
                    onPress={() => handleMarkSingleRead(item.id)}
                  >
                    <Text style={styles.readActionBtnText}>✓ Mark Read</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 DETAILED NOTIFICATION READER & ROUTING MODAL                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!selectedNotif} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {selectedNotif && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedNotif.title}</Text>
                  <Text style={styles.modalSub}>Timestamp: {selectedNotif.exactTime} • Priority: {selectedNotif.priority}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedNotif(null)} style={styles.modalCloseBtn}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>

                {/* 5-Min Countdown Alert Notice */}
                {selectedNotif.type === 'TASK_5MIN_ALERT' && (
                  <View style={styles.modalAlertNotice}>
                    <Text style={styles.modalAlertNoticeTitle}>⏰ 5-MINUTE EARLY TASK COUNTDOWN</Text>
                    <Text style={styles.modalAlertNoticeSub}>
                      This alert triggered 5 minutes prior to the scheduled start time ({selectedNotif.exactTime}).
                    </Text>
                  </View>
                )}

                <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18, marginBottom: 12 }}>
                  {selectedNotif.message}
                </Text>

                {/* Lead Profile Metadata */}
                {selectedNotif.leadName && (
                  <View style={styles.modalLeadCard}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5' }}>🎯 Lead &amp; Task Context:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{selectedNotif.leadName}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>{selectedNotif.value || ''}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{selectedNotif.company} • {selectedNotif.phone}</Text>

                    {selectedNotif.meetingPurpose && (
                      <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>
                          💼 Purpose: {selectedNotif.meetingPurpose}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Direct Action Launchers */}
                {selectedNotif.phone && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleCallDirect(selectedNotif.phone, selectedNotif.leadName, selectedNotif.leadId)}
                    >
                      <Text style={styles.modalActionBtnText}>📞 Call Direct</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                      onPress={() => handleWhatsAppDirect(selectedNotif.phone, selectedNotif.leadName)}
                    >
                      <Text style={styles.modalActionBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Main Routing Button */}
                <TouchableOpacity
                  style={styles.mainRouteBtn}
                  onPress={() => handleRouteToTarget(selectedNotif)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainRouteBtnText}>
                    🚀 Navigate Directly to {selectedNotif.routeTarget === 'LeadDetail' ? 'Lead File' : selectedNotif.routeTarget} →
                  </Text>
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, alignItems: 'center', paddingBottom: 32 },

  headerRow: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  screenSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  unreadCountBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  unreadCountBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  closeBtn: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },

  alertBanner: { width: '100%', maxWidth: 600, backgroundColor: isDark ? 'rgba(234,179,8,0.12)' : '#fef9c3', borderWidth: 1, borderColor: isDark ? '#eab308' : '#f59e0b', borderRadius: 14, padding: 12, marginBottom: 12 },
  alertBannerTitle: { fontSize: 12, fontWeight: '900', color: isDark ? '#facc15' : '#92400e' },
  alertBannerSub: { fontSize: 10, color: isDark ? '#fef08a' : '#78350f', marginTop: 3, lineHeight: 14 },
  liveTag: { backgroundColor: isDark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.15)', borderWidth: 1, borderColor: isDark ? '#eab308' : '#f59e0b', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  liveTagText: { color: isDark ? '#facc15' : '#92400e', fontSize: 8, fontWeight: '900' },

  filterContainer: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  filterChipActive: { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', borderColor: '#818cf8' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  filterChipTextActive: { color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '900' },

  markAllBtn: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  markAllBtnText: { color: isDark ? '#818cf8' : '#4f46e5', fontSize: 9, fontWeight: '800' },

  notifCard: { backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  notifCardUnread: { borderColor: '#818cf8', backgroundColor: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.05)' },
  notifTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  unreadGlowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#818cf8' },
  timeBadge: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  timeBadgeHigh: { backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : '#fef3c7', borderColor: isDark ? '#eab308' : '#d97706' },
  timeBadgeText: { fontSize: 9, fontWeight: '800', color: colors.textSecondary },

  notifMsg: { fontSize: 11, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  leadContextBox: { marginTop: 8, backgroundColor: colors.cardBgElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  cardActionsRow: { flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' },
  routeActionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  routeActionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  callActionBtn: { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.25)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  callActionBtnText: { color: isDark ? '#34d399' : '#059669', fontSize: 10, fontWeight: '800' },
  readActionBtn: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginLeft: 'auto', borderWidth: 1, borderColor: colors.border },
  readActionBtnText: { color: colors.textSecondary, fontSize: 9, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: colors.cardBg, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  modalSub: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.cardBgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },

  modalAlertNotice: { backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : '#fef3c7', borderWidth: 1, borderColor: isDark ? '#eab308' : '#d97706', borderRadius: 10, padding: 8, marginBottom: 10 },
  modalAlertNoticeTitle: { fontSize: 10, fontWeight: '900', color: isDark ? '#facc15' : '#92400e' },
  modalAlertNoticeSub: { fontSize: 9, color: isDark ? '#fef08a' : '#78350f', marginTop: 1 },

  modalLeadCard: { backgroundColor: colors.cardBgElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10 },
  modalActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modalActionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  mainRouteBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  mainRouteBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
