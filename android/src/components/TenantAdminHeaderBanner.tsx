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
import { useTheme } from '../context/ThemeContext';

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
  const { colors, isDark } = useTheme();
  const activeRole: UserRole = normalizeRoleStr(role || currentUser?.role);

  const companyName = currentUser?.companyName || subscription?.companyName || 'Acme Sales Solutions';
  const avatarInitials = currentUser?.avatar || 'VS';
  const trialDays = subscription?.trialDaysLeft ?? 14;

  // Role Configuration Setup
  let title = 'TENANT ADMIN COMMAND CENTER';
  let badgeText = `⏱️ ${trialDays} Days Remaining in Free Trial`;
  let subtitle = `${companyName} · Executive Operating System & Multi-Tenant Control Hub`;
  let themeColor = '#6366f1';
  let avatarBg = isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)';
  let avatarBorder = isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.35)';
  let avatarTextColor = isDark ? '#818cf8' : '#4f46e5';
  let badgeBg = isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)';
  let badgeBorder = isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)';
  let badgeTextColor = isDark ? '#fbbf24' : '#d97706';

  let btn1Text = '🛡️ Structure Builder';
  let btn2Text = '⚡ Workflow Rules';
  let defaultBtn1Handler = () => {
    // Structure -> Employees screen (Assigned / Unassigned)
    try { navigation?.navigate('Employees'); } catch { navigation?.navigate('Menu'); }
  };
  let defaultBtn2Handler = () => {
    // Workflow -> WorkflowBuilder screen
    try { navigation?.navigate('WorkflowBuilder'); } catch { navigation?.navigate('Menu'); }
  };

  if (activeRole === 'MANAGER') {
    title = 'DEPARTMENT MANAGER WORKSPACE';
    badgeText = `🔮 MANAGER PORTAL`;
    subtitle = `${companyName} · Department Revenue, Team Targets & Operations Control Hub`;
    themeColor = '#a855f7';
    avatarBg = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.12)';
    avatarBorder = isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.35)';
    avatarTextColor = isDark ? '#c084fc' : '#7e22ce';
    badgeBg = isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.12)';
    badgeBorder = isDark ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.3)';
    badgeTextColor = isDark ? '#e9d5ff' : '#6b21a8';
    btn1Text = '📊 Team Targets';
    btn2Text = '📋 Work Reports';
    defaultBtn1Handler = () => { try { navigation?.navigate('Menu', { initialModule: 'GOALS' }); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('Menu', { initialModule: 'REPORTS' }); } catch {} };
  } else if (activeRole === 'HR') {
    title = 'HUMAN RESOURCES & PAYROLL HUB';
    badgeText = `💼 HR MANAGER`;
    subtitle = `${companyName} · Attendance Telemetry, Leave Approvals & Payroll Engine`;
    themeColor = '#10b981';
    avatarBg = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)';
    avatarBorder = isDark ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.35)';
    avatarTextColor = isDark ? '#34d399' : '#047857';
    badgeBg = isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)';
    badgeBorder = isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)';
    badgeTextColor = isDark ? '#a7f3d0' : '#065f46';
    btn1Text = '📅 Attendance Audit';
    btn2Text = '💰 Payroll Builder';
    defaultBtn1Handler = () => { try { navigation?.navigate('Attendance'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('Menu', { initialModule: 'SALARY' }); } catch {} };
  } else if (activeRole === 'TEAM_LEADER') {
    title = 'TEAM LEADER COMMAND CENTER';
    badgeText = `⚡ TEAM LEADER`;
    subtitle = `${companyName} · Subordinate Lead Distribution & Funnel Telemetry`;
    themeColor = '#0284c7';
    avatarBg = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.12)';
    avatarBorder = isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(56, 189, 248, 0.35)';
    avatarTextColor = isDark ? '#38bdf8' : '#0369a1';
    badgeBg = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(56, 189, 248, 0.12)';
    badgeBorder = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.3)';
    badgeTextColor = isDark ? '#bae6fd' : '#075985';
    btn1Text = '🎯 Lead Handover';
    btn2Text = '👥 Team Roster';
    defaultBtn1Handler = () => { try { navigation?.navigate('Leads'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('Menu', { initialModule: 'EMPLOYEES' }); } catch {} };
  } else if (activeRole === 'SALES_EXEC') {
    title = 'EMPLOYEE SALES WORKSPACE';
    badgeText = `🚀 SALES REP`;
    subtitle = `${companyName} · Personal Lead Pipeline, Call Logs & Target Tracker`;
    themeColor = '#f59e0b';
    avatarBg = isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)';
    avatarBorder = isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.35)';
    avatarTextColor = isDark ? '#fbbf24' : '#b45309';
    badgeBg = isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)';
    badgeBorder = isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)';
    badgeTextColor = isDark ? '#fde68a' : '#92400e';
    btn1Text = '📞 Call Logs';
    btn2Text = '🎯 Deals Pipeline';
    defaultBtn1Handler = () => { try { navigation?.navigate('Leads'); } catch {} };
    defaultBtn2Handler = () => { try { navigation?.navigate('Menu', { initialModule: 'PIPELINE' }); } catch {} };
  }

  const handleBtn1 = onButton1Press || defaultBtn1Handler;
  const handleBtn2 = onButton2Press || defaultBtn2Handler;

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderLeftColor: themeColor,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Avatar Circle */}
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg, borderColor: avatarBorder }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>{avatarInitials}</Text>
        </View>

        {/* Text Details & Badge */}
        <View style={styles.textContainer}>
          <View style={styles.titleBadgeRow}>
            <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
            <View style={[styles.trialBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
              <Text style={[styles.trialBadgeText, { color: badgeTextColor }]}>
                {badgeText}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitleText, { color: colors.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>

      {/* ── Action Buttons Row ── */}
      <View
        style={[
          styles.actionButtonsRow,
          {
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.btnSecondary,
            {
              borderColor: themeColor,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(99, 102, 241, 0.06)',
            },
          ]}
          onPress={handleBtn1}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnSecondaryText, { color: isDark ? avatarTextColor : themeColor }]}>
            {btn1Text}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: themeColor }]}
          onPress={handleBtn2}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>{btn2Text}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
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
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  btnSecondary: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnPrimary: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
