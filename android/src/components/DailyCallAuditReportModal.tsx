/**
 * DailyCallAuditReportModal.tsx — DAS CRM Android
 * Interactive On-Screen Audit Report & PDF Generator for Daily Calls,
 * Lead-wise Dispositions, Remarks, and Connected Follow-up Details.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { PerformanceRepData } from './RepDrilldownModal';
import { LeadItem } from '../services/apiService';
import { FollowUpTask } from '../services/followUpSyncEngine';
import {
  buildDailyCallReportData,
  generateAndShareDailyCallPdf,
  DailyCallReportData,
} from '../services/callReportPdfGenerator';
import { toDateKey } from '../services/dateUtils';

interface DailyCallAuditReportModalProps {
  visible: boolean;
  onClose: () => void;
  rep: PerformanceRepData | null;
  initialDate?: string;
  leads?: LeadItem[];
  followUps?: FollowUpTask[];
  onSelectDate?: (dateStr: string) => void;
}

export function DailyCallAuditReportModal({
  visible,
  onClose,
  rep,
  initialDate,
  leads = [],
  followUps = [],
  onSelectDate,
}: DailyCallAuditReportModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState<string>(() => initialDate || toDateKey(new Date()));
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync if initialDate changes
  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const reportData: DailyCallReportData | null = useMemo(() => {
    if (!rep) return null;
    return buildDailyCallReportData(rep, currentDate, leads, followUps);
  }, [rep, currentDate, leads, followUps]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    const prevKey = toDateKey(d);
    setCurrentDate(prevKey);
    if (onSelectDate) onSelectDate(prevKey);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const nextKey = toDateKey(d);
    setCurrentDate(nextKey);
    if (onSelectDate) onSelectDate(nextKey);
  };

  const handleToday = () => {
    const todayKey = toDateKey(new Date());
    setCurrentDate(todayKey);
    if (onSelectDate) onSelectDate(todayKey);
  };

  const handleDownloadPdf = async () => {
    if (!rep) return;
    try {
      setIsExporting(true);
      await generateAndShareDailyCallPdf(rep, currentDate, leads, followUps);
    } catch (err: any) {
      Alert.alert('PDF Export', err?.message || 'Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCall = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned) {
      Linking.openURL(`tel:${cleaned}`).catch(() => {});
    }
  };

  const handleWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned) {
      Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() => {});
    }
  };

  if (!visible || !rep || !reportData) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* ── HEADER ROW ── */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>📄</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  Daily Call & Follow-up Audit
                </Text>
              </View>
              <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                Lead responses, dispositions & scheduled callbacks
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.cardBgElevated }]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── DATE NAVIGATION BAR ── */}
          <View style={[styles.dateNavBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevDay} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '900' }}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateCenterBtn} onPress={handleToday} activeOpacity={0.8}>
              <Text style={[styles.dateCenterText, { color: '#6366f1' }]} numberOfLines={1}>
                📅 {reportData.reportDateFormatted}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextDay} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '900' }}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.todaySmallBtn} onPress={handleToday} activeOpacity={0.7}>
              <Text style={styles.todaySmallBtnText}>Today</Text>
            </TouchableOpacity>
          </View>

          {/* ── SCROLLABLE AUDIT REPORT CONTENT ── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 90 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. SALES REP & AUDIT DATE ABOVE */}
            <View style={[styles.repBanner, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff', borderColor: '#c7d2fe' }]}>
              <View style={styles.repBannerTop}>
                <View style={[styles.repAvatar, { backgroundColor: rep.avatarColor || '#6366f1' }]}>
                  <Text style={styles.repAvatarText}>{rep.initials || rep.userName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.repName, { color: colors.text }]}>{reportData.repName}</Text>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{reportData.repRole}</Text>
                    </View>
                  </View>
                  <Text style={[styles.repEmail, { color: colors.textMuted }]}>
                    {reportData.repEmail} {reportData.teamLeaderName ? `· Squad: ${reportData.teamLeaderName}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.auditMetaStrip}>
                <View style={styles.auditMetaItem}>
                  <Text style={styles.auditMetaLabel}>REPORT DATE</Text>
                  <Text style={[styles.auditMetaValue, { color: '#4f46e5' }]}>{reportData.reportDate}</Text>
                </View>
                <View style={styles.auditMetaItem}>
                  <Text style={styles.auditMetaLabel}>ORGANIZATION</Text>
                  <Text style={styles.auditMetaValue} numberOfLines={1}>{reportData.organizationName}</Text>
                </View>
              </View>
            </View>

            {/* 2. EXECUTIVE METRIC TILES */}
            <View style={styles.kpiGrid}>
              {/* Tile 1: Total Calls */}
              <View style={[styles.kpiTile, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={styles.kpiLabel}>TOTAL CALLS</Text>
                <Text style={[styles.kpiVal, { color: '#4f46e5' }]}>{reportData.totalCalls}</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
                  Fresh: {reportData.freshCalls} · FO: {reportData.followupCalls}
                </Text>
              </View>

              {/* Tile 2: Talk Time */}
              <View style={[styles.kpiTile, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={styles.kpiLabel}>TALK TIME</Text>
                <Text style={[styles.kpiVal, { color: '#0ea5e9' }]}>{reportData.totalTalkTimeFormatted}</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Connected duration</Text>
              </View>

              {/* Tile 3: Target Quota */}
              <View style={[styles.kpiTile, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={styles.kpiLabel}>TARGET QUOTA</Text>
                <Text style={[styles.kpiVal, { color: '#10b981' }]}>{reportData.completionPct}%</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
                  {reportData.totalCalls}/{reportData.dailyCallsTarget} Calls
                </Text>
              </View>

              {/* Tile 4: WhatsApp Sent */}
              <View style={[styles.kpiTile, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={styles.kpiLabel}>WHATSAPP</Text>
                <Text style={[styles.kpiVal, { color: '#22c55e' }]}>{reportData.whatsappSent}</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Direct Sent</Text>
              </View>
            </View>

            {/* 3. DISPOSITIONS BREAKDOWN */}
            <View style={[styles.dispBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <Text style={[styles.dispBoxTitle, { color: colors.text }]}>CALL RESPONSES & DISPOSITIONS:</Text>
              <View style={styles.dispPillsRow}>
                {reportData.dispositionsBreakdown.length > 0 ? (
                  reportData.dispositionsBreakdown.map((d, dIdx) => (
                    <View key={`disp-${dIdx}`} style={[styles.dispBadgePill, { borderColor: `${d.color}40`, backgroundColor: `${d.color}15` }]}>
                      <Text style={[styles.dispBadgeName, { color: d.color }]}>{d.name}</Text>
                      <Text style={[styles.dispBadgeCount, { color: d.color }]}>{d.count}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>No call responses recorded for this date.</Text>
                )}
              </View>
            </View>

            {/* 4. ITEMISED LEAD CALLS & CONNECTED FOLLOW-UPS */}
            <View style={styles.leadSectionHeader}>
              <Text style={[styles.leadSectionTitle, { color: colors.text }]}>
                📞 LEAD-WISE CALL LOGS ({reportData.leadCalls.length})
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>In-depth details & follow-up callbacks</Text>
            </View>

            {reportData.leadCalls.length > 0 ? (
              reportData.leadCalls.map((item, idx) => (
                <View
                  key={`lead-call-${idx}`}
                  style={[styles.leadCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                >
                  {/* Lead Header */}
                  <View style={styles.leadCardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.leadIdx}>#{idx + 1}</Text>
                        <Text style={[styles.leadNameText, { color: colors.text }]} numberOfLines={1}>
                          {item.leadName}
                        </Text>
                      </View>
                      <Text style={[styles.leadCompanyText, { color: colors.textMuted }]} numberOfLines={1}>
                        🏢 {item.leadCompany}
                      </Text>
                    </View>

                    <View style={[styles.statusTag, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                      <Text style={styles.statusTagText}>{item.leadStatus}</Text>
                    </View>
                  </View>

                  {/* Phone & Quick Dial Strip */}
                  <View style={[styles.leadContactRow, { borderColor: colors.border }]}>
                    <Text style={[styles.phoneText, { color: colors.text }]}>{item.leadPhone}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.miniActionBtn, { backgroundColor: 'rgba(16,185,129,0.15)' }]}
                        onPress={() => handleCall(item.leadPhone)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '800' }}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniActionBtn, { backgroundColor: 'rgba(37,211,102,0.15)' }]}
                        onPress={() => handleWhatsApp(item.leadPhone)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 10, color: '#25D366', fontWeight: '800' }}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Call Telemetry Attributes */}
                  <View style={[styles.callMetaGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                    <View style={styles.callMetaCol}>
                      <Text style={styles.callMetaLbl}>CALL TYPE</Text>
                      <Text
                        style={[
                          styles.callMetaVal,
                          item.callType === 'FRESH' ? { color: '#10b981' } : { color: '#6366f1' },
                        ]}
                      >
                        {item.callType === 'FRESH' ? '🌱 Fresh Call' : '🔄 Follow-up'}
                      </Text>
                    </View>

                    <View style={styles.callMetaCol}>
                      <Text style={styles.callMetaLbl}>CALL TIME</Text>
                      <Text style={[styles.callMetaVal, { color: colors.text }]}>{item.callTime}</Text>
                    </View>

                    <View style={styles.callMetaCol}>
                      <Text style={styles.callMetaLbl}>RESPONSE</Text>
                      <View style={[styles.dispSmallBadge, { backgroundColor: `${item.dispositionColor}20`, borderColor: `${item.dispositionColor}50` }]}>
                        <Text style={[styles.dispSmallText, { color: item.dispositionColor }]} numberOfLines={1}>
                          {item.disposition}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.callMetaCol}>
                      <Text style={styles.callMetaLbl}>DURATION</Text>
                      <Text style={[styles.callMetaVal, { color: colors.text }]}>{item.duration}</Text>
                    </View>
                  </View>

                  {/* Conversation Remarks */}
                  <View style={[styles.remarksBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : '#fdfdfe' }]}>
                    <Text style={styles.remarksLbl}>📝 Remarks & Conversation Notes:</Text>
                    <Text style={[styles.remarksContent, { color: colors.text }]}>{item.remarks}</Text>
                  </View>

                  {/* Connected Follow-up Section */}
                  {item.followUp ? (
                    <View style={[styles.followUpCard, { backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : '#faf5ff', borderColor: '#d8b4fe' }]}>
                      <View style={styles.fuTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12 }}>⏰</Text>
                          <Text style={[styles.fuChannelText, { color: '#9333ea' }]}>
                            {item.followUp.channel === 'WHATSAPP'
                              ? 'WhatsApp Follow-up'
                              : item.followUp.channel === 'MEETING'
                              ? 'In-Person / Virtual Visit'
                              : 'Phone Call Callback'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.fuStatusBadge,
                            item.followUp.isCompleted
                              ? { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }
                              : { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.fuStatusText,
                              item.followUp.isCompleted ? { color: '#047857' } : { color: '#b45309' },
                            ]}
                          >
                            {item.followUp.isCompleted ? '✓ Completed' : '⏳ Scheduled (Pending)'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.fuScheduleText, { color: isDark ? '#e9d5ff' : '#581c87' }]}>
                        🗓️ Scheduled for: <Text style={{ fontWeight: '800' }}>{item.followUp.scheduledDate} at {item.followUp.scheduledTime}</Text>
                      </Text>

                      <Text style={[styles.fuObjectiveText, { color: isDark ? '#d8b4fe' : '#6b21a8' }]}>
                        🎯 Objective: {item.followUp.purpose}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.fuEmptyBox, { borderColor: colors.border }]}>
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic' }}>
                        ℹ️ No scheduled follow-up created for this call (Concluded)
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={[styles.emptyStateBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📞</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Calls Logged on {reportData.reportDate}</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Zero call telemetry records found for this sales representative on the selected date. Use the date arrows above to inspect previous days.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <View style={[styles.stickyFooter, { borderTopColor: colors.border, backgroundColor: colors.cardBg }]}>
            <TouchableOpacity
              style={[styles.pdfDownloadBtn, isExporting && { opacity: 0.7 }]}
              onPress={handleDownloadPdf}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={{ fontSize: 15 }}>📥</Text>
                  <Text style={styles.pdfDownloadBtnText}>Download PDF Audit Report</Text>
                </>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    width: '100%',
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 10,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  navArrowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateCenterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateCenterText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  todaySmallBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todaySmallBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
  },
  repBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  repBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  repAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  repName: {
    fontSize: 14,
    fontWeight: '900',
  },
  roleTag: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
  },
  repEmail: {
    fontSize: 10,
    marginTop: 2,
  },
  auditMetaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99,102,241,0.2)',
  },
  auditMetaItem: {
    flex: 1,
  },
  auditMetaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  auditMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  kpiTile: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 8,
    textAlign: 'center',
  },
  dispBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  dispBoxTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dispPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dispBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  dispBadgeName: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  dispBadgeCount: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  leadSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadSectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  leadCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  leadIdx: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  leadNameText: {
    fontSize: 13,
    fontWeight: '900',
  },
  leadCompanyText: {
    fontSize: 10,
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  leadContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 6,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  miniActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  callMetaGrid: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  callMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  callMetaLbl: {
    fontSize: 7.5,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  callMetaVal: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  dispSmallBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    marginTop: 1,
  },
  dispSmallText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  remarksBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  remarksLbl: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#4f46e5',
  },
  remarksContent: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  followUpCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  fuTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fuChannelText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fuStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
  },
  fuStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  fuScheduleText: {
    fontSize: 9.5,
    marginTop: 2,
  },
  fuObjectiveText: {
    fontSize: 9,
    marginTop: 2,
  },
  fuEmptyBox: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    marginTop: 2,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 15,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  stickyFooter: {
    padding: 12,
    borderTopWidth: 1,
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 10,
  },
  pdfDownloadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
export default DailyCallAuditReportModal;
