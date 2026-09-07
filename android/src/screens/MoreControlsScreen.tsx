import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductsCatalogScreen from './ProductsCatalogScreen';
import CommunicationScreen from './CommunicationScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';
import { AiCustomizationScreen } from './AiCustomizationScreen';
import { AIHubScreen } from './AIHubScreen';
import { QuotationsInvoicesScreen } from './QuotationsInvoicesScreen';
import { PdfCatalogueScreen } from './PdfCatalogueScreen';
import { DealsPipelineScreen } from './DealsPipelineScreen';
import { ReportsAnalyticsScreen } from './ReportsAnalyticsScreen';
import { WorkflowAutomationsScreen } from './WorkflowAutomationsScreen';
import WorkflowBuilderScreen from './WorkflowBuilderScreen';
import EmailMarketingScreen from './EmailMarketingScreen';
import { BulkIngestionScreen } from './BulkIngestionScreen';
import AttendanceScreen from './AttendanceScreen';
import ProfileScreen from './ProfileScreen';
import NoticeBoardScreen from './NoticeBoardScreen';
import AppSettingsScreen from './AppSettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export type ModuleKey =
  | 'PRODUCTS'
  | 'QUOTES'
  | 'COMMUNICATIONS'
  | 'WA_TEMPLATES'
  | 'EXTRA_EMAIL'
  | 'AI_CONTROL'
  | 'AI_HUB'
  | 'PDF_CATALOG'
  | 'REPORTS'
  | 'AUTOMATIONS'
  | 'IMPORT_EXPORT'
  | 'ATTENDANCE'
  | 'DEALS'
  | 'GOALS'
  | 'INTERVIEWS'
  | 'UPCOMING_COMMS'
  | 'SETTINGS'
  | 'PROFILE'
  | 'SUPPORT';

