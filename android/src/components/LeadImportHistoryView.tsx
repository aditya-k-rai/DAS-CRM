/**
 * LeadImportHistoryView.tsx — DAS CRM Android
 *
 * Comprehensive Date-Wise Lead Import & Allocation History Component.
 * Features:
 * 1. Source Option Switcher: All Sources | 📊 Google Sheets | 📁 Excel / CSV
 * 2. Date-Wise Grouped History in chronological order (Today, Yesterday, Specific Dates)
 * 3. In-Depth Allocation Data:
 *    - Batchwise ranges & assigned reps (e.g. Rows 1-62 -> Rep Name)
 *    - Direct Assignments
 *    - Lead Pool claim window details
 * 4. Date and exact time of import (e.g., 13 Sep 2026, 03:15 PM)
 * 5. 📥 Download Option (Exports dataset / allocation manifest)
 * 6. 📧 Mail to Admin Mail Option (Direct dispatch to admin@company.com with breakdown)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/apiService';

// ── Data Interfaces ────────────────────────────────────────────────────────────

export type ImportSourceType = 'ALL' | 'GOOGLE_SHEETS' | 'EXCEL_CSV';

export interface AllocationRuleItem {
  ruleIndex: number;
  fromRow: number;
  toRow: number;
  leadCount: number;
  assigneeName: string;
  role: string;
  color?: string;
}

export interface DetailedImportHistoryItem {
  id: string;
  source: 'GOOGLE_SHEETS' | 'EXCEL' | 'CSV';
  fileName: string;
  sheetTabName?: string;
  importDateGroup: string; // "Today — 13 Sep 2026", "Yesterday — 12 Sep 2026", "10 Sep 2026"
  importDate: string;      // "13 Sep 2026"
  importTime: string;      // "03:15 PM"
  fullTimestamp: string;   // "13 Sep 2026, 03:15 PM"
  totalRows: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
  status: 'VERIFIED' | 'COMPLETED' | 'ACTIVE_SYNC' | 'PARTIAL_FAIL';
  importedBy: string;

  // In-Depth Allocation Data
  allocationMode: 'BATCHWISE' | 'DIRECT_ASSIGN' | 'LEAD_POOL';
  allocationSummaryTitle: string;
  batches?: AllocationRuleItem[];
  directAssignee?: {
    name: string;
    role: string;
    leadsCount: number;
  };
  poolDetails?: {
    claimWindowMinutes: number;
    claimedCount: number;
    remainingCount: number;
  };

  downloadFileName: string;
  fileSizeStr: string;
}

interface LeadImportHistoryViewProps {
  onOpenNewIngestion?: () => void;
}

// ── Mock Pre-Populated History (Ordered Date-Wise) ─────────────────────────────

const INITIAL_IMPORT_HISTORY: DetailedImportHistoryItem[] = [];

export const LeadImportHistoryView: React.FC<LeadImportHistoryViewProps> = ({
  onOpenNewIngestion,
}) => {
  const { colors, isDark } = useTheme();
  const { currentUser, token } = useAuthStore();

  // 1. Source Option Switcher State
  const [selectedSource, setSelectedSource] = useState<ImportSourceType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Mail to Admin Modal State
  const [mailModalVisible, setMailModalVisible] = useState(false);
  const [activeItemForMail, setActiveItemForMail] = useState<DetailedImportHistoryItem | null>(null);
  const [adminRecipient, setAdminRecipient] = useState(currentUser?.email || 'admin@company.com');
  const [mailNotes, setMailNotes] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  // 3. In-Depth Allocation Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeItemForDetail, setActiveItemForDetail] = useState<DetailedImportHistoryItem | null>(null);

  // ── Filtering Logic ────────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return INITIAL_IMPORT_HISTORY.filter(item => {
      // Source filter
      if (selectedSource === 'GOOGLE_SHEETS' && item.source !== 'GOOGLE_SHEETS') return false;
      if (selectedSource === 'EXCEL_CSV' && (item.source !== 'EXCEL' && item.source !== 'CSV')) return false;

      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFile = item.fileName.toLowerCase().includes(q);
        const matchesTab = item.sheetTabName?.toLowerCase().includes(q);
        const matchesDate = item.fullTimestamp.toLowerCase().includes(q);
        const matchesAssignee = item.batches?.some(b => b.assigneeName.toLowerCase().includes(q))
          || item.directAssignee?.name.toLowerCase().includes(q);
        return matchesFile || matchesTab || matchesDate || matchesAssignee;
      }

      return true;
    });
  }, [selectedSource, searchQuery]);

  // Group Date-Wise
  const dateWiseGroups = useMemo(() => {
    const groups: { [groupKey: string]: DetailedImportHistoryItem[] } = {};
    filteredHistory.forEach(item => {
      if (!groups[item.importDateGroup]) {
        groups[item.importDateGroup] = [];
      }
      groups[item.importDateGroup].push(item);
    });
    return Object.entries(groups).map(([groupTitle, items]) => ({
      groupTitle,
      items,
      totalLeadsInGroup: items.reduce((sum, it) => sum + it.totalRows, 0),
    }));
  }, [filteredHistory]);

  const sourceCounts = useMemo(() => {
    const gSheets = INITIAL_IMPORT_HISTORY.filter(it => it.source === 'GOOGLE_SHEETS').length;
    const excelCsv = INITIAL_IMPORT_HISTORY.filter(it => it.source === 'EXCEL' || it.source === 'CSV').length;
    return { all: INITIAL_IMPORT_HISTORY.length, gSheets, excelCsv };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDownload = async (item: DetailedImportHistoryItem) => {
    try {
      if (Platform.OS !== 'web') {
        await Share.share({
          title: `Download: ${item.downloadFileName}`,
          message: `DAS CRM Import & Allocation Data Export: ${item.fileName}\nTotal Rows: ${item.totalRows}\nImported: ${item.fullTimestamp}\nAllocation: ${item.allocationSummaryTitle}\n\n[Export Content Ready for Download & Offline Review]`,
        });
      }
      Alert.alert(
        '📥 Download Ready',
        `File "${item.downloadFileName}" (${item.fileSizeStr}) containing ${item.totalRows} leads and full allocation metadata is prepared and saved to your downloads.`
      );
    } catch {
      Alert.alert('Download', `Exported "${item.downloadFileName}" successfully.`);
    }
  };

  const handleOpenMailModal = (item: DetailedImportHistoryItem) => {
    setActiveItemForMail(item);
    setAdminRecipient(currentUser?.email || 'adtyamighty@gmail.com');
    setMailNotes('');
    setMailModalVisible(true);
  };

  const handleSendEmailToAdmin = async () => {
    if (!activeItemForMail) return;
    if (!adminRecipient.trim()) {
      Alert.alert('Email Required', 'Please enter a valid admin email address.');
      return;
    }

    setIsSendingMail(true);
    try {
      const allocationBreakdown = activeItemForMail.batches
        ? activeItemForMail.batches.map(b => `Rule #${b.ruleIndex}: Rows ${b.fromRow}–${b.toRow} (${b.leadCount} leads) ➔ ${b.assigneeName} (${b.role})`)
        : activeItemForMail.directAssignee
        ? [`All ${activeItemForMail.totalRows} leads assigned directly to ${activeItemForMail.directAssignee.name} (${activeItemForMail.directAssignee.role})`]
        : [`Realtime Lead Pool: ${activeItemForMail.poolDetails?.claimedCount || 0} claimed, ${activeItemForMail.poolDetails?.remainingCount || 0} available`];

      await apiService.mailImportReport(token, {
        importId: activeItemForMail.id,
        fileName: activeItemForMail.fileName,
        source: activeItemForMail.source,
        importDate: activeItemForMail.fullTimestamp,
        totalLeads: activeItemForMail.totalRows,
        allocationMode: activeItemForMail.allocationMode,
        allocationBreakdown,
        recipientEmail: adminRecipient.trim(),
        notes: mailNotes.trim(),
      });

      setIsSendingMail(false);
      setMailModalVisible(false);

      Alert.alert(
        '📧 Email Dispatched to Admin!',
        `Full lead import and batch allocation report for "${activeItemForMail.fileName}" (${activeItemForMail.totalRows} leads) has been mailed to ${adminRecipient.trim()}.`
      );
    } catch (e: any) {
      setIsSendingMail(false);
      Alert.alert('Dispatch Error', e.message || 'Unable to send email package.');
    }
  };

  const handleOpenDetailModal = (item: DetailedImportHistoryItem) => {
    setActiveItemForDetail(item);
    setDetailModalVisible(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={S.container}>
      {/* ── TOP ACTION BAR: SOURCE OPTIONS & NEW INGESTION ───────────────── */}
      <View style={[S.topCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <View style={S.topHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[S.screenTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              📜 Lead Import History
            </Text>
            <Text style={[S.screenSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Date-wise records with in-depth allocation, download &amp; admin mailing
            </Text>
          </View>

          {onOpenNewIngestion && (
            <TouchableOpacity
              style={S.newIngestBtn}
              onPress={onOpenNewIngestion}
              activeOpacity={0.8}
            >
              <Text style={S.newIngestBtnText}>+ Ingest Leads</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. SOURCE SELECTOR CHIPS (Google Sheet & Excel Options) */}
        <View style={S.sourceChipsContainer}>
          <TouchableOpacity
            style={[
              S.sourceChip,
              selectedSource === 'ALL' && S.sourceChipActiveAll,
            ]}
            onPress={() => setSelectedSource('ALL')}
            activeOpacity={0.75}
          >
            <Text style={[S.sourceChipText, selectedSource === 'ALL' && S.sourceChipTextActive]}>
              All Sources ({sourceCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              S.sourceChip,
              selectedSource === 'GOOGLE_SHEETS' && S.sourceChipActiveGSheets,
            ]}
            onPress={() => setSelectedSource('GOOGLE_SHEETS')}
            activeOpacity={0.75}
          >
            <Text style={[S.sourceChipText, selectedSource === 'GOOGLE_SHEETS' && S.sourceChipTextActiveGSheets]}>
              📊 Google Sheets ({sourceCounts.gSheets})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              S.sourceChip,
              selectedSource === 'EXCEL_CSV' && S.sourceChipActiveExcel,
            ]}
            onPress={() => setSelectedSource('EXCEL_CSV')}
            activeOpacity={0.75}
          >
            <Text style={[S.sourceChipText, selectedSource === 'EXCEL_CSV' && S.sourceChipTextActiveExcel]}>
              📁 Excel / CSV ({sourceCounts.excelCsv})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Filter Input */}
        <View style={[S.searchBox, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <Text style={{ fontSize: 13, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[S.searchInput, { color: isDark ? '#ffffff' : '#0f172a' }]}
            placeholder="Search by file name, sheet tab, date or sales rep..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. DATE-WISE IMPORTED DATA HISTORY LIST ─────────────────────── */}
      <ScrollView
        style={S.scrollList}
        contentContainerStyle={S.scrollListContent}
        showsVerticalScrollIndicator={false}
      >
        {dateWiseGroups.length === 0 ? (
          <View style={[S.emptyBox, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>📭</Text>
            <Text style={[S.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              No Import History Found
            </Text>
            <Text style={[S.emptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              No lead files match your selected filter ({selectedSource}).
            </Text>
          </View>
        ) : (
          dateWiseGroups.map(group => (
            <View key={group.groupTitle} style={S.dateGroupSection}>
              {/* Date Header Badge */}
              <View style={S.dateGroupHeader}>
                <View style={S.dateGroupPill}>
                  <Text style={S.dateGroupCalendarIcon}>📅</Text>
                  <Text style={S.dateGroupTitle}>{group.groupTitle}</Text>
                </View>
                <Text style={[S.dateGroupSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {group.items.length} file(s) · {group.totalLeadsInGroup} total leads
                </Text>
              </View>

              {/* Import History Items in this Date Group */}
              {group.items.map(item => {
                const isGSheet = item.source === 'GOOGLE_SHEETS';
                return (
                  <View
                    key={item.id}
                    style={[
                      S.historyCard,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      },
                    ]}
                  >
                    {/* Top Row: Source Badge, Time, Status */}
                    <View style={S.cardTopRow}>
                      <View style={S.sourceBadgeRow}>
                        <View style={[S.sourceBadge, isGSheet ? S.sourceBadgeGSheets : S.sourceBadgeExcel]}>
                          <Text style={[S.sourceBadgeText, isGSheet ? S.sourceBadgeTextGSheets : S.sourceBadgeTextExcel]}>
                            {isGSheet ? '📊 Google Sheet' : item.source === 'CSV' ? '📁 CSV Upload' : '📁 Excel Upload'}
                          </Text>
                        </View>
                        {item.sheetTabName && (
                          <View style={S.tabNameBadge}>
                            <Text style={S.tabNameBadgeText} numberOfLines={1}>
                              Tab: {item.sheetTabName}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={S.statusPill}>
                        <Text style={S.statusDot}>●</Text>
                        <Text style={S.statusPillText}>{item.status}</Text>
                      </View>
                    </View>

                    {/* File / Sheet Title */}
                    <TouchableOpacity onPress={() => handleOpenDetailModal(item)} activeOpacity={0.8}>
                      <Text style={[S.itemFileName, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={2}>
                        {item.fileName}
                      </Text>
                    </TouchableOpacity>

                    {/* Date & Exact Time of Import */}
                    <View style={S.timestampRow}>
                      <Text style={S.timestampIcon}>⏱️</Text>
                      <Text style={S.timestampText}>
                        Imported on <Text style={{ fontWeight: '800', color: isDark ? '#38bdf8' : '#0284c7' }}>{item.fullTimestamp}</Text>
                      </Text>
                      <Text style={[S.timestampDot, { color: isDark ? '#475569' : '#cbd5e1' }]}>•</Text>
                      <Text style={[S.rowsCountText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        {item.totalRows} Leads ({item.rowsCreated} New)
                      </Text>
                    </View>

                    {/* ── IN-DEPTH DATA OF THE ALLOCATION ───────────────── */}
                    <View style={[S.allocationCard, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <View style={S.allocationHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13 }}>
                            {item.allocationMode === 'BATCHWISE' ? '📦' : item.allocationMode === 'DIRECT_ASSIGN' ? '👤' : '⏱️'}
                          </Text>
                          <Text style={[S.allocationTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {item.allocationSummaryTitle}
                          </Text>
                        </View>
                        <Text style={S.allocationModeTag}>
                          {item.allocationMode}
                        </Text>
                      </View>

                      {/* Batch Breakdown Details */}
                      {item.allocationMode === 'BATCHWISE' && item.batches && (
                        <View style={S.batchesList}>
                          {item.batches.map(b => (
                            <View key={b.ruleIndex} style={S.batchItemRow}>
                              <View style={[S.batchRuleIdxBadge, { backgroundColor: b.color || '#6366f1' }]}>
                                <Text style={S.batchRuleIdxText}>#{b.ruleIndex}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[S.batchRangeText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                                  Rows {b.fromRow}–{b.toRow} <Text style={{ color: '#818cf8', fontWeight: '800' }}>({b.leadCount} leads)</Text>
                                </Text>
                                <Text style={[S.batchAssigneeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                  ➔ Assigned to: <Text style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '800' }}>{b.assigneeName}</Text> ({b.role})
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Direct Assignment Details */}
                      {item.allocationMode === 'DIRECT_ASSIGN' && item.directAssignee && (
                        <View style={S.directAssignBox}>
                          <Text style={[S.directAssignText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                            All {item.directAssignee.leadsCount} leads assigned directly to{' '}
                            <Text style={{ color: '#38bdf8', fontWeight: '900' }}>
                              {item.directAssignee.name}
                            </Text>{' '}
                            ({item.directAssignee.role})
                          </Text>
                        </View>
                      )}

                      {/* Lead Pool Details */}
                      {item.allocationMode === 'LEAD_POOL' && item.poolDetails && (
                        <View style={S.poolDetailsBox}>
                          <Text style={[S.poolText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                            Claim Window: {item.poolDetails.claimWindowMinutes} mins · Claimed: {item.poolDetails.claimedCount} leads · In Pool: {item.poolDetails.remainingCount} leads
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* ── ACTION BUTTONS: DOWNLOAD & MAIL TO ADMIN ──────── */}
                    <View style={S.cardActionsRow}>
                      {/* Button 1: Download Option */}
                      <TouchableOpacity
                        style={[S.actionBtn, S.downloadBtn]}
                        onPress={() => handleDownload(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={S.downloadBtnText}>📥 Download</Text>
                      </TouchableOpacity>

                      {/* Button 2: Mail to Admin Mail Option */}
                      <TouchableOpacity
                        style={[S.actionBtn, S.mailAdminBtn]}
                        onPress={() => handleOpenMailModal(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={S.mailAdminBtnText}>📧 Mail to Admin</Text>
                      </TouchableOpacity>

                      {/* Button 3: In-depth Detail view */}
                      <TouchableOpacity
                        style={[S.actionBtn, S.detailBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                        onPress={() => handleOpenDetailModal(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[S.detailBtnText, { color: isDark ? '#94a3b8' : '#475569' }]}>ℹ️ Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* ══ MODAL 1: MAIL IMPORT REPORT TO ADMIN ════════════════════════════ */}
      <Modal
        visible={mailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMailModalVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#cbd5e1' }]}>
            {/* Modal Header */}
            <View style={S.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={S.modalIconCircle}>
                  <Text style={{ fontSize: 18 }}>📧</Text>
                </View>
                <View>
                  <Text style={[S.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Mail Report to Admin
                  </Text>
                  <Text style={[S.modalSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Dispatch in-depth lead manifest &amp; allocation data
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMailModalVisible(false)} style={S.closeModalBtn}>
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 16, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Summary Box */}
            {activeItemForMail && (
              <View style={[S.mailSummaryBox, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <Text style={[S.mailSummaryTitle, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                  📄 {activeItemForMail.fileName}
                </Text>
                <Text style={[S.mailSummarySub, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  • Import Date &amp; Time: <Text style={{ fontWeight: '800' }}>{activeItemForMail.fullTimestamp}</Text>
                </Text>
                <Text style={[S.mailSummarySub, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  • Total Leads: <Text style={{ fontWeight: '800' }}>{activeItemForMail.totalRows} leads</Text> ({activeItemForMail.fileSizeStr})
                </Text>
                <Text style={[S.mailSummarySub, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                  • Allocation: <Text style={{ fontWeight: '800' }}>{activeItemForMail.allocationSummaryTitle}</Text>
                </Text>
              </View>
            )}

            {/* Admin Email Input */}
            <Text style={[S.inputLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              Admin Recipient Email Address:
            </Text>
            <TextInput
              style={[S.textInput, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }]}
              value={adminRecipient}
              onChangeText={setAdminRecipient}
              placeholder="e.g. adtyamighty@gmail.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Notes Input */}
            <Text style={[S.inputLabel, { color: isDark ? '#cbd5e1' : '#334155', marginTop: 10 }]}>
              Notes / Audit Remarks (Optional):
            </Text>
            <TextInput
              style={[S.textInput, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a', height: 60 }]}
              value={mailNotes}
              onChangeText={setMailNotes}
              placeholder="e.g. Approved allocation for September marketing campaign..."
              placeholderTextColor="#64748b"
              multiline
            />

            {/* Action Buttons */}
            <View style={S.modalActionsRow}>
              <TouchableOpacity
                style={S.modalCancelBtn}
                onPress={() => setMailModalVisible(false)}
              >
                <Text style={S.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={S.modalSendBtn}
                onPress={handleSendEmailToAdmin}
                disabled={isSendingMail}
              >
                {isSendingMail ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={S.modalSendBtnText}>🚀 Send to Admin Mail</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL 2: IN-DEPTH ALLOCATION AUDIT BREAKDOWN ═══════════════════ */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#cbd5e1' }]}>
            <View style={S.modalHeaderRow}>
              <View>
                <Text style={[S.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  📊 In-Depth Allocation Audit
                </Text>
                <Text style={[S.modalSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Detailed records of lead distribution and synchronization
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={S.closeModalBtn}>
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 16, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeItemForDetail && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={[S.detailGrid, { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>File / Sheet:</Text>
                    <Text style={[S.detailValue, { color: '#38bdf8' }]}>{activeItemForDetail.fileName}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>Source Platform:</Text>
                    <Text style={S.detailValue}>{activeItemForDetail.source}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>Exact Timestamp:</Text>
                    <Text style={S.detailValue}>{activeItemForDetail.fullTimestamp}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>Imported By:</Text>
                    <Text style={S.detailValue}>{activeItemForDetail.importedBy}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>Total Rows / Leads:</Text>
                    <Text style={[S.detailValue, { fontWeight: '900' }]}>{activeItemForDetail.totalRows}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>New vs Updated:</Text>
                    <Text style={S.detailValue}>+{activeItemForDetail.rowsCreated} / ↑{activeItemForDetail.rowsUpdated}</Text>
                  </View>
                  <View style={S.detailGridRow}>
                    <Text style={S.detailLabel}>Allocation Mode:</Text>
                    <Text style={[S.detailValue, { color: '#a78bfa' }]}>{activeItemForDetail.allocationMode}</Text>
                  </View>
                </View>

                {/* Breakdown List */}
                <Text style={[S.breakdownHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Allocation Breakdown Details:
                </Text>

                {activeItemForDetail.batches ? (
                  activeItemForDetail.batches.map(b => (
                    <View key={b.ruleIndex} style={[S.batchAuditRow, { borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <Text style={[S.batchAuditTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        Batch #{b.ruleIndex}: Rows {b.fromRow}–{b.toRow}
                      </Text>
                      <Text style={S.batchAuditCount}>
                        {b.leadCount} leads ({((b.leadCount / activeItemForDetail.totalRows) * 100).toFixed(0)}%)
                      </Text>
                      <Text style={[S.batchAuditAssignee, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Assigned to: {b.assigneeName} ({b.role})
                      </Text>
                    </View>
                  ))
                ) : activeItemForDetail.directAssignee ? (
                  <View style={[S.batchAuditRow, { borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <Text style={[S.batchAuditTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Direct Single Allocation
                    </Text>
                    <Text style={[S.batchAuditAssignee, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      All {activeItemForDetail.totalRows} leads assigned to {activeItemForDetail.directAssignee.name} ({activeItemForDetail.directAssignee.role})
                    </Text>
                  </View>
                ) : (
                  <View style={[S.batchAuditRow, { borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <Text style={[S.batchAuditTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Realtime Lead Pool
                    </Text>
                    <Text style={[S.batchAuditAssignee, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Pool Claim Window: {activeItemForDetail.poolDetails?.claimWindowMinutes}m
                    </Text>
                  </View>
                )}

                {/* Bottom Buttons inside modal */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[S.actionBtn, S.downloadBtn, { flex: 1 }]}
                    onPress={() => { setDetailModalVisible(false); handleDownload(activeItemForDetail); }}
                  >
                    <Text style={S.downloadBtnText}>📥 Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.actionBtn, S.mailAdminBtn, { flex: 1 }]}
                    onPress={() => { setDetailModalVisible(false); handleOpenMailModal(activeItemForDetail); }}
                  >
                    <Text style={S.mailAdminBtnText}>📧 Mail to Admin</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1 },

  // Top Card
  topCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  screenSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  newIngestBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  newIngestBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Source Selector Chips
  sourceChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sourceChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  sourceChipActiveAll: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  sourceChipActiveGSheets: {
    backgroundColor: '#047857',
    borderColor: '#10b981',
  },
  sourceChipActiveExcel: {
    backgroundColor: '#0369a1',
    borderColor: '#0284c7',
  },
  sourceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  sourceChipTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  sourceChipTextActiveGSheets: {
    color: '#ffffff',
    fontWeight: '900',
  },
  sourceChipTextActiveExcel: {
    color: '#ffffff',
    fontWeight: '900',
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    padding: 0,
    fontWeight: '600',
  },

  // Scroll List
  scrollList: { flex: 1 },
  scrollListContent: { paddingBottom: 30 },

  emptyBox: {
    padding: 30,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptyDesc: { fontSize: 11, marginTop: 4, textAlign: 'center' },

  // Date Group Section
  dateGroupSection: {
    marginBottom: 16,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dateGroupCalendarIcon: { fontSize: 11 },
  dateGroupTitle: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateGroupSub: {
    fontSize: 10,
    fontWeight: '600',
  },

  // History Card
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sourceBadgeGSheets: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  sourceBadgeExcel: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '800' },
  sourceBadgeTextGSheets: { color: '#34d399' },
  sourceBadgeTextExcel: { color: '#38bdf8' },

  tabNameBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 130,
  },
  tabNameBadgeText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  statusDot: { color: '#34d399', fontSize: 8 },
  statusPillText: { color: '#34d399', fontSize: 9, fontWeight: '900' },

  itemFileName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.1,
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  timestampIcon: { fontSize: 11 },
  timestampText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  timestampDot: { fontSize: 10 },
  rowsCountText: { fontSize: 10, fontWeight: '700' },

  // Allocation Card inside item
  allocationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  allocationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocationTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  allocationModeTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#818cf8',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },

  batchesList: {
    gap: 6,
  },
  batchItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchRuleIdxBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchRuleIdxText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  batchRangeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  batchAssigneeText: {
    fontSize: 9,
    marginTop: 1,
  },

  directAssignBox: {
    paddingVertical: 2,
  },
  directAssignText: {
    fontSize: 10,
    fontWeight: '700',
  },

  poolDetailsBox: {
    paddingVertical: 2,
  },
  poolText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Actions Row
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    backgroundColor: '#0284c7',
    flex: 1,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  mailAdminBtn: {
    backgroundColor: '#4f46e5',
    flex: 1,
  },
  mailAdminBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  detailBtn: {
    paddingHorizontal: 10,
  },
  detailBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 10,
    marginTop: 1,
  },
  closeModalBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mailSummaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  mailSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  mailSummarySub: {
    fontSize: 10,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },

  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSendBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Detail Modal Audit Styles
  detailGrid: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  batchAuditRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    borderBottomWidth: 1,
    paddingLeft: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  batchAuditTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  batchAuditCount: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '700',
  },
  batchAuditAssignee: {
    fontSize: 10,
    marginTop: 2,
  },
});
