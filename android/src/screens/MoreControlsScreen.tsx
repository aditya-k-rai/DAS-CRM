import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import ProductsCatalogScreen from './ProductsCatalogScreen';
import { CommunicationScreen } from './CommunicationScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';
import { AiCustomizationScreen } from './AiCustomizationScreen';
import { QuotationsInvoicesScreen } from './QuotationsInvoicesScreen';
import { PdfCatalogueScreen } from './PdfCatalogueScreen';
import { DealsPipelineScreen } from './DealsPipelineScreen';
import { ReportsAnalyticsScreen } from './ReportsAnalyticsScreen';
import { WorkflowAutomationsScreen } from './WorkflowAutomationsScreen';
import { EmailMarketingScreen } from './EmailMarketingScreen';
import { BulkIngestionScreen } from './BulkIngestionScreen';

export type ModuleKey =
  | 'PRODUCTS'
  | 'COMMUNICATIONS'
  | 'WA_TEMPLATES'
  | 'AI_CONTROL'
  | 'QUOTES'
  | 'PDF_CATALOG'
  | 'DEALS'
  | 'REPORTS'
  | 'AUTOMATIONS'
  | 'EXTRA_EMAIL'
  | 'IMPORT_EXPORT';

interface MoreControlsScreenProps {
  route?: { params?: { initialModule?: string } };
  onOpenProductsCatalog?: () => void;
  onOpenProfile?: () => void;
  onOpenAppUpdates?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export const MoreControlsScreen: React.FC<MoreControlsScreenProps> = ({
  route,
  onOpenProductsCatalog,
  onOpenProfile,
  onOpenAppUpdates,
}) => {
  const [activeModal, setActiveModal] = useState<ModuleKey | null>(null);

  useEffect(() => {
    const initMod = route?.params?.initialModule;
    if (initMod) {
      if (initMod === 'DEALS') setActiveModal('DEALS');
      else if (initMod === 'COMMUNICATIONS' || initMod === 'COMMS') setActiveModal('COMMUNICATIONS');
      else if (initMod === 'QUOTATIONS') setActiveModal('QUOTES');
    }
  }, [route?.params?.initialModule]);

  const handleOpenModule = (key: ModuleKey) => {
    if (key === 'PRODUCTS' && onOpenProductsCatalog) {
      onOpenProductsCatalog();
    } else {
      setActiveModal(key);
    }
  };

  const GRID_BUTTONS: { key: ModuleKey; icon: string; label: string }[] = [
    { key: 'PRODUCTS', icon: '📦', label: 'Products Catalog' },
    { key: 'COMMUNICATIONS', icon: '💬', label: 'Communication' },
    { key: 'WA_TEMPLATES', icon: '✏️', label: 'WhatsApp Direct Templates' },
    { key: 'AI_CONTROL', icon: '🤖', label: 'Ai Customization' },
    { key: 'QUOTES', icon: '📝', label: 'Quotations & Invoices' },
    { key: 'PDF_CATALOG', icon: '📄', label: 'Pdf Catalogue' },
    { key: 'DEALS', icon: '💼', label: 'Deals Pipeline' },
    { key: 'REPORTS', icon: '📊', label: 'In-Depth Reports & Analytics' },
    { key: 'AUTOMATIONS', icon: '⚡', label: 'Workflow Automations & Bot Rules' },
    { key: 'EXTRA_EMAIL', icon: '📧', label: 'Extra Features , Like Email Marketing' },
    { key: 'IMPORT_EXPORT', icon: '📥', label: 'Bulk CSV, Excel & G-Sheets Ingestion' },
  ];

  // Dedicated Full-Screen Screen Switcher
  if (activeModal !== null) {
    return (
      <View style={styles.container}>
        {activeModal === 'PRODUCTS' && <ProductsCatalogScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'COMMUNICATIONS' && <CommunicationScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'WA_TEMPLATES' && <WhatsAppTemplatesScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'AI_CONTROL' && <AiCustomizationScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'QUOTES' && <QuotationsInvoicesScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'PDF_CATALOG' && <PdfCatalogueScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'DEALS' && <DealsPipelineScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'REPORTS' && <ReportsAnalyticsScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'AUTOMATIONS' && <WorkflowAutomationsScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'EXTRA_EMAIL' && <EmailMarketingScreen onClose={() => setActiveModal(null)} />}
        {activeModal === 'IMPORT_EXPORT' && <BulkIngestionScreen onClose={() => setActiveModal(null)} />}
      </View>
    );
  }

  // Operations Directory Grid View (Default)
  return (
    <View style={styles.container}>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Operations Control Center</Text>
        <Text style={styles.headerSub}>Tap any section button below for in-depth and detailed control inside.</Text>
      </View>

      {/* ── 2-COLUMN GRID OF BUTTONS (MATCHING USER DIAGRAM) ───────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {GRID_BUTTONS.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={styles.gridBtnCard}
              onPress={() => handleOpenModule(btn.key)}
              activeOpacity={0.78}
            >
              <Text style={styles.gridBtnIcon}>{btn.icon}</Text>
              <Text style={styles.gridBtnLabel}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account & App Shortcuts */}
        <View style={styles.accountBar}>
          <TouchableOpacity
            style={styles.accShortcutBtn}
            onPress={() => onOpenProfile?.()}
            activeOpacity={0.8}
          >
            <Text style={styles.accShortcutText}>👤 User Profile &amp; Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accShortcutBtn}
            onPress={() => onOpenAppUpdates?.()}
            activeOpacity={0.8}
          >
            <Text style={styles.accShortcutText}>🚀 In-App Version (v2.5.0)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  headerArea: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#94a3b8', marginTop: 3 },
  scrollContent: { padding: 14, paddingBottom: 32 },

  // 2-Column Grid Layout matching user diagram
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridBtnCard: {
    width: '48.5%',
    backgroundColor: '#0c1827',
    borderWidth: 1.5,
    borderColor: '#00d2d3',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  gridBtnIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  gridBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14,
  },

  accountBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  accShortcutBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  accShortcutText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
});

export default MoreControlsScreen;
