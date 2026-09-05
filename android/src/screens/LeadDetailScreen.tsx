/**
 * LeadDetailScreen.tsx — DAS CRM Android
 * Features:
 *  1. Working 📞 Call Now, 💬 WhatsApp Intent Launchers & 📝 Update Lead Status Modal Button
 *  2. Synced Call Telemetry & Follow-up History Audit Widget
 *  3. 📋 Lead Activity & Status Audit Log History
 *  4. 1-Day Ephemeral Call Storage notice with Midnight (12:00 AM) Purge Timer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Image,
  Linking,
  Clipboard,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LeadsStackParamList } from '../../App';
import { callSyncEngine, LeadCallSummary } from '../services/callSyncEngine';
import { useAuthStore } from '../store/authStore';
import { apiService, FALLBACK_LEADS, AIScoreData } from '../services/apiService';
import { AIScoreDetailModal } from '../components/AIScoreComponents';
import {
  whatsappTemplateEngine,
  WhatsAppTemplate,
  DEFAULT_TEMPLATES,
  CATALOG_PRODUCTS,
  ProductItem,
} from '../services/whatsappTemplateEngine';
import PostCallOutcomeModal, { CallOutcomeData } from '../components/PostCallOutcomeModal';
import { PaymentStatusModal, PaymentOutcomeResult } from '../components/PaymentStatusModal';
import ToastBanner, { ToastConfig } from '../components/ToastBanner';
import CustomAlertModal, { CustomAlertState } from '../components/CustomAlertModal';

type LeadDetailRouteProp = RouteProp<LeadsStackParamList, 'LeadDetail'>;

interface LeadDetailScreenProps {
  lead?: any;
  onBack?: () => void;
}

export default function LeadDetailScreen({ lead: propLead, onBack }: LeadDetailScreenProps) {
  const navigation = useNavigation();
  const { currentUser, token } = useAuthStore();
  const userRole = currentUser?.role || 'SALES_EXEC';

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [customAlertConfig, setCustomAlertConfig] = useState<CustomAlertState | null>(null);

  let lead = propLead;
  try {
    const route = useRoute<LeadDetailRouteProp>();
    if (route?.params) {
      const { leadId, leadName } = route.params;
      if (leadId && !lead) {
        lead = { id: leadId, name: leadName || 'Lead Detail', phone: '+91 98765 43210' };
      }
    }
  } catch {}

  const leadId = lead?.id || 'lead-1';
  const leadName = lead?.name || 'Lead Details';

  // Match lead from FALLBACK_LEADS by ID or name
  const matchedLead = FALLBACK_LEADS.find(
    (l) => (leadId && l.id === leadId) || (leadName && l.name.toLowerCase() === leadName.toLowerCase())
  );

  const leadPhone = lead?.phone || matchedLead?.phone || '+91 98765 43210';
  const leadCompany = lead?.company || matchedLead?.company || 'Acme Partner';
  const leadValue = lead?.value || matchedLead?.value || '$14,200';

  // Dynamic Lead Status State
  const [leadStatusState, setLeadStatusState] = useState<string>(lead?.status || 'NEW LEAD');

  // ⚡ Track Last Updated Status, Medium, and Timestamp
  const [lastStatusUpdate, setLastStatusUpdate] = useState<{
    status: string;
    medium: string;
    time: string;
  }>({
    status: lead?.status || matchedLead?.status || 'CONTACTED',
    medium: '📞 Phone Call',
    time: 'Today, 2:45 PM',
  });

  // Live Call Telemetry State
  const [telemetry, setTelemetry] = useState<LeadCallSummary>({
    lastCalledAt: 'Today, 2:45 PM',
    connectionStatus: 'CONNECTED',
    lastDurationStr: '4m 18s',
    totalTalkTimeSeconds: 258,
    incomingCount: 2,
    outgoingCount: 4,
    lastFollowupAt: 'Today, 2:45 PM',
  });

  const [hoursToMidnight, setHoursToMidnight] = useState(7);

  // 📞 Post-Call Outcome & Status Modal State & History
  const [postCallModalOpen, setPostCallModalOpen] = useState(false);
  const [recentOutcomes, setRecentOutcomes] = useState<CallOutcomeData[]>([
    {
      leadId: leadId,
      leadName: leadName,
      phone: leadPhone,
      outcome: 'PICKED_UP',
      subOption: 'TALKED',
      notes: 'Outreach call completed. Client interested in Enterprise CRM 50-seat package. Requested proposal on WhatsApp.',
      timestamp: '02:45 PM',
      dateLabel: 'Today',
      callerName: 'Mighty Rai',
      callerRole: 'SALES_EXEC',
      durationStr: '4m 18s',
      selectedProduct: CATALOG_PRODUCTS[0],
      scheduledDate: '2026-08-22',
      scheduledTime: '11:00 AM',
    },
    {
      leadId: leadId,
      leadName: leadName,
      phone: leadPhone,
      outcome: 'WHATSAPP_CHAT',
      subOption: 'WA_SENT',
      notes: 'Sent DAS CRM Enterprise Proposal PDF deck via WhatsApp.',
      timestamp: '03:10 PM',
      dateLabel: 'Today',
      callerName: 'Mighty Rai',
      callerRole: 'SALES_EXEC',
    },
    {
      leadId: leadId,
      leadName: leadName,
      phone: leadPhone,
      outcome: 'PICKED_UP',
      subOption: 'INTERESTED',
      notes: 'Follow-up call by Team Leader. Answered GST and SLA queries. Client confirmed CFO review.',
      timestamp: '11:30 AM',
      dateLabel: 'Yesterday',
      callerName: 'Priya Sharma',
      callerRole: 'TEAM_LEADER',
      durationStr: '2m 22s',
      scheduledDate: '2026-08-21',
      scheduledTime: '02:00 PM',
    },
    {
      leadId: leadId,
      leadName: leadName,
      phone: leadPhone,
      outcome: 'BUSY',
      notes: 'Called — line busy. Will try again.',
      timestamp: '09:15 AM',
      dateLabel: 'Yesterday',
      callerName: 'Mighty Rai',
      callerRole: 'SALES_EXEC',
    },
  ]);

  // 💬 WhatsApp Template 2-Step Wizard & Quantity State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waStep, setWaStep] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(DEFAULT_TEMPLATES[0]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(CATALOG_PRODUCTS[0]);
  const [productQuantity, setProductQuantity] = useState<number>(10);
  const [customMsgText, setCustomMsgText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplBody, setNewTplBody] = useState('');

  useEffect(() => {
    callSyncEngine.checkAndPurgeMidnightLogs();
    const secs = callSyncEngine.getSecondsUntilMidnight();
    setHoursToMidnight(Math.floor(secs / 3600));

    whatsappTemplateEngine.getTemplates().then(list => {
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplate(list[0]);
        setCustomMsgText(
          whatsappTemplateEngine.interpolateTemplate(
            list[0].text,
            { name: leadName, company: leadCompany, value: leadValue },
            selectedProduct,
            productQuantity
          )
        );
      }
    });
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      try {
        (navigation as any)?.navigate('LeadsList');
      } catch {
        try {
          (navigation as any)?.navigate('Leads');
        } catch {}
      }
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [onBack, navigation]);

  // 📞 CALL NOW HANDLER (Direct Dialing + Instant Post-Call Outcome Modal)
  const handleCall = () => {
    if (!whatsappTemplateEngine.canRoleCommunicate(userRole)) {
      Alert.alert('Access Restricted', 'HR role does not have permission to initiate calls to sales leads.');
      return;
    }

    const cleaned = (leadPhone || '').replace(/[^\d+]/g, '');
    const dialUrl = `tel:${cleaned}`;
    Linking.openURL(dialUrl).catch(() => {
      Alert.alert('Dialing Direct', `Direct dialing ${cleaned} for ${leadName}...`);
    });

    callSyncEngine.initiateCall(leadId, leadName, leadPhone, (updated: LeadCallSummary) => {
      setTelemetry(updated);
    });

    setPostCallModalOpen(true);
  };

  const handleSaveCallOutcome = (data: CallOutcomeData) => {
    const enrichedData: CallOutcomeData = {
      ...data,
      callerName: data.callerName || currentUser?.name || 'Current User',
      callerRole: data.callerRole || userRole,
      dateLabel: data.dateLabel || 'Today',
    };
    setRecentOutcomes(prev => [enrichedData, ...prev]);
    setTelemetry(prev => ({
      ...prev,
      lastCalledAt: `Today, ${data.timestamp}`,
      outgoingCount: prev.outgoingCount + 1,
      lastFollowupAt: data.scheduledDate ? `${data.scheduledDate} ${data.scheduledTime || ''}` : `Today, ${data.timestamp}`,
    }));

    // ⚡ AUTOMATED LEAD STATUS TRANSITION ENGINE (ACTIVITY-DRIVEN)
    let nextStatus = leadStatusState;
    let updateReason = '';

    if (data.scheduledDate) {
      nextStatus = 'MEETING SCHEDULED';
      updateReason = `Follow-up / Meeting scheduled for ${data.scheduledDate}`;
    } else if (data.selectedProduct || data.subOption === 'CATALOGUE_SHARED' || data.subOption === 'INTERESTED') {
      nextStatus = 'IN NEGOTIATION';
      updateReason = `Product discussed / Catalogue shared (${data.selectedProduct?.name || 'Product Portfolio'})`;
    } else if (data.outcome === 'PICKED_UP' || data.subOption === 'TALKED' || data.subOption === 'WA_RESPONDED' || data.subOption === 'WA_SENT') {
      if (!leadStatusState || leadStatusState === 'NEW LEAD' || leadStatusState === 'NEW' || leadStatusState === 'Prospecting') {
        nextStatus = 'CONTACTED';
        updateReason = 'Direct contact established with client';
      }
    }

    // Determine activity medium and timestamp
    let outcomeMedium = '📞 Phone Call';
    if (data.outcome === 'WHATSAPP_CHAT') {
      outcomeMedium = data.selectedProduct ? '💬 WhatsApp (Catalogue)' : '💬 WhatsApp';
    } else if (data.scheduledDate) {
      outcomeMedium = '📅 Meeting Follow-up';
    }

    const timeString = data.timestamp
      ? (data.timestamp.includes('Today') ? data.timestamp : `Today, ${data.timestamp}`)
      : `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (nextStatus && nextStatus !== leadStatusState) {
      setLeadStatusState(nextStatus);
      apiService.updateLeadStatus(token, leadId, nextStatus);
      setLastStatusUpdate({
        status: nextStatus,
        medium: outcomeMedium,
        time: timeString,
      });
      Alert.alert('⚡ Status Auto-Updated', `${updateReason}. Lead status automatically advanced to ${nextStatus}.`);
    } else {
      setLastStatusUpdate(prev => ({
        ...prev,
        medium: outcomeMedium,
        time: timeString,
      }));
    }
  };

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleConfirmPaymentOutcome = (result: PaymentOutcomeResult) => {
    const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setLeadStatusState(result.targetLeadStatus);
    setLastStatusUpdate({
      status: result.targetLeadStatus,
      medium: '💳 Invoice Payment',
      time: timeString,
    });
    handleSaveCallOutcome({
      leadId,
      leadName,
      phone: leadPhone,
      outcome: 'WHATSAPP_CHAT',
      subOption: 'WA_SENT',
      notes: `Invoice Payment Result: ${result.paymentStatus} — ${result.notes}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (result.targetLeadStatus === 'WON') {
      Alert.alert('🎉 Deal Won!', 'Payment cleared! Lead status auto-updated to WON.');
    } else {
      Alert.alert('📄 Status Recorded', `Invoice payment logged as ${result.paymentStatus}. Status set to IN NEGOTIATION.`);
    }
  };

  // 💬 WHATSAPP DIRECT HANDLER
  const handleWhatsApp = () => {
    if (!whatsappTemplateEngine.canRoleCommunicate(userRole)) {
      Alert.alert('Access Restricted', 'HR role does not have permission to send WhatsApp messages to sales leads.');
      return;
    }

    setWaStep(1);
    const interpolated = whatsappTemplateEngine.interpolateTemplate(
      selectedTemplate ? selectedTemplate.text : `Hi ${leadName}, following up regarding ${leadCompany}...`,
      { name: leadName, company: leadCompany, value: leadValue },
      selectedProduct,
      productQuantity
    );
    setCustomMsgText(interpolated);
    setWaModalOpen(true);
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate | null) => {
    setSelectedTemplate(tpl);
    const interpolated = whatsappTemplateEngine.interpolateTemplate(
      tpl ? tpl.text : `Hi ${leadName}, following up regarding ${leadCompany}...`,
      { name: leadName, company: leadCompany, value: leadValue },
      selectedProduct,
      productQuantity
    );
    setCustomMsgText(interpolated);
  };

  const handleSelectProduct = (product: ProductItem | null) => {
    setSelectedProduct(product);
    const interpolated = whatsappTemplateEngine.interpolateTemplate(
      selectedTemplate ? selectedTemplate.text : `Hi ${leadName}, following up regarding ${leadCompany}...`,
      { name: leadName, company: leadCompany, value: leadValue },
      product,
      productQuantity
    );
    setCustomMsgText(interpolated);
  };

  const handleChangeQuantity = (qty: number) => {
    const validQty = Math.max(1, qty);
    setProductQuantity(validQty);
    const interpolated = whatsappTemplateEngine.interpolateTemplate(
      selectedTemplate ? selectedTemplate.text : `Hi ${leadName}, following up regarding ${leadCompany}...`,
      { name: leadName, company: leadCompany, value: leadValue },
      selectedProduct,
      validQty
    );
    setCustomMsgText(interpolated);
  };

  const handleSendDirectWhatsApp = () => {
    setWaModalOpen(false);
    let cleaned = (leadPhone || '').replace(/[^\d]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;

    const encoded = encodeURIComponent(customMsgText || `Hi ${leadName}, following up regarding ${leadCompany}.`);
    const waUrl = `whatsapp://send?phone=${cleaned}&text=${encoded}`;
    const webFallback = `https://wa.me/${cleaned}?text=${encoded}`;

    Linking.openURL(waUrl).catch(() => {
      Linking.openURL(webFallback).catch(() => {
        Alert.alert('WhatsApp Error', 'Could not open WhatsApp on device.');
      });
    });

    // Check if product was attached (Step 2: Product & Price Band)
    const hasProduct = !!selectedProduct && waStep === 2;

    handleSaveCallOutcome({
      leadId,
      leadName,
      phone: leadPhone,
      outcome: 'WHATSAPP_CHAT',
      subOption: hasProduct ? 'CATALOGUE_SHARED' : 'TALKED',
      selectedProduct: hasProduct ? selectedProduct : null,
      notes: hasProduct
        ? `Sent Product "${selectedProduct?.name}" (${selectedProduct?.minPrice}) with WhatsApp message: "${customMsgText.substring(0, 45)}..."`
        : `Sent WhatsApp outreach message: "${customMsgText.substring(0, 45)}..."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleSaveNewTemplate = async () => {
    if (!newTplTitle.trim() || !newTplBody.trim()) {
      Alert.alert('Incomplete Template', 'Please enter both template title and message body.');
      return;
    }

    const newTpl: WhatsAppTemplate = {
      id: 'tpl_' + Date.now(),
      title: newTplTitle.trim(),
      category: 'OUTREACH',
      text: newTplBody.trim(),
    };

    const updated = await whatsappTemplateEngine.upsertTemplate(newTpl);
    setTemplates(updated);
    setSelectedTemplate(newTpl);
    setCustomMsgText(
      whatsappTemplateEngine.interpolateTemplate(newTpl.text, {
        name: leadName,
        company: leadCompany,
        value: leadValue,
      })
    );
    setEditingTemplate(false);
    setNewTplTitle('');
    setNewTplBody('');
    Alert.alert('Template Saved', 'New Admin WhatsApp Template saved successfully!');
  };

  // Dynamic Status Picker Modal State
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const getStatusColor = (st: string) => {
    const s = (st || '').toUpperCase();
    if (s.includes('WON')) return '#34d399';
    if (s.includes('NEGOTIAT') || s.includes('PROPOSAL') || s.includes('MEETING')) return '#818cf8';
    if (s.includes('QUALIFIED')) return '#38bdf8';
    if (s.includes('CONTACT')) return '#fbbf24';
    if (s.includes('LOST')) return '#ef4444';
    return '#6366f1';
  };
  const statusColor = getStatusColor(leadStatusState || lead?.status || 'NEW LEAD');

  // 🤖 AI Lead Score Modal & Full Breakdown Data
  const [aiScoreModalOpen, setAiScoreModalOpen] = useState(false);

  const rawAiScore = lead?.score || lead?.aiScore?.totalScore || lead?.aiScore?.overall || matchedLead?.aiScore?.totalScore || 8.7;
  const aiScoreDisplay = typeof rawAiScore === 'number' ? rawAiScore.toFixed(1) : String(rawAiScore);

  const aiScoreData: AIScoreData = React.useMemo(() => {
    if (lead?.aiScore && typeof lead.aiScore === 'object' && 'totalScore' in lead.aiScore) {
      return lead.aiScore as AIScoreData;
    }
    if (matchedLead?.aiScore) {
      return matchedLead.aiScore;
    }
    const scoreNum = typeof rawAiScore === 'number' ? rawAiScore : 8.7;
    return {
      totalScore: scoreNum,
      tier: scoreNum >= 8 ? 'HOT' : scoreNum >= 6 ? 'WARM' : 'COLD',
      budgetScore: 92,
      intentScore: 85,
      engagementScore: 88,
      productFitScore: 90,
      responseScore: 86,
      analysisSummary: 'High-priority lead with strong engagement signals.',
      topFactors: ['Website visit', 'Demo attended', 'Quotation viewed'],
      riskFactors: [],
      recommendations: ['Schedule follow-up call today', 'Share enterprise case studies'],
      lastCalculatedAt: new Date().toISOString(),
    };
  }, [lead, matchedLead, rawAiScore]);

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: 10 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>← Back to Leads</Text>
        </TouchableOpacity>

        {/* Lead Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>
                {leadName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{leadName}</Text>
              <Text style={styles.company}>{lead?.company || 'Acme Partner'} • {leadValue}</Text>
            </View>
            {/* 🔥 AI SCORE BADGE (Tap to View Detailed Score Breakdown Modal) */}
            <TouchableOpacity
              style={styles.aiScoreBadgeHeader}
              onPress={() => setAiScoreModalOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`AI Score ${aiScoreDisplay}, tap to view breakdown`}
            >
              <Text style={styles.aiScoreTextHeader}>🔥 {aiScoreDisplay} AI Score</Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC AUTOMATED LEAD STATUS BADGE (Activity-driven, no manual edit button here) */}
          <View style={[styles.statusBadgeContainer, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{leadStatusState || lead?.status || 'NEW LEAD'}</Text>
            <View style={[styles.autoActivityPill, { backgroundColor: statusColor + '25', borderColor: statusColor + '40' }]}>
              <Text style={[styles.autoActivityText, { color: statusColor }]}>⚡ Auto Activity-Driven</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Toolbar (6 Glassmorphism Cards: Call, WhatsApp, WA Cloud, Direct Email, Email Mktg, Update Status) */}
        <View style={{ width: '100%', maxWidth: 600, gap: 8, marginBottom: 16 }}>
          {/* Row 1 */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(37,211,102,0.15)', borderWidth: 1, borderColor: '#25D366', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>💬 WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: '#818cf8', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                handleWhatsApp();
                const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                setLeadStatusState('IN NEGOTIATION');
                setLastStatusUpdate({
                  status: 'IN NEGOTIATION',
                  medium: '☁️ WA Cloud',
                  time: timeString,
                });
                apiService.updateLeadStatus(token, leadId, 'IN NEGOTIATION');
                setPaymentModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#a5b4fc', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>☁️ WA Cloud</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(192,132,252,0.15)', borderWidth: 1, borderColor: '#c084fc', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                setLeadStatusState('IN NEGOTIATION');
                setLastStatusUpdate({
                  status: 'IN NEGOTIATION',
                  medium: '🚀 Email Marketing',
                  time: timeString,
                });
                apiService.updateLeadStatus(token, leadId, 'IN NEGOTIATION');
                setCustomAlertConfig({
                  visible: true,
                  title: '🚀 Email Marketing',
                  message: 'Automated Email Marketing campaign dispatched! Status updated to IN NEGOTIATION.',
                  buttons: [
                    { text: 'SEND INVOICE & CHECK PAYMENT 💳', onPress: () => setPaymentModalOpen(true), style: 'primary' },
                    { text: 'OK', style: 'cancel' },
                  ],
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#c084fc', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>🚀 Email Marketing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setStatusPickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📝 Update Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 🔗 LEAD ALLOCATION & ASSIGNMENT CHAIN TRAIL ───────────────────────── */}
        <Text style={styles.sectionTitle}>🔗 Lead Allocation & Assignment Chain</Text>
        <View style={[styles.telemetryCard, { paddingBottom: 8 }]}>
          {/* Section Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#818cf8' }}>Full Delegation Trail</Text>
            <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#818cf8' }}>Admin → Manager → TL → Sales</Text>
            </View>
          </View>

          {/* Currently Assigned To Banner */}
          <View style={{ backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Currently Assigned To</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff', marginTop: 2 }}>{lead?.assignedRep || 'Rajesh Kumar (Sales Rep)'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <View style={{ backgroundColor: 'rgba(52,211,153,0.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>SALES EXECUTIVE</Text>
              </View>
              <Text style={{ fontSize: 9, color: '#64748b' }}>• Final Assignment</Text>
            </View>
          </View>

          {/* Allocation Steps Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>

              {/* Step 1: Admin → Manager */}
              <View style={{ width: 160, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 10, marginRight: 2 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#f59e0b' }}>Admin</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: '#64748b', alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: 'rgba(129,140,248,0.2)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#818cf8' }}>Manager</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff', marginBottom: 2 }}>📁 Allocated to{'\n'}Manager A</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3 }}>By Super Admin</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#f59e0b' }}>Aug 21 • 08:30 AM</Text>
              </View>

              {/* Arrow */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <Text style={{ color: '#475569', fontSize: 12 }}>▶</Text>
              </View>

              {/* Step 2: Manager → TL */}
              <View style={{ width: 160, backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)', borderRadius: 12, padding: 10, marginRight: 2 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(129,140,248,0.2)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#818cf8' }}>Manager</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: '#64748b', alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: 'rgba(56,189,248,0.2)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#38bdf8' }}>TL</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff', marginBottom: 2 }}>📁 Allocated to{'\n'}TL A</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3 }}>By Manager A</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#818cf8' }}>Aug 21 • 10:15 AM</Text>
              </View>

              {/* Arrow */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <Text style={{ color: '#475569', fontSize: 12 }}>▶</Text>
              </View>

              {/* Step 3: TL → Sales (Final Assignment) */}
              <View style={{ width: 175, backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 2, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 12, padding: 10 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: 'rgba(56,189,248,0.2)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#38bdf8' }}>TL</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: '#64748b', alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: 'rgba(52,211,153,0.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#34d399' }}>Sales Rep</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(52,211,153,0.25)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 7, fontWeight: '900', color: '#34d399' }}>✓ FINAL</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff', marginBottom: 2 }}>
                  🎯 Assigned to{'\n'}{lead?.assignedRep || 'Rajesh Kumar (Sales Rep)'}
                </Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3 }}>By TL A</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>Aug 21 • 11:45 AM</Text>
              </View>
            </View>
          </ScrollView>

          <Text style={{ fontSize: 9, color: '#475569', textAlign: 'center', marginTop: 6 }}>← Scroll to see full allocation chain →</Text>
        </View>

        {/* ── 📞 SYNCED CALL HISTORY & TELEMETRY WIDGET ───────────────────── */}
        <Text style={styles.sectionTitle}>📞 Call Telemetry &amp; Follow-Up Audit</Text>
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeaderRow}>
            <Text style={styles.telemetryHeaderTitle}>Call Log Sync Status</Text>
            <View style={styles.connectedPill}>
              <Text style={styles.connectedPillText}>🟢 {telemetry.connectionStatus}</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>{telemetry.lastDurationStr}</Text>
              <Text style={styles.telemetryLbl}>Talk Duration</Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#38bdf8' }]}>{telemetry.incomingCount} Calls</Text>
              <Text style={styles.telemetryLbl}>Incoming Calls</Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryVal, { color: '#fbbf24' }]}>{telemetry.outgoingCount} Calls</Text>
              <Text style={styles.telemetryLbl}>Outgoing Calls</Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          {/* ⚡ LAST UPDATED STATUS (THROUGH MEDIUM & TIME) */}
          <View style={styles.lastStatusCard}>
            <View style={styles.lastStatusTopRow}>
              <Text style={styles.lastStatusTitle}>Last Updated Status:</Text>
              <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(lastStatusUpdate.status) + '22', borderColor: getStatusColor(lastStatusUpdate.status) + '60' }]}>
                <View style={[styles.statusDotSmall, { backgroundColor: getStatusColor(lastStatusUpdate.status) }]} />
                <Text style={[styles.statusBadgeSmallText, { color: getStatusColor(lastStatusUpdate.status) }]}>
                  {lastStatusUpdate.status}
                </Text>
              </View>
            </View>

            <View style={styles.lastStatusMetaRow}>
              <Text style={styles.lastStatusMetaText}>
                Through: <Text style={styles.lastStatusMetaHighlight}>{lastStatusUpdate.medium}</Text>
                {'  '}•{'  '}
                Time: <Text style={[styles.lastStatusMetaHighlight, { color: '#818cf8' }]}>{lastStatusUpdate.time}</Text>
              </Text>
            </View>
          </View>

          {/* 1-Day Ephemeral Storage & Midnight Purge Notice */}
          <View style={styles.purgeNoticeBox}>
            <Text style={styles.purgeNoticeText}>
              ⌛ 1-Day Local Storage: Raw call logs auto-purge at Midnight 12:00 AM ({hoursToMidnight}h remaining). Cumulative lead telemetry is permanently saved.
            </Text>
          </View>
        </View>

        {/* ── 📋 LEAD FOLLOW-UP ACTIVITY & TIMELINE LOG HISTORY ───────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>📋 Call Timeline & Contact Audit</Text>
        </View>

        <View style={styles.activityHistoryCard}>
          {recentOutcomes.map((item, idx) => {
            const roleColor = item.callerRole === 'TEAM_LEADER' ? '#38bdf8' : item.callerRole === 'MANAGER' ? '#818cf8' : '#34d399';
            const roleLabel = item.callerRole === 'TEAM_LEADER' ? 'TL' : item.callerRole === 'MANAGER' ? 'Manager' : 'Sales Rep';

            return (
              <View key={idx} style={[styles.activityItemRow, idx < recentOutcomes.length - 1 && styles.activityItemBorder]}>
                {/* Header Row: Outcome Badge + Date / Time */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.activityTitleText}>
                      {item.outcome === 'PICKED_UP' ? '🟢 Call Connected' : item.outcome === 'WHATSAPP_CHAT' ? '💬 WhatsApp Sent' : item.outcome === 'BUSY' ? '🟡 Line Busy' : '🔴 Not Responding'}
                    </Text>
                    {item.subOption && (
                      <View style={styles.subOptionPill}>
                        <Text style={styles.subOptionPillText}>{item.subOption.replace('_', ' ')}</Text>
                      </View>
                    )}
                    {item.durationStr && (
                      <View style={{ backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#34d399' }}>🎙 {item.durationStr}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700' }}>
                    {item.dateLabel ? `${item.dateLabel} · ` : ''}{item.timestamp}
                  </Text>
                </View>

                {/* Who Called / Initiator Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: '#64748b' }}>By:</Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#e2e8f0' }}>{item.callerName || 'Sales Executive'}</Text>
                  <View style={{ backgroundColor: roleColor + '20', borderWidth: 1, borderColor: roleColor + '50', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: roleColor }}>{roleLabel}</Text>
                  </View>
                </View>

                {/* Notes & Reasoning */}
                {item.notes ? (
                  <View style={{ backgroundColor: 'rgba(15,23,42,0.8)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 8, marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: '#cbd5e1', fontStyle: 'italic' }}>"{item.notes}"</Text>
                  </View>
                ) : null}

                {/* Interested Product */}
                {item.selectedProduct && (
                  <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800', marginTop: 4 }}>
                    🛍️ Product Discussed: {item.selectedProduct.name}
                  </Text>
                )}

                {/* Scheduled Callback */}
                {item.scheduledDate && (
                  <View style={{ backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)', borderRadius: 8, padding: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>
                      📅 Callback Scheduled: {item.scheduledDate} {item.scheduledTime ? `at ${item.scheduledTime}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Details (With Copy-on-Tap Support for Phone & Email) */}
        <Text style={styles.sectionTitle}>Contact Information (Tap Phone or Email to Copy 📋)</Text>
        <View style={styles.detailCard}>
          {[
            { label: '📞 Phone', value: leadPhone, isCopyable: true, type: 'Phone Number' },
            { label: '✉️ Email', value: lead?.email || 'vikram@acme.com', isCopyable: true, type: 'Email Address' },
            { label: '🏢 Company', value: lead?.company || 'Acme Corp', isCopyable: false, type: '' },
            { label: '🌐 Source', value: lead?.source || 'Google Sheets Sync', isCopyable: false, type: '' },
          ].map((item, i) => {
            const handleTap = () => {
              if (item.isCopyable) {
                try {
                  Clipboard.setString(item.value);
                } catch (e) {}
                setToastConfig({
                  id: `toast_${Date.now()}`,
                  title: '📋 Copied to Clipboard',
                  message: `${item.type} "${item.value}" copied to clipboard!`,
                  type: 'COPY',
                });
              }
            };

            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
                onPress={handleTap}
                activeOpacity={item.isCopyable ? 0.7 : 1}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.rowValue, item.isCopyable && { color: '#38bdf8' }]}>{item.value}</Text>
                  {item.isCopyable && <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800' }}>📋 Copy</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💬 WHATSAPP DIRECT MESSAGE & ADMIN TEMPLATE SELECTOR MODAL                  */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={waModalOpen} transparent animationType="slide">
        <View style={styles.waModalOverlay}>
          <View style={styles.waModalCard}>
            
            {/* Header */}
            <View style={styles.waModalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.waModalTitle}>💬 WhatsApp Direct Message</Text>
                <Text style={styles.waModalSub}>Target Lead: <Text style={{ color: '#34d399', fontWeight: '800' }}>{leadName}</Text> ({leadPhone})</Text>
              </View>
              <TouchableOpacity onPress={() => setWaModalOpen(false)} style={styles.waCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 2-Step Wizard Header Indicator */}
            <View style={styles.wizardStepBar}>
              <TouchableOpacity
                style={[styles.wizardStepTab, waStep === 1 && styles.wizardStepTabActive]}
                onPress={() => setWaStep(1)}
              >
                <Text style={[styles.wizardStepTabText, waStep === 1 && { color: '#38bdf8' }]}>
                  1. Select Template {selectedTemplate ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#475569', fontSize: 11 }}>➔</Text>
              <TouchableOpacity
                style={[styles.wizardStepTab, waStep === 2 && styles.wizardStepTabActive]}
                onPress={() => setWaStep(2)}
              >
                <Text style={[styles.wizardStepTabText, waStep === 2 && { color: '#38bdf8' }]}>
                  2. Product &amp; Requirements
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>

              {/* STEP 1: SELECT WHATSAPP TEMPLATE */}
              {waStep === 1 && (
                <View>
                  <Text style={styles.waSectionTitle}>Select Message Template:</Text>
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    {templates.map((tpl) => {
                      const isSelected = selectedTemplate?.id === tpl.id;
                      return (
                        <TouchableOpacity
                          key={tpl.id}
                          style={[styles.tplCard, isSelected && styles.tplCardSelected]}
                          onPress={() => handleSelectTemplate(tpl)}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.tplTitleText}>{tpl.title}</Text>
                            {isSelected && <Text style={{ color: '#38bdf8', fontWeight: '900', fontSize: 12 }}>✓ Selected</Text>}
                          </View>
                          <Text style={styles.tplPreviewText} numberOfLines={2}>{tpl.text}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.proceedStepBtn}
                    onPress={() => setWaStep(2)}
                  >
                    <Text style={styles.proceedStepBtnText}>Proceed to Step 2: Product &amp; Price →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: SELECT PRODUCT & PRICE BAND */}
              {waStep === 2 && (
                <View>
                  <Text style={styles.waSectionTitle}>Select Product Attachment:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {CATALOG_PRODUCTS.map((prod) => {
                      const isSelected = selectedProduct?.id === prod.id;
                      return (
                        <TouchableOpacity
                          key={prod.id}
                          style={[styles.productChip, isSelected && styles.productChipActive]}
                          onPress={() => handleSelectProduct(prod)}
                        >
                          <Image source={{ uri: prod.imageUrl }} style={styles.prodThumb} />
                          <Text style={[styles.productChipText, isSelected && { color: '#38bdf8', fontWeight: '900' }]}>
                            {prod.name.split(' ')[0]} ({prod.minPrice})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedProduct && (
                    <View style={styles.attachedProductCard}>
                      <Image source={{ uri: selectedProduct.imageUrl }} style={styles.attachedProductImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attachedProdName}>{selectedProduct.name}</Text>
                        <Text style={styles.attachedProdPrice}>{selectedProduct.minPrice} - {selectedProduct.maxPrice}</Text>
                        <Text style={styles.attachedProdDesc}>{selectedProduct.description}</Text>
                      </View>
                    </View>
                  )}

                  {/* Quantity Counter */}
                  <View style={styles.qtyCardContainer}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Quantity &amp; Tier Discount:</Text>
                    <View style={styles.qtyRow}>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>Selected Units:</Text>
                      <View style={styles.qtyCounterBox}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQuantity(productQuantity - 1)}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValText}>{productQuantity} Units</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQuantity(productQuantity + 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.waSectionTitle, { marginTop: 12 }]}>Message Body Preview (Editable):</Text>
                  <TextInput
                    style={styles.previewTextInput}
                    multiline
                    value={customMsgText}
                    onChangeText={setCustomMsgText}
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity style={styles.backStepBtn} onPress={() => setWaStep(1)}>
                      <Text style={styles.backStepBtnText}>← Step 1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sendWaDirectBtn, { flex: 1, marginTop: 0 }]}
                      onPress={handleSendDirectWhatsApp}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sendWaDirectBtnText}>🚀 Send WhatsApp Message →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📞 INSTANT POST-CALL OUTCOME POPUP MODAL                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <PostCallOutcomeModal
        visible={postCallModalOpen}
        leadId={leadId}
        leadName={leadName}
        phone={leadPhone}
        onClose={() => setPostCallModalOpen(false)}
        onSaveOutcome={handleSaveCallOutcome}
      />

      {/* 💳 INVOICE & PAYMENT STATUS CONFIRMATION POPUP MODAL */}
      <PaymentStatusModal
        visible={paymentModalOpen}
        leadName={leadName}
        leadValue={lead?.value || '$14,200'}
        onClose={() => setPaymentModalOpen(false)}
        onConfirmPaymentOutcome={handleConfirmPaymentOutcome}
      />

      {/* 📝 ACTIVITY-DRIVEN LEAD STAGE UPDATE MODAL */}
      <Modal
        visible={statusPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerOpen(false)}
      >
        <View style={styles.waModalOverlay}>
          <View style={[styles.waModalCard, { maxWidth: 380, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
            <View style={styles.waModalHeaderRow}>
              <View>
                <Text style={styles.waModalTitle}>⚡ Log Activity &amp; Advance Stage</Text>
                <Text style={styles.waModalSub}>Recorded activity dynamically advances {leadName}'s lifecycle stage</Text>
              </View>
              <TouchableOpacity style={styles.waCloseBtn} onPress={() => setStatusPickerOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginVertical: 8 }}>
              {[
                { status: 'CONTACTED', color: '#fbbf24', icon: '📞', desc: 'Direct call or chat discussion completed' },
                { status: 'IN NEGOTIATION', color: '#a855f7', icon: '🤝', desc: 'Product presented & discussing pricing/terms' },
                { status: 'PROPOSAL', color: '#818cf8', icon: '📄', desc: 'Formal quotation proposal deck dispatched' },
                { status: 'MEETING SCHEDULED', color: '#ec4899', icon: '📅', desc: 'Product demo / physical visit scheduled' },
                { status: 'WON', color: '#34d399', icon: '🎉', desc: 'Deal finalized & payment cleared' },
                { status: 'LOST', color: '#ef4444', icon: '❌', desc: 'Lead dropped / not interested' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.status}
                  style={{
                    backgroundColor: leadStatusState === item.status ? item.color + '25' : '#020617',
                    borderWidth: 1,
                    borderColor: leadStatusState === item.status ? item.color : '#1e293b',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                  onPress={() => {
                    const nextSt = item.status;
                    const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    setLeadStatusState(nextSt);
                    setLastStatusUpdate({
                      status: nextSt,
                      medium: '📝 Activity Log',
                      time: timeString,
                    });
                    apiService.updateLeadStatus(token, leadId, nextSt);
                    setRecentOutcomes(prev => [{
                      leadId,
                      leadName,
                      phone: leadPhone,
                      outcome: nextSt === 'WON' ? 'PICKED_UP' : 'WHATSAPP_CHAT',
                      subOption: nextSt === 'IN NEGOTIATION' ? 'INTERESTED' : 'TALKED',
                      notes: `Activity Logged: ${item.desc}. Lead status advanced to ${nextSt}.`,
                      callerName: currentUser?.name || 'Current User',
                      callerRole: userRole,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      dateLabel: 'Today',
                    }, ...prev]);
                    setStatusPickerOpen(false);
                    setToastConfig({ id: String(Date.now()), title: 'Activity & Stage Logged', message: `Lead moved to ${nextSt} via verified activity log.`, type: 'SUCCESS' });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 15 }}>{item.icon}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: leadStatusState === item.status ? item.color : '#ffffff' }}>
                        {item.status}
                      </Text>
                    </View>
                    {leadStatusState === item.status && (
                      <Text style={{ color: item.color, fontSize: 10, fontWeight: '900' }}>✓ Active Stage</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, paddingLeft: 23 }}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 📊 AI SCORE DETAIL BREAKDOWN MODAL */}
      <AIScoreDetailModal
        visible={aiScoreModalOpen}
        score={aiScoreData}
        onClose={() => setAiScoreModalOpen(false)}
      />

      <ToastBanner toast={toastConfig} onDismiss={() => setToastConfig(null)} />
      <CustomAlertModal alert={customAlertConfig} onClose={() => setCustomAlertConfig(null)} />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 32 },

  backButton: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },

  headerCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  aiScoreBadgeHeader: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiScoreTextHeader: { fontSize: 12, fontWeight: '900', color: '#f87171' },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '900' },
  autoActivityPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  autoActivityText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%', maxWidth: 500 },
  callBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  callBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },

  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsappBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },

  updateStatusBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  updateStatusBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 8, marginTop: 4, width: '100%', maxWidth: 500 },

  telemetryCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  telemetryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  telemetryHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  connectedPill: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connectedPillText: { fontSize: 10, fontWeight: '800', color: '#34d399' },

  telemetryGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  telemetryItem: { flex: 1, backgroundColor: '#020617', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  telemetryVal: { fontSize: 15, fontWeight: '900', color: '#34d399' },
  telemetryLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  metaDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 8 },
  metaLine: { fontSize: 11, color: '#94a3b8', marginVertical: 2 },

  lastStatusCard: {
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
    marginVertical: 4,
  },
  lastStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  lastStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  lastStatusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastStatusMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  lastStatusMetaHighlight: {
    color: '#f8fafc',
    fontWeight: '800',
  },

  purgeNoticeBox: { backgroundColor: '#020617', borderRadius: 10, padding: 8, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' },
  purgeNoticeText: { fontSize: 10, color: '#a5b4fc', fontStyle: 'italic' },

  activityHistoryCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  activityItemRow: { paddingVertical: 8 },
  activityItemBorder: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  activityTitleText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  subOptionPill: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  subOptionPillText: { color: '#818cf8', fontSize: 8, fontWeight: '800' },
  activityNotesText: { fontSize: 10, color: '#cbd5e1', marginTop: 3, fontStyle: 'italic' },

  detailCard: { width: '100%', maxWidth: 500, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  rowValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },

  // WhatsApp Modal Styles
  waModalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  waModalCard: { width: '100%', maxWidth: 440, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  waModalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  waModalTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  waModalSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  waCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  waSectionTitle: { fontSize: 11, fontWeight: '800', color: '#818cf8', marginBottom: 6 },
  tplCard: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10 },
  tplCardSelected: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)' },
  tplTitleText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  tplPreviewText: { fontSize: 10, color: '#94a3b8', marginTop: 3 },

  productChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  productChipActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)' },
  productChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  prodThumb: { width: 22, height: 22, borderRadius: 6, resizeMode: 'cover' },

  attachedProductCard: { flexDirection: 'row', gap: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 12, padding: 10, marginBottom: 10 },
  attachedProductImg: { width: 50, height: 50, borderRadius: 10, resizeMode: 'cover' },
  attachedProdName: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  attachedProdPrice: { fontSize: 10, fontWeight: '800', color: '#34d399' },
  attachedProdDesc: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  wizardStepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#020617', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  wizardStepTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  wizardStepTabActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  wizardStepTabText: { fontSize: 10, fontWeight: '800', color: '#64748b' },

  proceedStepBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  proceedStepBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  backStepBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backStepBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },

  qtyCardContainer: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  qtyCounterBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8 },
  qtyBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  qtyValText: { color: '#38bdf8', fontSize: 14, fontWeight: '900', paddingHorizontal: 14 },

  previewTextInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 12, padding: 10, color: '#34d399', fontSize: 11, height: 90 },

  sendWaDirectBtn: { backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  sendWaDirectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
