import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductsCatalogScreen from './ProductsCatalogScreen';
import CommunicationScreen from './CommunicationScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';
import { AiCustomizationScreen } from './AiCustomizationScreen';
import { QuotationsInvoicesScreen } from './QuotationsInvoicesScreen';
import { PdfCatalogueScreen } from './PdfCatalogueScreen';
import { DealsPipelineScreen } from './DealsPipelineScreen';
import { ReportsAnalyticsScreen } from './ReportsAnalyticsScreen';
import { WorkflowAutomationsScreen } from './WorkflowAutomationsScreen';
import EmailMarketingScreen from './EmailMarketingScreen';
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
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);

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

  if (activeModal !== null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090d16' }}>
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

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enterprise Workspace Controls</Text>
        <Text style={styles.headerSub}>Access all 11 modules and system toolkits</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {GRID_BUTTONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.gridCard}
              onPress={() => handleOpenModule(item.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {onOpenProfile && (
          <TouchableOpacity style={styles.systemBtn} onPress={onOpenProfile}>
            <Text style={styles.systemBtnText}>👤 Open Profile &amp; Bank Settings</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default MoreControlsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  backBanner: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBannerText: { color: '#38bdf8', fontWeight: '800', fontSize: 12 },

  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#0f172a' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  scrollContent: { padding: 16, alignItems: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 500 },
  gridCard: { width: '48%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 24, marginBottom: 6 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: '#cbd5e1', textAlign: 'center' },

  systemBtn: { marginTop: 16, width: '100%', maxWidth: 500, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  systemBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
});