interface MoreControlsScreenProps {
  navigation?: any;
  route?: { params?: { initialModule?: string } };
  onOpenProductsCatalog?: () => void;
  onOpenProfile?: () => void;
  onOpenAppUpdates?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export const MoreControlsScreen: React.FC<MoreControlsScreenProps> = ({
  navigation,
  route,
  onOpenProductsCatalog,
  onOpenProfile,
}) => {
  const [activeModal, setActiveModal] = useState<ModuleKey | null>(null);
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const closeModal = () => {
    setActiveModal(null);
    if (route?.params?.initialModule) {
      try {
        navigation?.setParams({ initialModule: undefined });
      } catch {}
    }
  };

  // Android hardware back press listener to close sub-screens
  useEffect(() => {
    const onBackPress = () => {
      if (activeModal !== null) {
        closeModal();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeModal]);

  useEffect(() => {
    const initMod = route?.params?.initialModule;
    if (initMod) {
      if (initMod === 'DEALS' || initMod === 'PIPELINE') setActiveModal('DEALS');
      else if (initMod === 'COMMUNICATIONS' || initMod === 'COMMS') setActiveModal('COMMUNICATIONS');
      else if (initMod === 'QUOTATIONS' || initMod === 'QUOTES') setActiveModal('QUOTES');
      else if (initMod === 'REPORTS') setActiveModal('REPORTS');
      else if (initMod === 'GOALS') setActiveModal('GOALS');
      else if (initMod === 'ATTENDANCE') setActiveModal('ATTENDANCE');
      else if (initMod === 'PROFILE' || initMod === 'SALARY') setActiveModal('PROFILE');
      else if (initMod === 'EMPLOYEES') setActiveModal('INTERVIEWS');
      else if (initMod === 'AI_HUB') setActiveModal('AI_HUB');
      else if (initMod === 'AI_CONTROL' || initMod === 'AI_CUSTOMIZATION') setActiveModal('AI_CONTROL');
      else if (initMod === 'AUTOMATIONS' || initMod === 'WORKFLOW') setActiveModal('AUTOMATIONS');
    }
  }, [route?.params?.initialModule]);

  const handleOpenModule = (key: ModuleKey) => {
    if (key === 'PRODUCTS' && onOpenProductsCatalog) {
      onOpenProductsCatalog();
    } else if (key === 'PROFILE' && onOpenProfile) {
      onOpenProfile();
    } else {
      setActiveModal(key);
    }
  };

  // 19 Navigation Items in Exact Specified Order
  const GRID_BUTTONS: { key: ModuleKey; icon: string; label: string; upcoming?: boolean }[] = [
    { key: 'PRODUCTS', icon: '📦', label: 'Product Catalogue' },
    { key: 'QUOTES', icon: '📝', label: 'Quotations & Invoices' },
    { key: 'COMMUNICATIONS', icon: '☁️', label: 'WhatsApp Cloud' },
    { key: 'WA_TEMPLATES', icon: '✏️', label: 'WhatsApp Direct Templates' },
    { key: 'EXTRA_EMAIL', icon: '🚀', label: 'Email Marketing' },
    { key: 'AI_CONTROL', icon: '🤖', label: 'AI Customization' },
    { key: 'AI_HUB', icon: '🧠', label: 'AI Hub' },
    { key: 'PDF_CATALOG', icon: '📄', label: 'PDF Catalogue' },
    { key: 'REPORTS', icon: '📊', label: 'Reports & Analytics' },
    { key: 'AUTOMATIONS', icon: '⚡', label: 'Workflow & Automations' },
    { key: 'IMPORT_EXPORT', icon: '📥', label: 'Lead Import History' },
    { key: 'ATTENDANCE', icon: '⏱️', label: 'Attendance' },
    { key: 'DEALS', icon: '💼', label: 'Deals' },
    { key: 'GOALS', icon: '📈', label: 'Goals & Targets' },
    { key: 'INTERVIEWS', icon: '👤', label: 'Interview for Hiring' },
    { key: 'UPCOMING_COMMS', icon: '📌', label: 'The Notice Board' },
    { key: 'SETTINGS', icon: '⚙️', label: 'Settings' },
    { key: 'PROFILE', icon: '🏢', label: 'Company Profile Settings' },
    { key: 'SUPPORT', icon: '❓', label: 'Support' },
  ];

  const getModuleLabel = (key: ModuleKey, defaultLabel: string): string => {
    switch (key) {
      case 'PRODUCTS': return t.modProducts || defaultLabel;
      case 'QUOTES': return t.modQuotes || defaultLabel;
      case 'COMMUNICATIONS': return t.modComms || defaultLabel;
      case 'WA_TEMPLATES': return t.modWaTemplates || defaultLabel;
      case 'EXTRA_EMAIL': return t.modEmail || defaultLabel;
      case 'AI_CONTROL': return t.modAiControl || defaultLabel;
      case 'AI_HUB': return t.modAiHub || defaultLabel;
      case 'PDF_CATALOG': return t.modPdfCatalog || defaultLabel;
      case 'REPORTS': return t.modReports || defaultLabel;
      case 'AUTOMATIONS': return t.modAutomations || defaultLabel;
      case 'IMPORT_EXPORT': return t.modImportExport || defaultLabel;
      case 'ATTENDANCE': return t.modAttendance || defaultLabel;
      case 'DEALS': return t.modDeals || defaultLabel;
      case 'GOALS': return t.modGoals || defaultLabel;
      case 'INTERVIEWS': return t.modInterviews || defaultLabel;
      case 'UPCOMING_COMMS': return t.modNoticeBoard || defaultLabel;
      case 'SETTINGS': return t.modSettings || defaultLabel;
      case 'PROFILE': return t.modProfile || defaultLabel;
      case 'SUPPORT': return t.modSupport || defaultLabel;
      default: return defaultLabel;
    }
  };

  const renderBackBanner = (titleStr: string) => (
    <View style={[styles.backBanner, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={closeModal}
        style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Text style={[styles.backBtnText, { color: colors.primary }]}>{t.backToMenu || '← Back to Menu'}</Text>
      </TouchableOpacity>
      <Text style={[styles.backTitle, { color: colors.text }]}>{titleStr}</Text>
    </View>
  );

  if (activeModal !== null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 0 }}>
        {activeModal === 'PRODUCTS' && <ProductsCatalogScreen onClose={closeModal} />}
        {activeModal === 'COMMUNICATIONS' && <CommunicationScreen onClose={closeModal} />}
        {activeModal === 'WA_TEMPLATES' && <WhatsAppTemplatesScreen onClose={closeModal} />}
        {activeModal === 'AI_CONTROL' && <AiCustomizationScreen onClose={closeModal} />}
        {activeModal === 'AI_HUB' && <AIHubScreen onClose={closeModal} />}
        {activeModal === 'QUOTES' && <QuotationsInvoicesScreen onClose={closeModal} />}
        {activeModal === 'PDF_CATALOG' && <PdfCatalogueScreen onClose={closeModal} />}
        {activeModal === 'DEALS' && <DealsPipelineScreen onClose={closeModal} />}
        {activeModal === 'REPORTS' && <ReportsAnalyticsScreen onClose={closeModal} />}
        {activeModal === 'AUTOMATIONS' && <WorkflowAutomationsScreen onClose={closeModal} navigation={navigation} />}
        {activeModal === 'EXTRA_EMAIL' && <EmailMarketingScreen onClose={closeModal} />}
        {activeModal === 'IMPORT_EXPORT' && <BulkIngestionScreen onClose={closeModal} />}
        {activeModal === 'PROFILE' && <ProfileScreen onClose={closeModal} />}
        
        {activeModal === 'ATTENDANCE' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Attendance & Punch Logs')}
            <AttendanceScreen onClose={closeModal} />
          </View>
        )}

        {activeModal === 'GOALS' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Goals & Target KPI Audits')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.kpiTitle, { color: colors.text }]}>📈 Team Sales Goals (Aug 2026)</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Monthly targets across reps & departments</Text>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                {[
                  { rep: 'Rajesh Kumar (Sales Exec)', target: '₹10,00,000', achieved: '₹8,40,000', pct: 84, color: '#22c55e' },
                  { rep: 'Amit Verma (Sales Exec)', target: '₹8,50,000', achieved: '₹6,10,000', pct: 71, color: '#38bdf8' },
                  { rep: 'Priya Sharma (Sales Exec)', target: '₹9,00,000', achieved: '₹4,50,000', pct: 50, color: '#eab308' },
                  { rep: 'Neha Joshi (Team Leader)', target: '₹25,00,000', achieved: '₹21,80,000', pct: 87, color: '#a855f7' },
                ].map((g, idx) => (
                  <View key={idx} style={[styles.goalRowCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.goalRepName, { color: colors.text }]}>{g.rep}</Text>
                      <Text style={[styles.goalPct, { color: g.color }]}>{g.pct}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${g.pct}%`, backgroundColor: g.color }]} />
                    </View>
                    <Text style={[styles.goalMetricText, { color: colors.textMuted }]}>{g.achieved} / {g.target}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Target Config', 'Opening KPI allocation editor...')}>
                <Text style={styles.actionBtnText}>+ Set New Team Target</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {activeModal === 'INTERVIEWS' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Hiring & Candidate Pipeline')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.kpiTitle, { color: colors.text }]}>👤 Active Candidate Pipeline</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Track scheduled interviews, scores, and candidate statuses</Text>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                {[
                  { name: 'Karan Malhotra', role: 'Sales Executive', status: 'Round 2 Tech Demo', score: '8.5 / 10', interviewer: 'Vikram Mehta' },
                  { name: 'Ananya Roy', role: 'Team Leader (Inside Sales)', status: 'Final HR Discussion', score: '9.1 / 10', interviewer: 'Suresh Patil' },
                  { name: 'Rohan Gupta', role: 'Account Manager', status: 'Offer Letter Pending', score: '8.8 / 10', interviewer: 'Rajesh Sharma' },
                ].map((cand, idx) => (
                  <View key={idx} style={[styles.goalRowCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.goalRepName, { color: colors.text }]}>{cand.name}</Text>
                      <View style={[styles.statusPill, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                        <Text style={{ color: '#818cf8', fontSize: 9, fontWeight: '800' }}>{cand.status}</Text>
                      </View>
                    </View>

                    <Text style={[styles.goalMetricText, { color: colors.textMuted }]}>Role: {cand.role} · Interviewer: {cand.interviewer}</Text>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 4 }}>Score: {cand.score}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Schedule Interview', 'Opening candidate scheduler...')}>
                <Text style={styles.actionBtnText}>+ Schedule New Candidate Interview</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {activeModal === 'UPCOMING_COMMS' && (
          <NoticeBoardScreen onClose={closeModal} />
        )}

        {activeModal === 'SETTINGS' && (
          <AppSettingsScreen onClose={closeModal} />
        )}

        {activeModal === 'SUPPORT' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('DAS CRM Support & Help Desk')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.kpiTitle, { color: colors.text }]}>❓ Support & Help Desk</Text>
                <Text style={[styles.kpiSub, { color: colors.textMuted }]}>24/7 Priority support, documentation, and live chat</Text>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[styles.goalRowCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => Alert.alert('Live Chat', 'Connecting to DAS CRM Support Engineer...')}>
                  <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: '800' }}>💬 Start Live Chat Support</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Instant 24/7 assistance from tech support engineers</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.goalRowCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => Alert.alert('Helpline', 'Toll Free: +91 1800-DAS-CRM (327-276)')}>
                  <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '800' }}>📞 Priority Phone Helpline</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Call +91 1800-DAS-CRM for immediate resolution</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.goalRowCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => Alert.alert('User Guide', 'Opening interactive documentation...')}>
                  <Text style={{ color: '#c084fc', fontSize: 13, fontWeight: '800' }}>📄 User Manual & Documentation</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Step-by-step setup guides for all 18 modules</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 10 }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.menuTitle}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{t.menuSub}</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{t.modulesCountBadge}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {GRID_BUTTONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.gridCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => handleOpenModule(item.key)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                {item.upcoming && (
                  <View style={styles.upcomingTag}>
                    <Text style={styles.upcomingTagText}>UPCOMING</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardLabel, { color: colors.text }]} numberOfLines={2}>
                {getModuleLabel(item.key, item.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default MoreControlsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  badgePill: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)' },
  badgePillText: { color: '#818cf8', fontSize: 10, fontWeight: '900' },

  scrollContent: { padding: 14, paddingBottom: 30, alignItems: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 500 },

  // Medium Responsive Card Dimensions
  gridCard: {
    width: '48%',
    minHeight: 76,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  cardIcon: { fontSize: 22, marginBottom: 4 },
  cardLabel: { fontSize: 11.5, fontWeight: '800', color: '#e2e8f0', lineHeight: 15 },

  upcomingTag: { backgroundColor: 'rgba(251,191,36,0.18)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  upcomingTagText: { color: '#fbbf24', fontSize: 8, fontWeight: '900' },

  // Back Banner for screens
  backBanner: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  backTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900', flex: 1 },

  // Custom Screen Cards & Buttons
  kpiCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  kpiTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  kpiSub: { color: '#94a3b8', fontSize: 11, marginTop: 4 },

  goalRowCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  goalRepName: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  goalPct: { fontSize: 12, fontWeight: '900' },
  goalMetricText: { color: '#94a3b8', fontSize: 11, marginTop: 4 },

  progressBarTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

  actionBtn: { marginTop: 16, width: '100%', backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  settingRow: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
});
