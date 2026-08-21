/**
 * NotificationsScreen.tsx — DAS CRM Android
 * Dedicated Notifications & Real-Time Task Alert Center.
 * Features:
 * 1. 5-Minute Prior Automated Task & Call Reminders.
 * 2. Detailed Notification Inspector with Full Lead Metadata.
 * 3. Direct Route Navigation to Lead Details, Deals Kanban, or Attendance Portal.
 * 4. Action Launchers: Direct Call & Direct WhatsApp.
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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { callSyncEngine } from '../services/callSyncEngine';

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

export function getRoleNotifications(roleStr: string): DetailedNotification[] {
  const normRole = (roleStr || '').toUpperCase();
  if (normRole.includes('ADMIN')) {
    return [
      {
        id: 'notif-admin-1',
        title: '👑 Tenant Executive Command Summary',
        message: 'Active subscription plan: FREE_TRIAL. 3,420 multi-source leads ingested across Google Sheets, CSV, and Meta Webhooks.',
        timeStr: 'Today',
        exactTime: '08:00 AM',
        type: 'SYSTEM',
        priority: 'HIGH',
        isRead: false,
        routeTarget: 'Leads',
      },
      {
        id: 'notif-admin-2',
        title: '💼 High-Value Enterprise Lead Allocated',
        message: 'High-value deal Rajesh Mehta (TechCorp Solutions, ₹5,20,000) successfully allocated down hierarchy to Manager A.',
        timeStr: 'In 5 Mins',
        exactTime: '02:25 PM',
        type: 'TASK_5MIN_ALERT',
        priority: 'HIGH',
        isRead: false,
        leadId: 'lead-1',
        leadName: 'Rajesh Mehta',
        company: 'TechCorp Solutions Ltd',
        phone: '+91 98765 43210',
        email: 'rajesh@techcorp.com',
        value: '₹5,20,000',
        meetingPurpose: 'Enterprise CRM Suite Demo & Technical Review',
        routeTarget: 'LeadDetail',
      },
      {
        id: 'notif-admin-3',
        title: '👥 Workforce Attendance Audit Complete',
        message: '19 Present / 24 Staff today (79.2% attendance rate). 3 on leave, 2 absent.',
        timeStr: '1 Hour ago',
        exactTime: '09:21 AM',
        type: 'SYSTEM',
        priority: 'NORMAL',
        isRead: false,
        routeTarget: 'Attendance',
      },
      {
        id: 'notif-admin-4',
        title: '🔒 Role Assignment Hierarchy Enforced',
        message: 'Supervisor delegation rules verified. All sales execs mapped under TLs/Managers only.',
        timeStr: '2 Hours ago',
        exactTime: '08:30 AM',
        type: 'SYSTEM',
        priority: 'NORMAL',
        isRead: true,
        routeTarget: 'Employees',
      },
    ];
  }

  if (normRole.includes('MANAGER')) {
    return [
      {
        id: 'notif-mgr-1',
        title: '📊 Manager Team Performance Audit',
        message: 'Team Leader Priya Sharma completed 184 calls & closed ₹9,40,000 revenue today (85% target achievement).',
        timeStr: 'Today',
        exactTime: '01:15 PM',
        type: 'DEAL_UPDATE',
        priority: 'HIGH',
        isRead: false,
        routeTarget: 'Employees',
      },
      {
        id: 'notif-mgr-2',
        title: '🔄 Lead Allocation Handover Request',
        message: 'TL Priya Sharma requested lead handover for Sunita Logistics Pvt Ltd (₹8,90,000).',
        timeStr: '20 Mins ago',
        exactTime: '01:30 PM',
        type: 'LEAD_ASSIGNED',
        priority: 'HIGH',
        isRead: false,
        leadId: 'lead-3',
        leadName: 'Sunita Kapoor',
        company: 'Sunita Logistics Pvt Ltd',
        phone: '+91 97222 33344',
        email: 'sunita@sunitalogistics.com',
        value: '₹8,90,000',
        meetingPurpose: 'Executive Contract Signing & License Rollout',
        routeTarget: 'LeadDetail',
      },
      {
        id: 'notif-mgr-3',
        title: '⏰ 5-Min Prior Demo Review Alert',
        message: 'Scheduled direct call with Priya Sharma (LogiTech Systems) starts in 5 minutes (04:45 PM).',
        timeStr: 'In 5 Mins',
        exactTime: '04:40 PM',
        type: 'CALL_REMINDER',
        priority: 'HIGH',
        isRead: false,
        leadId: 'lead-2',
        leadName: 'Priya Sharma',
        company: 'LogiTech Freight Systems',
        phone: '+91 98123 45678',
        email: 'priya@logitech.com',
        value: '₹3,50,000',
        meetingPurpose: 'WhatsApp Automation Bot Setup Review',
        routeTarget: 'LeadDetail',
      },
      {
        id: 'notif-mgr-4',
        title: '⏱️ Staff Attendance Summary Logged',
        message: '2 Team Leaders & 14 Sales Reps checked in today with geofence verification.',
        timeStr: '3 Hours ago',
        exactTime: '09:15 AM',
        type: 'SYSTEM',
        priority: 'NORMAL',
        isRead: true,
        routeTarget: 'Attendance',
      },
    ];
  }

  if (normRole.includes('HR')) {
    return [
      {
        id: 'notif-hr-1',
        title: '📋 3 Staff Leave Requests Pending',
        message: 'Rajesh Kumar (Sales Exec) submitted Sick Leave application for approval.',
        timeStr: 'Today',
        exactTime: '10:30 AM',
        type: 'SYSTEM',
        priority: 'HIGH',
        isRead: false,
        routeTarget: 'Attendance',
      },
      {
        id: 'notif-hr-2',
        title: '⏱️ Late Attendance Punch Alert',
        message: 'Priya Sharma punched in late at 10:14 AM (Geofence verified at Acme HQ).',
        timeStr: '1 Hour ago',
        exactTime: '10:14 AM',
        type: 'SYSTEM',
        priority: 'MEDIUM',
        isRead: false,
        routeTarget: 'Attendance',
      },
      {
        id: 'notif-hr-3',
        title: '👥 Staff Directory & Role Sync',
        message: '24 active employee profiles fully synced with NestJS backend database.',
        timeStr: '2 Hours ago',
        exactTime: '09:00 AM',
        type: 'SYSTEM',
        priority: 'NORMAL',
        isRead: false,
        routeTarget: 'Employees',
      },
      {
        id: 'notif-hr-4',
        title: '💼 Monthly Payroll Telemetry Report',
        message: 'Monthly workforce attendance & overtime telemetry report ready for download.',
        timeStr: 'Yesterday',
        exactTime: '05:00 PM',
        type: 'SYSTEM',
        priority: 'NORMAL',
        isRead: true,
        routeTarget: 'Attendance',
      },
    ];
  }

  if (normRole.includes('TEAM') || normRole.includes('LEADER') || normRole.includes('TL')) {
    return [
      {
        id: 'notif-tl-1',
        title: '🎯 Lead Funnel Batch Allocated to Team',
        message: '15 new leads allocated to your team queue from Google Sheets live sync ingestion.',
        timeStr: 'Today',
        exactTime: '11:00 AM',
        type: 'LEAD_ASSIGNED',
        priority: 'HIGH',
        isRead: false,
        routeTarget: 'Leads',
      },
      {
        id: 'notif-tl-2',
        title: '📞 Team Outbound Calling Target Alert',
        message: 'Team completed 184 calls out of 200 daily target (92% completion rate).',
        timeStr: '30 Mins ago',
        exactTime: '01:15 PM',
        type: 'TASK_5MIN_ALERT',
        priority: 'HIGH',
        isRead: false,
        routeTarget: 'Tasks',
      },
      {
        id: 'notif-tl-3',
        title: '⏰ 5-Min Prior Meeting Alert',
        message: 'Scheduled direct call with Priya Sharma (LogiTech Systems) starts in 5 minutes (04:45 PM).',
        timeStr: 'In 5 Mins',
        exactTime: '04:40 PM',
        type: 'CALL_REMINDER',
        priority: 'HIGH',
        isRead: false,
        leadId: 'lead-2',
        leadName: 'Priya Sharma',
        company: 'LogiTech Freight Systems',
        phone: '+91 98123 45678',
        email: 'priya@logitech.com',
        value: '₹3,50,000',
        meetingPurpose: 'WhatsApp Automation Bot Setup Review',
        routeTarget: 'LeadDetail',
      },
      {
        id: 'notif-tl-4',
        title: '🤝 Rep Deal Closed Successfully',
        message: 'Sales Exec Amit Patel closed deal with Sunita Logistics (₹8,90,000).',
        timeStr: '2 Hours ago',
        exactTime: '11:30 AM',
        type: 'DEAL_UPDATE',
        priority: 'NORMAL',
        isRead: true,
        leadId: 'lead-3',
        leadName: 'Sunita Kapoor',
        company: 'Sunita Logistics Pvt Ltd',
        routeTarget: 'LeadDetail',
      },
    ];
  }

  // Default: SALES_EXEC
  return [
    {
      id: 'notif-sales-1',
      title: '⏰ Task Alert (Starts in 5 Mins)',
      message: 'Scheduled product demo meeting with Rajesh Mehta (TechCorp Solutions) starts in 5 minutes (02:30 PM). Get ready for live demo & SLA review.',
      timeStr: 'In 5 Mins',
      exactTime: '02:25 PM',
      type: 'TASK_5MIN_ALERT',
      priority: 'HIGH',
      isRead: false,
      leadId: 'lead-1',
      leadName: 'Rajesh Mehta',
      company: 'TechCorp Solutions Ltd',
      phone: '+91 98765 43210',
      email: 'rajesh@techcorp.com',
      value: '₹5,20,000',
      meetingPurpose: 'Enterprise CRM Suite Demo & Technical Review',
      routeTarget: 'LeadDetail',
    },
    {
      id: 'notif-sales-2',
      title: '📞 Priority Call Reminder (Starts in 5 Mins)',
      message: 'Scheduled direct follow-up call with Priya Sharma (LogiTech Systems) starts in 5 minutes (04:45 PM). Discuss WhatsApp Bot Integration quotation.',
      timeStr: 'In 5 Mins',
      exactTime: '04:40 PM',
      type: 'CALL_REMINDER',
      priority: 'HIGH',
      isRead: false,
      leadId: 'lead-2',
      leadName: 'Priya Sharma',
      company: 'LogiTech Freight Systems',
      phone: '+91 98123 45678',
      email: 'priya@logitech.com',
      value: '₹3,50,000',
      meetingPurpose: 'WhatsApp Automation Bot Setup Review',
      routeTarget: 'LeadDetail',
    },
    {
      id: 'notif-sales-3',
      title: '🎯 Hot Lead Assigned to Your Queue',
      message: 'New high-value lead assigned: Sunita Logistics Pvt Ltd (₹8,90,000). Priority contact requested by Tenant Admin.',
      timeStr: '15 Mins ago',
      exactTime: '01:45 PM',
      type: 'LEAD_ASSIGNED',
      priority: 'MEDIUM',
      isRead: false,
      leadId: 'lead-3',
      leadName: 'Sunita Kapoor',
      company: 'Sunita Logistics Pvt Ltd',
      phone: '+91 97222 33344',
      email: 'sunita@sunitalogistics.com',
      value: '₹8,90,000',
      meetingPurpose: 'Executive Contract Signing & License Rollout',
      routeTarget: 'LeadDetail',
    },
    {
      id: 'notif-sales-4',
      title: '⏱️ Workforce Attendance Audit Complete',
      message: 'Workforce attendance punch logged successfully today at 09:21 AM (Geofence verified at Acme HQ).',
      timeStr: '2 Hours ago',
      exactTime: '09:21 AM',
      type: 'SYSTEM',
      priority: 'NORMAL',
      isRead: true,
      routeTarget: 'Attendance',
    },
  ];
}

export const INITIAL_DETAILED_NOTIFICATIONS: DetailedNotification[] = getRoleNotifications('ADMIN');

interface NotificationsScreenProps {
  onClose?: () => void;
  onNavigateToLead?: (leadId: string, leadName: string) => void;
  onNavigateToRoute?: (routeName: string) => void;
  onUnreadCountChange?: (unreadCount: number) => void;
}

export default function NotificationsScreen({
  onClose,
  onNavigateToLead,
  onNavigateToRoute,
  onUnreadCountChange,
}: NotificationsScreenProps) {
  const navigation = useNavigation<any>();
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
      if (onNavigateToRoute) onNavigateToRoute('Products');
      else navigation.navigate('More');
    } else {
      if (onNavigateToRoute) onNavigateToRoute('More');
      else navigation.navigate('More');
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

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
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✕ Close</Text>
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
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                      👤 {item.leadName} {item.company ? `(${item.company})` : ''}
                    </Text>
                    {item.meetingPurpose && (
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                        💼 {item.meetingPurpose}
                      </Text>
                    )}
                  </View>
                  {item.value && (
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>{item.value}</Text>
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
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✕</Text>
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

                <Text style={{ fontSize: 12, color: '#ffffff', lineHeight: 18, marginBottom: 12 }}>
                  {selectedNotif.message}
                </Text>

                {/* Lead Profile Metadata */}
                {selectedNotif.leadName && (
                  <View style={styles.modalLeadCard}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#818cf8' }}>🎯 Lead &amp; Task Context:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>{selectedNotif.leadName}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#34d399' }}>{selectedNotif.value || ''}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{selectedNotif.company} • {selectedNotif.phone}</Text>

                    {selectedNotif.meetingPurpose && (
                      <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
                        <Text style={{ fontSize: 10, color: '#cbd5e1', fontWeight: '700' }}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 32 },

  headerRow: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  unreadCountBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  unreadCountBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  closeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },

  alertBanner: { width: '100%', maxWidth: 600, backgroundColor: 'rgba(234,179,8,0.12)', borderWidth: 1, borderColor: '#eab308', borderRadius: 14, padding: 12, marginBottom: 12 },
  alertBannerTitle: { fontSize: 12, fontWeight: '900', color: '#facc15' },
  alertBannerSub: { fontSize: 10, color: '#fef08a', marginTop: 3, lineHeight: 14 },
  liveTag: { backgroundColor: 'rgba(234,179,8,0.2)', borderWidth: 1, borderColor: '#eab308', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  liveTagText: { color: '#facc15', fontSize: 8, fontWeight: '900' },

  filterContainer: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', marginRight: 6 },
  filterChipActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  filterChipTextActive: { color: '#818cf8', fontWeight: '900' },

  markAllBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  markAllBtnText: { color: '#818cf8', fontSize: 9, fontWeight: '800' },

  notifCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 10 },
  notifCardUnread: { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.08)' },
  notifTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  unreadGlowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#818cf8' },
  timeBadge: { backgroundColor: '#020617', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  timeBadgeHigh: { backgroundColor: 'rgba(234,179,8,0.15)', borderColor: '#eab308' },
  timeBadgeText: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },

  notifMsg: { fontSize: 11, color: '#cbd5e1', marginTop: 4, lineHeight: 16 },
  leadContextBox: { marginTop: 8, backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  cardActionsRow: { flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' },
  routeActionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  routeActionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  callActionBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  callActionBtnText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  readActionBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginLeft: 'auto' },
  readActionBtnText: { color: '#94a3b8', fontSize: 9, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  modalAlertNotice: { backgroundColor: 'rgba(234,179,8,0.15)', borderWidth: 1, borderColor: '#eab308', borderRadius: 10, padding: 8, marginBottom: 10 },
  modalAlertNoticeTitle: { fontSize: 10, fontWeight: '900', color: '#facc15' },
  modalAlertNoticeSub: { fontSize: 9, color: '#fef08a', marginTop: 1 },

  modalLeadCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 10, marginBottom: 10 },
  modalActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modalActionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  mainRouteBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  mainRouteBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
