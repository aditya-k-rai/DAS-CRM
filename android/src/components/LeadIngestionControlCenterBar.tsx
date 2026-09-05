/**
 * LeadIngestionControlCenterBar.tsx — DAS CRM Android
 * Lead Integration & Ingestion Control Center Banner
 * Matches Web TenantAdminDashboard / LeadFunnel Control Center
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface LeadIngestionControlCenterBarProps {
  onInsertLeadPress?: () => void;
  onImportCsvPress?: () => void;
  onGoogleSheetsPress?: () => void;
  onExportCsvPress?: () => void;
  onCustomColumnPress?: () => void;
  onAdjustColumnsPress?: () => void;
  columnCount?: number;
}

export function LeadIngestionControlCenterBar({
  onInsertLeadPress,
  onImportCsvPress,
  onGoogleSheetsPress,
  onExportCsvPress,
  onCustomColumnPress,
  onAdjustColumnsPress,
  columnCount = 11,
}: LeadIngestionControlCenterBarProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Header Section */}
      <View style={styles.headerBlock}>
        {/* Top Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.purplePill}>
            <Text style={styles.purplePillText}>⚡ INTEGRATION & DATA HUB</Text>
          </View>

          <View style={styles.greenPill}>
            <Text style={styles.greenPillText}>5 ACTIVE CHANNELS</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.titleText}>🛢️ Lead Integration & Ingestion Control Center</Text>

        {/* Subtitle */}
        <Text style={styles.subtitleText}>
          Integrate Webhooks, Insert Single Lead, Import/Export CSV, Configure Custom Columns & Adjust Lead Table Views
        </Text>
      </View>

      {/* Action Buttons Toolbar */}
      <View style={styles.toolbarContainer}>
        {/* Row 1 Actions */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.btnInsertLead}
            onPress={onInsertLeadPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnInsertLeadText}>👤 + Insert Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnImportCsv}
            onPress={onImportCsvPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnImportCsvText}>📥 Import CSV / Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSheetsSync}
            onPress={onGoogleSheetsPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSheetsSyncText}>📊 Google Sheets Sync</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnExportCsv}
            onPress={onExportCsvPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnExportCsvText}>📤 Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 Actions */}
        <View style={[styles.buttonRow, { marginTop: 6 }]}>
          <TouchableOpacity
            style={styles.btnCustomCol}
            onPress={onCustomColumnPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnCustomColText}>📐 + Custom Column</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnAdjustCols}
            onPress={onAdjustColumnsPress}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAdjustColsText}>🎛️ Adjust Columns ({columnCount})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#090e1c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  purplePill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  purplePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#a5b4fc',
    letterSpacing: 0.4,
  },
  greenPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  greenPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.4,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 14,
  },
  toolbarContainer: {
    gap: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  btnInsertLead: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInsertLeadText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  btnImportCsv: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnImportCsvText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#c084fc',
  },
  btnSheetsSync: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSheetsSyncText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34d399',
  },
  btnExportCsv: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExportCsvText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2dd4bf',
  },
  btnCustomCol: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCustomColText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#22d3ee',
  },
  btnAdjustCols: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAdjustColsText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#e2e8f0',
  },
});
