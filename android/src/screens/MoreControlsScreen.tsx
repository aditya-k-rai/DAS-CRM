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
import AttendanceScreen from './AttendanceScreen';
import ProfileScreen from './ProfileScreen';
import NoticeBoardScreen from './NoticeBoardScreen';

export type ModuleKey =
  | 'PRODUCTS'
  | 'QUOTES'
  | 'COMMUNICATIONS'
  | 'WA_TEMPLATES'
  | 'EXTRA_EMAIL'
  | 'AI_CONTROL'
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
}) => {
  const [activeModal, setActiveModal] = useState<ModuleKey | null>(null);
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);

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

  // 18 Navigation Items in Exact Specified Order
  const GRID_BUTTONS: { key: ModuleKey; icon: string; label: string; upcoming?: boolean }[] = [
    { key: 'PRODUCTS', icon: '📦', label: 'Product Catalogue' },
    { key: 'QUOTES', icon: '📝', label: 'Quotations & Invoices' },
    { key: 'COMMUNICATIONS', icon: '☁️', label: 'WhatsApp Cloud' },
    { key: 'WA_TEMPLATES', icon: '✏️', label: 'WhatsApp Direct Templates' },
    { key: 'EXTRA_EMAIL', icon: '🚀', label: 'Email Marketing' },
    { key: 'AI_CONTROL', icon: '🤖', label: 'AI Customization' },
    { key: 'PDF_CATALOG', icon: '📄', label: 'PDF Catalogue' },
    { key: 'REPORTS', icon: '📊', label: 'Reports & Analytics' },
    { key: 'AUTOMATIONS', icon: '⚡', label: 'Workflow Automations' },
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

  // Helper Header Banner for Full-Screen Modals
  const renderBackBanner = (titleStr: string) => (
    <View style={styles.backBanner}>
      <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back to Menu</Text>
      </TouchableOpacity>
      <Text style={styles.backTitle}>{titleStr}</Text>
    </View>
  );

  // Active Screen Renderer
  if (activeModal !== null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090d16', paddingTop: topPadding }}>
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
        {activeModal === 'PROFILE' && <ProfileScreen onClose={() => setActiveModal(null)} />}
        
        {activeModal === 'ATTENDANCE' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Attendance & Punch Logs')}
            <AttendanceScreen />
          </View>
        )}

        {/* 📈 13. Goals & Targets Screen */}
        {activeModal === 'GOALS' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Goals & Target KPI Audits')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>📈 Team Sales Goals (Aug 2026)</Text>
                <Text style={styles.kpiSub}>Track individual target progress & rep performance leaderboard</Text>
              </View>

              <View style={{ gap: 12, marginTop: 12 }}>
                {[
                  { name: 'Amit Shah (Manager)', metric: 'Deals Closed', target: 30, achieved: 25, color: '#6366f1' },
                  { name: 'Rajesh Kumar (Sales Exec)', metric: 'Closed Revenue', target: 15, achieved: 12, color: '#22c55e' },
                  { name: 'Sunita Verma (HR/Ops)', metric: 'Employee Audits', target: 24, achieved: 24, color: '#ec4899' },
                  { name: 'Priya Sharma (Outbound)', metric: 'Lead Calls', target: 200, achieved: 165, color: '#38bdf8' },
                  { name: 'Amit Patel (SMB Sales)', metric: 'Won Deals', target: 15, achieved: 8, color: '#f59e0b' },
                ].map((item, idx) => {
                  const pct = Math.round((item.achieved / item.target) * 100);
                  return (
                    <View key={idx} style={styles.goalRowCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.goalRepName}>{item.name}</Text>
                        <Text style={[styles.goalPct, { color: item.color }]}>{pct}% Achieved</Text>
                      </View>

                      <Text style={styles.goalMetricText}>Metric: {item.metric} · {item.achieved} / {item.target}</Text>

                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Add Goal', 'Goal configuration dialog launched.')}>
                <Text style={styles.actionBtnText}>+ Assign New Goal to Employee</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* 👤 14. Interview for Hiring Screen */}
        {activeModal === 'INTERVIEWS' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('Interview & Candidate Hiring Portal')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>👤 Candidate Hiring Pipeline</Text>
                <Text style={styles.kpiSub}>3 Scheduled Interviews Today · 14 Applicants Pending</Text>
              </View>

              <View style={{ gap: 12, marginTop: 12 }}>
                {[
                  { name: 'Ananya Rao', role: 'Senior Sales Executive', interviewer: 'Rajesh Mehta', status: 'Offer Sent', score: '9.2 / 10', badgeColor: '#22c55e' },
                  { name: 'Rohan Sharma', role: 'Inside Sales Specialist', interviewer: 'Sunita Verma', status: 'Scheduled 02:30 PM Today', score: 'Pending', badgeColor: '#38bdf8' },
                  { name: 'Kavita Patel', role: 'Key Account Manager', interviewer: 'Amit Shah', status: 'Round 2 Tech Evaluation', score: '8.5 / 10', badgeColor: '#f59e0b' },
                  { name: 'Vikram Rao', role: 'Enterprise Account Exec', interviewer: 'Neha Joshi', status: 'Interview Completed', score: '8.8 / 10', badgeColor: '#c084fc' },
                ].map((cand, idx) => (
                  <View key={idx} style={styles.goalRowCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.goalRepName}>{cand.name}</Text>
                      <View style={[styles.statusPill, { backgroundColor: cand.badgeColor + '20', borderColor: cand.badgeColor + '40' }]}>
                        <Text style={{ color: cand.badgeColor, fontSize: 10, fontWeight: '800' }}>{cand.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.goalMetricText}>Role: {cand.role} · Interviewer: {cand.interviewer}</Text>
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', marginTop: 4 }}>Score: {cand.score}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Schedule Interview', 'Opening candidate scheduler...')}>
                <Text style={styles.actionBtnText}>+ Schedule New Candidate Interview</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* 📌 15. The Notice Board Screen */}
        {activeModal === 'UPCOMING_COMMS' && (
          <NoticeBoardScreen onClose={() => setActiveModal(null)} />
        )}

        {/* ⚙️ 16. Settings Screen */}
        {activeModal === 'SETTINGS' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('System & App Preferences')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>⚙️ Workspace Settings</Text>
                <Text style={styles.kpiSub}>Configure notifications, offline sync, security & API credentials</Text>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>🔔 Push Notification Alerts</Text>
                  <Switch value={true} onValueChange={() => {}} />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>🌙 Dark Mode Theme</Text>
                  <Switch value={true} onValueChange={() => {}} />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>🔒 Biometric / Passcode Lock</Text>
                  <Switch value={true} onValueChange={() => {}} />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>📍 High Accuracy GPS Telemetry</Text>
                  <Switch value={true} onValueChange={() => {}} />
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Settings Saved', 'Preferences updated successfully.')}>
                <Text style={styles.actionBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ❓ 18. Support Screen */}
        {activeModal === 'SUPPORT' && (
          <View style={{ flex: 1 }}>
            {renderBackBanner('DAS CRM Support & Help Desk')}
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>❓ Support & Help Desk</Text>
                <Text style={styles.kpiSub}>24/7 Priority support, documentation, and live chat</Text>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={styles.goalRowCard} onPress={() => Alert.alert('Live Chat', 'Connecting to DAS CRM Support Engineer...')}>
                  <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: '800' }}>💬 Start Live Chat Support</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Instant 24/7 assistance from tech support engineers</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.goalRowCard} onPress={() => Alert.alert('Helpline', 'Toll Free: +91 1800-DAS-CRM (327-276)')}>
                  <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '800' }}>📞 Priority Phone Helpline</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Call +91 1800-DAS-CRM for immediate resolution</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.goalRowCard} onPress={() => Alert.alert('User Guide', 'Opening interactive documentation...')}>
                  <Text style={{ color: '#c084fc', fontSize: 13, fontWeight: '800' }}>📄 User Manual & Documentation</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Step-by-step setup guides for all 18 modules</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Enterprise Workspace Menu</Text>
          <Text style={styles.headerSub}>Access all 18 modules & system toolkits</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>18 MODULES</Text>
        </View>
      </View>

      {/* 18 Medium-Sized Responsive Grid Buttons in Specified Exact Order */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {GRID_BUTTONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.gridCard}
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
              <Text style={styles.cardLabel} numberOfLines={2}>{item.label}</Text>
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
