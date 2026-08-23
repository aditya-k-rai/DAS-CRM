/**
 * TenantAdminHeaderBanner.tsx — DAS CRM Android
 * Dynamic Command Center Header Banner with full role support (Admin, Manager, HR, TL, Sales).
 * Feature parity with Web dashboards (TenantAdminDashboard, ManagerRoleDashboard, HRRoleDashboard).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

interface TenantAdminHeaderBannerProps {
  navigation?: any;
  role?: UserRole;
  onButton1Press?: () => void;
  onButton2Press?: () => void;
}

export function TenantAdminHeaderBanner({
  navigation,
  role,
  onButton1Press,
  onButton2Press,
}: TenantAdminHeaderBannerProps) {
  const { currentUser, subscription } = useAuthStore();
  const activeRole: UserRole = normalizeRoleStr(role || currentUser?.role);

  const companyName = currentUser?.companyName || subscription?.companyName || 'Acme Sales Solutions';
  const avatarInitials = currentUser?.avatar || 'VS';
  const trialDays = subscription?.trialDaysLeft ?? 14;

  // Role Configuration Setup
  let title = 'TENANT ADMIN COMMAND CENTER';
  let badgeText = `⏱️ ${trialDays} Days Remaining in Free Trial`;
  let subtitle = `${companyName} · Executive Operating System & Multi-Tenant Control Hub`;
  let themeColor = '#6366f1';
  let avatarBg = 'rgba(99, 102, 241, 0.25)';
  let avatarBorder = 'rgba(99, 102, 241, 0.5)';
  let avatarTextColor = '#818cf8';
  let badgeBg = 'rgba(245, 158, 11, 0.18)';
  let badgeBorder = 'rgba(245, 158, 11, 0.4)';
  let badgeTextColor = '#fbbf24';

  let btn1Text = '🛡️ Structure Builder';
  let btn2Text = '⚡ Workflow Rules';
  let defaultBtn1Handler = () => {
    try { navigation?.navigate('More', { initialModule: 'TEAM_LEADERS' }); } catch { navigation?.navigate('MoreControls'); }
  };
  let defaultBtn2Handler = () => {
    try { navigation?.navigate('WorkflowAutomations'); } catch { navigation?.navigate('MoreControls'); }
  };

  if (activeRole === 'MANAGER') {
    title = 'DEPARTMENT MANAGER WORKSPACE';
    badgeText = `🔮 MANAGER PORTAL`;
    subtitle = `${companyName} · Department Revenue, Team Targets & Operations Control Hub`;
    themeColor = '#a855f7';
    avatarBg = 'rgba(168, 85, 247, 0.25)';
    avatarBorder = 'rgba(168, 85, 247, 0.5)';
    avatarTextColor = '#c084fc';
    badgeBg = 'rgba(168, 85, 247, 0.18)';
    badgeBorder = 'rgba(168, 85, 247, 0.4)';
    badgeTextColor = '#e9d5ff';
    btn1Text = '📊 Team Targets';
    btn2Text = '📋 Work Reports';
    defaultBtn1Handler = () => { try { navigation?.navigate('More', { initialModule: 'GOALS' }); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('More', { initialModule: 'REPORTS' }); } catch {} };
  } else if (activeRole === 'HR') {
    title = 'HUMAN RESOURCES & PAYROLL HUB';
    badgeText = `💼 HR MANAGER`;
    subtitle = `${companyName} · Attendance Telemetry, Leave Approvals & Payroll Engine`;
    themeColor = '#10b981';
    avatarBg = 'rgba(16, 185, 129, 0.25)';
    avatarBorder = 'rgba(16, 185, 129, 0.5)';
    avatarTextColor = '#34d399';
    badgeBg = 'rgba(16, 185, 129, 0.18)';
    badgeBorder = 'rgba(16, 185, 129, 0.4)';
    badgeTextColor = '#a7f3d0';
    btn1Text = '📅 Attendance Audit';
    btn2Text = '💰 Payroll Builder';
    defaultBtn1Handler = () => { try { navigation?.navigate('Attendance'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('More', { initialModule: 'SALARY' }); } catch {} };
  } else if (activeRole === 'TEAM_LEADER') {
    title = 'TEAM LEADER COMMAND CENTER';
    badgeText = `⚡ TEAM LEADER`;
    subtitle = `${companyName} · Subordinate Lead Distribution & Funnel Telemetry`;
    themeColor = '#0284c7';
    avatarBg = 'rgba(56, 189, 248, 0.25)';
    avatarBorder = 'rgba(56, 189, 248, 0.5)';
    avatarTextColor = '#38bdf8';
    badgeBg = 'rgba(56, 189, 248, 0.18)';
    badgeBorder = 'rgba(56, 189, 248, 0.4)';
    badgeTextColor = '#bae6fd';
    btn1Text = '🎯 Lead Handover';
    btn2Text = '👥 Team Roster';
    defaultBtn1Handler = () => { try { navigation?.navigate('Leads'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('More', { initialModule: 'EMPLOYEES' }); } catch {} };
  } else if (activeRole === 'SALES_EXEC') {
    title = 'EMPLOYEE SALES WORKSPACE';
    badgeText = `🚀 SALES REP`;
    subtitle = `${companyName} · Personal Lead Pipeline, Call Logs & Target Tracker`;
    themeColor = '#f59e0b';
    avatarBg = 'rgba(245, 158, 11, 0.25)';
    avatarBorder = 'rgba(245, 158, 11, 0.5)';
    avatarTextColor = '#fbbf24';
    badgeBg = 'rgba(245, 158, 11, 0.18)';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    badgeTextColor = '#fde68a';
    btn1Text = '📞 Call Logs';
    btn2Text = '🎯 Deals Pipeline';
    defaultBtn1Handler = () => { try { navigation?.navigate('Leads'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('More', { initialModule: 'PIPELINE' }); } catch {} };
  }

  const handleBtn1 = onButton1Press || defaultBtn1Handler;
  const handleBtn2 = onButton2Press || defaultBtn2Handler;

  return (
    <View style={[styles.bannerContainer, { borderLeftColor: themeColor }]}>
      <View style={styles.topRow}>
        {/* Avatar Circle */}
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg, borderColor: avatarBorder }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>{avatarInitials}</Text>
        </View>

        {/* Text Details & Badge */}
        <View style={styles.textContainer}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.titleText}>{title}</Text>
            <View style={[styles.trialBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
              <Text style={[styles.trialBadgeText, { color: badgeTextColor }]}>
                {badgeText}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitleText} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0c1322',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textContainer: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  trialBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
});
