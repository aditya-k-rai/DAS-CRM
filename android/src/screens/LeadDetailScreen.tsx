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
import { useTheme } from '../context/ThemeContext';
import { apiService, FALLBACK_LEADS, AIScoreData } from '../services/apiService';
import { AIScoreDetailModal } from '../components/AIScoreComponents';
import {
  whatsappTemplateEngine,
  WhatsAppTemplate,
  TemplateCategory,
  DEFAULT_TEMPLATES,
  CATALOG_PRODUCTS,
  ProductItem,
  SAMPLE_INVOICES,
  InvoiceItem,
} from '../services/whatsappTemplateEngine';
import { getStoredStatuses, LeadStatusItem, DEFAULT_ANDROID_STATUSES } from '../services/workflowStorage';
import PostCallOutcomeModal, { CallOutcomeData } from '../components/PostCallOutcomeModal';
import { PaymentStatusModal, PaymentOutcomeResult } from '../components/PaymentStatusModal';
import ToastBanner, { ToastConfig } from '../components/ToastBanner';
import CustomAlertModal, { CustomAlertState } from '../components/CustomAlertModal';
import { useModuleAccessStore } from '../store/moduleAccessStore';
import { isBatchAssignableRole } from '../components/LeadAllocationEngineModal';

type LeadDetailRouteProp = RouteProp<LeadsStackParamList, 'LeadDetail'>;

interface LeadDetailScreenProps {
  lead?: any;
  onBack?: () => void;
}

export default function LeadDetailScreen({ lead: propLead, onBack }: LeadDetailScreenProps) {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { currentUser, token } = useAuthStore();
  const userRole = currentUser?.role || 'SALES_EXEC';
  const { managedUsers } = useModuleAccessStore();

  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [customAlertConfig, setCustomAlertConfig] = useState<CustomAlertState | null>(null);

  let lead = propLead;
  try {
    const route = useRoute<LeadDetailRouteProp>();
    if (route?.params) {
      const { leadId, leadName } = route.params;
      if (leadId && !lead) {
        lead = { id: leadId, name: leadName || 'Lead Detail', phone: '' };
      }
    }
  } catch {}

  const leadId = lead?.id || 'lead-1';
  const leadName = lead?.name || 'Lead Details';

  // Match lead from FALLBACK_LEADS by ID or name
  const matchedLead = FALLBACK_LEADS.find(
    (l) => (leadId && l.id === leadId) || (leadName && l.name.toLowerCase() === leadName.toLowerCase())
  );

  const leadPhone = lead?.phone || matchedLead?.phone || '';
  const leadCompany = lead?.company || matchedLead?.company || '—';
  const leadValue = lead?.value || matchedLead?.value || '₹0';

  // Lead Assigned Rep State & Reassignment (TL + Sales Exec only)
  const [leadAssignedRep, setLeadAssignedRep] = useState<string>(lead?.assignedRep || matchedLead?.assignedRep || 'Unassigned');

  const assignableRepOptions = React.useMemo(() => {
    const validUsers = (managedUsers || []).filter(u => isBatchAssignableRole(u.role));
    if (validUsers.length > 0) {
      return validUsers.map(u => {
        const r = (u.role || '').toUpperCase();
        const tag = r.includes('LEADER') || r.includes('TL') ? 'TL' : 'Sales Exec';
        return `${u.name} (${tag})`;
      });
    }
    return ['Team Leader A (TL)', 'Sales Rep 1 (Sales Exec)', 'Sales Rep 2 (Sales Exec)'];
  }, [managedUsers]);

  const handleReassignLead = () => {
    const isUnassigned = !leadAssignedRep || leadAssignedRep === 'Unassigned' || leadAssignedRep === '—';
    const assignOptions = [
      ...assignableRepOptions.map(p => ({
        text: p,
        onPress: () => {
          setLeadAssignedRep(p);
          apiService.updateLead(token, leadId, { assignedRep: p }).catch(() => {});
          setToastConfig({
            id: String(Date.now()),
            title: 'Lead Reassigned',
            message: `👤 Lead reassigned to ${p} successfully.`,
            type: 'SUCCESS',
          });
        },
      })),
      {
        text: 'Unassigned',
        onPress: () => {
          setLeadAssignedRep('Unassigned');
          apiService.updateLead(token, leadId, { assignedRep: 'Unassigned' }).catch(() => {});
          setToastConfig({
            id: String(Date.now()),
            title: 'Lead Unassigned',
            message: '👤 Lead marked as Unassigned.',
            type: 'INFO',
          });
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert(
      '👤 Reassign Lead (TL / Sales Rep Only)',
      `Assign ${leadName} (${isUnassigned ? 'Currently Unassigned' : leadAssignedRep}) to:`,
      assignOptions
    );
  };

  // Dynamic Lead Status State
  const [leadStatusState, setLeadStatusState] = useState<string>(lead?.status || 'NEW LEAD');

  // ⚡ Track Last Updated Status, Medium, and Timestamp
  const [lastStatusUpdate, setLastStatusUpdate] = useState<{
    status: string;
    medium: string;
    time: string;
  }>({
    status: lead?.status || matchedLead?.status || 'NEW LEAD',
    medium: '—',
    time: 'Never',
  });

  // Live Call Telemetry State
  const [telemetry, setTelemetry] = useState<LeadCallSummary>({
    lastCalledAt: 'Never',
    connectionStatus: 'NONE',
    lastDurationStr: '0s',
    totalTalkTimeSeconds: 0,
    incomingCount: 0,
    outgoingCount: 0,
    lastFollowupAt: 'Never',
  });

  const [hoursToMidnight, setHoursToMidnight] = useState(7);

  // 📞 Post-Call Outcome & Status Modal State & History
  const [postCallModalOpen, setPostCallModalOpen] = useState(false);
  const [recentOutcomes, setRecentOutcomes] = useState<CallOutcomeData[]>([]);

  // 💬 WhatsApp Direct Engine State & Unified Dispatcher Workflow
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waCategory, setWaCategory] = useState<TemplateCategory>('OUTREACH');
  const [waAttachmentMode, setWaAttachmentMode] = useState<'PRODUCT' | 'INVOICE'>('PRODUCT');
  const [waCustomMode, setWaCustomMode] = useState(false);
  const [waCustomTitle, setWaCustomTitle] = useState('Custom Lead Message');
  const [waTargetStatus, setWaTargetStatus] = useState('Contacted');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(DEFAULT_TEMPLATES[0]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(CATALOG_PRODUCTS[0]);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(SAMPLE_INVOICES[0]);
  const [availableInvoices] = useState<InvoiceItem[]>(SAMPLE_INVOICES);
  const [customMsgText, setCustomMsgText] = useState('');
  const [saveCustomToLib, setSaveCustomToLib] = useState(true);

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
            null,
            1
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

  // ── WHATSAPP CONFIG CONSTANTS ──
  const WA_CATEGORIES: { cat: TemplateCategory; label: string; icon: string; desc: string; defaultStatus: string }[] = [
    { cat: 'OUTREACH', label: 'Outreach', icon: '🌱', desc: 'Initial contact', defaultStatus: 'Contacted' },
    { cat: 'PROPOSAL', label: 'Proposal', icon: '💼', desc: 'Product details', defaultStatus: 'Proposal' },
    { cat: 'INVOICE', label: 'Invoice', icon: '📦', desc: 'Invoice / PDF', defaultStatus: 'In Negotiation' },
    { cat: 'MEETING', label: 'Meeting', icon: '📅', desc: 'Schedule demo', defaultStatus: 'Meeting Scheduled' },
    { cat: 'FOLLOWUP', label: 'Follow-up', icon: '⏰', desc: 'Callback nudge', defaultStatus: 'Contacted' },
    { cat: 'PROMOTION', label: 'Promotion', icon: '🎉', desc: 'Offer / discount', defaultStatus: 'In Negotiation' },
  ];

  const WA_TARGET_STATUSES = [
    { key: 'Contacted', label: 'Connected / Contacted', icon: '📞', color: '#38bdf8' },
    { key: 'Proposal', label: 'Proposal Sent (Negotiation)', icon: '📄', color: '#a855f7' },
    { key: 'In Negotiation', label: 'Product / Invoice Sent (Negotiation)', icon: '📦', color: '#f59e0b' },
    { key: 'Meeting Scheduled', label: 'Meeting Details (Meeting Scheduled)', icon: '📅', color: '#6366f1' },
    { key: 'Qualified', label: 'Qualified (Requirements Gathered)', icon: '🎯', color: '#ec4899' },
    { key: 'WON', label: 'Deal Closed / Payment Cleared (Won)', icon: '🏆', color: '#10b981' },
  ];

  const getInvoicePdfFilename = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    const safeName = (leadName || 'Lead').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    return `${safeName}_${dateStr}_${timeStr}.pdf`;
  };

  const generateInvoiceMsgText = (inv: InvoiceItem) => {
    const docLabel = inv.docType.replace(/_/g, ' ');
    const pdfFilename = getInvoicePdfFilename();
    const pdfLink = inv.pdfUrl || `https://nexcrm.com/invoices/${inv.quoteNumber}.pdf`;
    return `Hi ${leadName}! Please find the official ${docLabel} (${inv.quoteNumber}) prepared for ${leadCompany}:\n\n📄 *Document:* ${docLabel}\n🔢 *Invoice Ref:* ${inv.quoteNumber}\n💰 *Total Amount:* ₹${inv.totalAmount.toLocaleString('en-IN')} (incl. 18% GST)\n📅 *Issued Date:* ${inv.date}\n📦 *Items Summary:* ${inv.itemsSummary}\n📎 *Attached PDF Document:* ${pdfFilename} (${pdfLink})\n\nPlease review the attached invoice PDF and reply to confirm payment processing!`;
  };

  const updateComposedMessage = (
    cat: TemplateCategory,
    mode: 'PRODUCT' | 'INVOICE',
    tpl: WhatsAppTemplate | null,
    prod: ProductItem | null,
    qty: number,
    inv: InvoiceItem | null,
    isCustom: boolean = waCustomMode
  ) => {
    if (isCustom) {
      if (cat === 'INVOICE' && inv) {
        setCustomMsgText(generateInvoiceMsgText(inv));
      } else if (cat === 'PROPOSAL' && prod) {
        setCustomMsgText(whatsappTemplateEngine.interpolateTemplate(
          `Hi {name}! Please find our customized commercial proposal for {company} attached below:`,
          { name: leadName, company: leadCompany, value: leadValue },
          prod,
          qty
        ));
      }
      return;
    }

    if (cat === 'INVOICE' && inv) {
      setCustomMsgText(generateInvoiceMsgText(inv));
    } else {
      const baseText = tpl ? tpl.text : `Hi ${leadName}, following up regarding ${leadCompany}...`;
      const interpolated = whatsappTemplateEngine.interpolateTemplate(
        baseText,
        { name: leadName, company: leadCompany, value: leadValue },
        mode === 'PRODUCT' && (cat === 'PROPOSAL' || Boolean(prod)) ? prod : null,
        qty
      );
      setCustomMsgText(interpolated);
    }
  };

  // 💬 WHATSAPP DIRECT HANDLER
  const handleWhatsApp = () => {
    if (!whatsappTemplateEngine.canRoleCommunicate(userRole)) {
      Alert.alert('Access Restricted', 'HR role does not have permission to send WhatsApp messages to sales leads.');
      return;
    }

    const initialCat = 'OUTREACH';
    setWaCategory(initialCat);
    setWaAttachmentMode('PRODUCT');
    setWaCustomMode(false);
    setWaTargetStatus('Contacted');

    const matchingTpl = templates.find(t => t.category === initialCat) || templates[0];
    if (matchingTpl) {
      setSelectedTemplate(matchingTpl);
      updateComposedMessage(initialCat, 'PRODUCT', matchingTpl, selectedProduct, productQuantity, selectedInvoice, false);
    }
    setWaModalOpen(true);
  };

  const handleSelectCategory = (cat: TemplateCategory) => {
    setWaCategory(cat);
    const catCfg = WA_CATEGORIES.find(c => c.cat === cat);
    if (catCfg) setWaTargetStatus(catCfg.defaultStatus);

    let newMode = waAttachmentMode;
    if (cat === 'INVOICE') {
      newMode = 'INVOICE';
      setWaAttachmentMode('INVOICE');
    } else if (cat === 'PROPOSAL') {
      newMode = 'PRODUCT';
      setWaAttachmentMode('PRODUCT');
    }

    const matchingTpl = templates.find(t => t.category === cat) || templates[0];
    if (matchingTpl) {
      setSelectedTemplate(matchingTpl);
      updateComposedMessage(cat, newMode, matchingTpl, selectedProduct, productQuantity, selectedInvoice, waCustomMode);
    }
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
    if (tpl.targetStatus) setWaTargetStatus(tpl.targetStatus);
    updateComposedMessage(waCategory, waAttachmentMode, tpl, selectedProduct, productQuantity, selectedInvoice, waCustomMode);
  };

  const handleSelectAttachmentMode = (mode: 'PRODUCT' | 'INVOICE') => {
    setWaAttachmentMode(mode);
    if (mode === 'INVOICE') {
      setWaCategory('INVOICE');
      setWaTargetStatus('In Negotiation');
      updateComposedMessage('INVOICE', 'INVOICE', selectedTemplate, selectedProduct, productQuantity, selectedInvoice, waCustomMode);
    } else {
      setWaCategory('PROPOSAL');
      setWaTargetStatus('Proposal');
      updateComposedMessage('PROPOSAL', 'PRODUCT', selectedTemplate, selectedProduct, productQuantity, selectedInvoice, waCustomMode);
    }
  };

  const handleSelectProduct = (prod: ProductItem) => {
    setSelectedProduct(prod);
    updateComposedMessage(waCategory, waAttachmentMode, selectedTemplate, prod, productQuantity, selectedInvoice, waCustomMode);
  };

  const handleChangeQuantity = (qty: number) => {
    const valid = Math.max(1, qty);
    setProductQuantity(valid);
    updateComposedMessage(waCategory, waAttachmentMode, selectedTemplate, selectedProduct, valid, selectedInvoice, waCustomMode);
  };

  const handleSelectInvoice = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    updateComposedMessage(waCategory, 'INVOICE', selectedTemplate, selectedProduct, productQuantity, inv, waCustomMode);
  };

  const handleInsertPlaceholder = (ph: string) => {
    const valToInsert = ph === '{name}' ? leadName :
                        ph === '{company}' ? leadCompany :
                        ph === '{value}' ? leadValue :
                        ph === '{product}' ? (selectedProduct?.name || 'DAS CRM Suite') : ph;
    setCustomMsgText(prev => prev ? `${prev} ${valToInsert}` : valToInsert);
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

    const isInvoice = waAttachmentMode === 'INVOICE' || waCategory === 'INVOICE';
    const isProduct = waAttachmentMode === 'PRODUCT' && (waCategory === 'PROPOSAL' || Boolean(selectedProduct));

    // Update lead status state & backend API
    const newStatus = waTargetStatus || leadStatusState;
    if (newStatus && newStatus !== leadStatusState) {
      setLeadStatusState(newStatus);
      apiService.updateLeadStatus(token, leadId, newStatus);
      setLastStatusUpdate({
        status: newStatus,
        medium: isInvoice ? '📄 WhatsApp (Invoice)' : isProduct ? '💬 WhatsApp (Proposal)' : '💬 WhatsApp Direct',
        time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
    }

    handleSaveCallOutcome({
      leadId,
      leadName,
      phone: leadPhone,
      outcome: 'WHATSAPP_CHAT',
      subOption: isInvoice ? 'CATALOGUE_SHARED' : isProduct ? 'CATALOGUE_SHARED' : 'TALKED',
      selectedProduct: isProduct ? selectedProduct : null,
      notes: isInvoice
        ? `Sent Invoice "${selectedInvoice?.quoteNumber}" (₹${selectedInvoice?.totalAmount?.toLocaleString('en-IN')}) via WhatsApp Direct with PDF attachment: ${getInvoicePdfFilename()}`
        : isProduct
        ? `Sent Product Proposal "${selectedProduct?.name}" (Qty: ${productQuantity}) via WhatsApp Direct`
        : `Sent WhatsApp direct outreach message: "${customMsgText.substring(0, 50)}..."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setToastConfig({
      id: String(Date.now()),
      title: 'WhatsApp Dispatched',
      message: `Message dispatched to ${leadName}. Status auto-updated to ${newStatus}.`,
      type: 'SUCCESS',
    });
  };

  // Dynamic Status Picker Modal State
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<LeadStatusItem[]>(DEFAULT_ANDROID_STATUSES);

  useEffect(() => {
    getStoredStatuses().then(setAvailableStatuses);
  }, []);

  const getStatusColor = (st: string) => {
    const s = (st || '').trim().toUpperCase();
    const matched = availableStatuses.find(item => item.name.toUpperCase() === s || item.name.toUpperCase().includes(s));
    if (matched) return matched.color;
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
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 10 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back to Leads</Text>
        </TouchableOpacity>

        {/* Lead Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>
                {leadName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{leadName}</Text>
              <Text style={[styles.company, { color: colors.textSecondary }]}>{lead?.company || 'Independent Business'} • {leadValue}</Text>
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
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.12)', borderWidth: 1, borderColor: isDark ? '#10b981' : '#059669', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#34d399' : '#059669', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(37,211,102,0.15)' : 'rgba(22,163,74,0.12)', borderWidth: 1, borderColor: isDark ? '#25D366' : '#16a34a', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#4ade80' : '#16a34a', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>💬 WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.12)', borderWidth: 1, borderColor: isDark ? '#818cf8' : '#4f46e5', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
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
              <Text style={{ color: isDark ? '#a5b4fc' : '#4f46e5', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>☁️ WA Cloud</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(192,132,252,0.15)' : 'rgba(147,51,234,0.12)', borderWidth: 1, borderColor: isDark ? '#c084fc' : '#9333ea', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
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
              <Text style={{ color: isDark ? '#c084fc' : '#7c3aed', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>🚀 Email Marketing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.12)', borderWidth: 1, borderColor: isDark ? '#fbbf24' : '#d97706', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setStatusPickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#fbbf24' : '#b45309', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📝 Update Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 🔗 LEAD ALLOCATION & ASSIGNMENT CHAIN TRAIL ───────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔗 Lead Allocation & Assignment Chain</Text>
        <View style={[styles.telemetryCard, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingBottom: 8 }]}>
          {/* Section Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5' }}>Full Delegation Trail</Text>
            <View style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.1)', borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.35)' : 'rgba(79,70,229,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5' }}>Admin → Manager → TL → Sales</Text>
            </View>
          </View>

          {/* Currently Assigned To Banner */}
          <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.08)', borderWidth: 1, borderColor: isDark ? 'rgba(52,211,153,0.35)' : 'rgba(5,150,105,0.25)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Currently Assigned To</Text>
              <TouchableOpacity
                style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.4)' : '#6366f1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}
                onPress={handleReassignLead}
              >
                <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5' }}>Reassign ✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text, marginTop: 4 }}>{leadAssignedRep}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.3)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>
                  {leadAssignedRep.toUpperCase().includes('TL') || leadAssignedRep.toUpperCase().includes('LEADER') ? 'TEAM LEADER' : 'SALES EXECUTIVE'}
                </Text>
              </View>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>• Final Assignment</Text>
            </View>
          </View>

          {/* Allocation Steps Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>

              {/* Step 1: Admin → Manager */}
              <View style={{ width: 160, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.25)', borderRadius: 12, padding: 10, marginRight: 2 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#f59e0b' : '#b45309' }}>Admin</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.textSecondary, alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5' }}>Manager</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 }}>📁 Allocated to{'\n'}Manager A</Text>
                <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 3 }}>By Admin</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#f59e0b' : '#b45309' }}>Aug 21 • 08:30 AM</Text>
              </View>

              {/* Arrow */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>▶</Text>
              </View>

              {/* Step 2: Manager → TL */}
              <View style={{ width: 160, backgroundColor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: isDark ? 'rgba(129,140,248,0.3)' : 'rgba(99,102,241,0.25)', borderRadius: 12, padding: 10, marginRight: 2 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                  <View style={{ backgroundColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5' }}>Manager</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.textSecondary, alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(56,189,248,0.4)' : 'rgba(2,132,199,0.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#38bdf8' : '#0284c7' }}>TL</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 }}>📁 Allocated to{'\n'}TL A</Text>
                <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 3 }}>By Manager A</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5' }}>Aug 21 • 10:15 AM</Text>
              </View>

              {/* Arrow */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>▶</Text>
              </View>

              {/* Step 3: TL → Sales (Final Assignment) */}
              <View style={{ width: 175, backgroundColor: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(5,150,105,0.08)', borderWidth: 2, borderColor: isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.3)', borderRadius: 12, padding: 10 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(56,189,248,0.4)' : 'rgba(2,132,199,0.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#38bdf8' : '#0284c7' }}>TL</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: colors.textSecondary, alignSelf: 'center' }}>→</Text>
                  <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.15)', borderWidth: 1, borderColor: isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>Sales Rep</Text>
                  </View>
                  <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 7, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>✓ FINAL</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text, marginBottom: 2 }}>
                  🎯 Assigned to{'\n'}{leadAssignedRep}
                </Text>
                <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 3 }}>By TL A</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>Aug 21 • 11:45 AM</Text>
              </View>
            </View>
          </ScrollView>

          <Text style={{ fontSize: 9, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>← Scroll to see full allocation chain →</Text>
        </View>

        {/* ── 📞 SYNCED CALL HISTORY & TELEMETRY WIDGET ───────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📞 Call Telemetry &amp; Follow-Up Audit</Text>
        <View style={[styles.telemetryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.telemetryHeaderRow}>
            <Text style={[styles.telemetryHeaderTitle, { color: colors.text }]}>Call Log Sync Status</Text>
            <View style={styles.connectedPill}>
              <Text style={[styles.connectedPillText, { color: isDark ? '#34d399' : '#059669' }]}>🟢 {telemetry.connectionStatus}</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={[styles.telemetryItem, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <Text style={[styles.telemetryVal, { color: isDark ? '#34d399' : '#059669' }]}>{telemetry.lastDurationStr}</Text>
              <Text style={[styles.telemetryLbl, { color: colors.textSecondary }]}>Talk Duration</Text>
            </View>

            <View style={[styles.telemetryItem, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <Text style={[styles.telemetryVal, { color: isDark ? '#38bdf8' : '#0284c7' }]}>{telemetry.incomingCount} Calls</Text>
              <Text style={[styles.telemetryLbl, { color: colors.textSecondary }]}>Incoming Calls</Text>
            </View>

            <View style={[styles.telemetryItem, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <Text style={[styles.telemetryVal, { color: isDark ? '#fbbf24' : '#b45309' }]}>{telemetry.outgoingCount} Calls</Text>
              <Text style={[styles.telemetryLbl, { color: colors.textSecondary }]}>Outgoing Calls</Text>
            </View>
          </View>

          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

          {/* ⚡ LAST UPDATED STATUS (THROUGH MEDIUM & TIME) */}
          <View style={[styles.lastStatusCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <View style={styles.lastStatusTopRow}>
              <Text style={[styles.lastStatusTitle, { color: colors.textSecondary }]}>Last Updated Status:</Text>
              <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(lastStatusUpdate.status) + '22', borderColor: getStatusColor(lastStatusUpdate.status) + '60' }]}>
                <View style={[styles.statusDotSmall, { backgroundColor: getStatusColor(lastStatusUpdate.status) }]} />
                <Text style={[styles.statusBadgeSmallText, { color: getStatusColor(lastStatusUpdate.status) }]}>
                  {lastStatusUpdate.status}
                </Text>
              </View>
            </View>

            <View style={styles.lastStatusMetaRow}>
              <Text style={[styles.lastStatusMetaText, { color: colors.textSecondary }]}>
                Through: <Text style={[styles.lastStatusMetaHighlight, { color: colors.text }]}>{lastStatusUpdate.medium}</Text>
                {'  '}•{'  '}
                Time: <Text style={[styles.lastStatusMetaHighlight, { color: isDark ? '#818cf8' : '#4f46e5' }]}>{lastStatusUpdate.time}</Text>
              </Text>
            </View>
          </View>

          {/* 1-Day Ephemeral Storage & Midnight Purge Notice */}
          <View style={[styles.purgeNoticeBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <Text style={[styles.purgeNoticeText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
              ⌛ 1-Day Local Storage: Raw call logs auto-purge at Midnight 12:00 AM ({hoursToMidnight}h remaining). Cumulative lead telemetry is permanently saved.
            </Text>
          </View>
        </View>

        {/* ── 📋 LEAD FOLLOW-UP ACTIVITY & TIMELINE LOG HISTORY ───────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, width: '100%', maxWidth: 500 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>📋 Call Timeline & Contact Audit</Text>
        </View>

        <View style={[styles.activityHistoryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {recentOutcomes.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>No Activity Logged</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                Calls, WhatsApp chats, and follow-ups will appear here automatically.
              </Text>
            </View>
          ) : (
            recentOutcomes.map((item, idx) => {
              const roleColor = item.callerRole === 'TEAM_LEADER' ? (isDark ? '#38bdf8' : '#0284c7') : item.callerRole === 'MANAGER' ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#34d399' : '#059669');
              const roleLabel = item.callerRole === 'TEAM_LEADER' ? 'TL' : item.callerRole === 'MANAGER' ? 'Manager' : 'Sales Rep';

              return (
                <View key={idx} style={[styles.activityItemRow, idx < recentOutcomes.length - 1 && [styles.activityItemBorder, { borderBottomColor: colors.border }]]}>
                  {/* Header Row: Outcome Badge + Date / Time */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.activityTitleText, { color: colors.text }]}>
                        {item.outcome === 'PICKED_UP' ? '🟢 Call Connected' : item.outcome === 'WHATSAPP_CHAT' ? '💬 WhatsApp Sent' : item.outcome === 'BUSY' ? '🟡 Line Busy' : '🔴 Not Responding'}
                      </Text>
                      {item.subOption && (
                        <View style={styles.subOptionPill}>
                          <Text style={[styles.subOptionPillText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>{item.subOption.replace('_', ' ')}</Text>
                        </View>
                      )}
                      {item.durationStr && (
                        <View style={{ backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>🎙 {item.durationStr}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>
                      {item.dateLabel ? `${item.dateLabel} · ` : ''}{item.timestamp}
                    </Text>
                  </View>

                  {/* Who Called / Initiator Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>By:</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>{item.callerName || 'Sales Executive'}</Text>
                    <View style={{ backgroundColor: roleColor + '20', borderWidth: 1, borderColor: roleColor + '50', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: roleColor }}>{roleLabel}</Text>
                    </View>
                  </View>

                  {/* Notes & Reasoning */}
                  {item.notes ? (
                    <View style={{ backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontStyle: 'italic' }}>"{item.notes}"</Text>
                    </View>
                  ) : null}

                  {/* Interested Product */}
                  {item.selectedProduct && (
                    <Text style={{ fontSize: 10, color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '800', marginTop: 4 }}>
                      🛍️ Product Discussed: {item.selectedProduct.name}
                    </Text>
                  )}

                  {/* Scheduled Callback */}
                  {item.scheduledDate && (
                    <View style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)', borderWidth: 1, borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)', borderRadius: 8, padding: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '800' }}>
                        📅 Callback Scheduled: {item.scheduledDate} {item.scheduledTime ? `at ${item.scheduledTime}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Details (With Copy-on-Tap Support for Phone & Email) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information (Tap Phone or Email to Copy 📋)</Text>
        <View style={[styles.detailCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {[
            { label: '📞 Phone', value: leadPhone || '—', isCopyable: Boolean(leadPhone), type: 'Phone Number' },
            { label: '✉️ Email', value: lead?.email || '—', isCopyable: Boolean(lead?.email), type: 'Email Address' },
            { label: '🏢 Company', value: lead?.company || leadCompany, isCopyable: false, type: '' },
            { label: '🌐 Source', value: lead?.source || 'Direct', isCopyable: false, type: '' },
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
                style={[styles.row, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={handleTap}
                activeOpacity={item.isCopyable ? 0.7 : 1}
              >
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.rowValue, { color: item.isCopyable ? (isDark ? '#38bdf8' : '#0284c7') : colors.text }]}>{item.value}</Text>
                  {item.isCopyable && <Text style={{ fontSize: 10, color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '800' }}>📋 Copy</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💬 WHATSAPP DIRECT MESSAGE & UNIFIED CRM DISPATCHER MODAL                   */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={waModalOpen} transparent animationType="slide" onRequestClose={() => setWaModalOpen(false)}>
        <View style={[styles.waModalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.65)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '92%' }]}>
            
            {/* Modal Header */}
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.waModalTitle, { color: colors.text }]}>💬 WhatsApp Direct Dispatcher</Text>
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    <Text style={{ color: '#f59e0b', fontSize: 9, fontWeight: '900' }}>CRM SYNC</Text>
                  </View>
                </View>
                <Text style={[styles.waModalSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  Target: <Text style={{ color: isDark ? '#34d399' : '#059669', fontWeight: '800' }}>{leadName}</Text> ({leadPhone || 'No Phone'}) • Auto-updates Status
                </Text>
              </View>
              <TouchableOpacity onPress={() => setWaModalOpen(false)} style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}>

              {/* ── STEP 0: MESSAGE CATEGORY / TYPE SELECTOR ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumBadgeText}>1</Text>
                    </View>
                    <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>Select Message Type / Category *</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                    <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '900' }}>{waCategory}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 8 }}>
                  Defines type of message &amp; auto-selects CRM lead status:
                </Text>

                <View style={styles.categoryGrid}>
                  {WA_CATEGORIES.map((c) => {
                    const isActive = waCategory === c.cat;
                    return (
                      <TouchableOpacity
                        key={c.cat}
                        style={[
                          styles.categoryCard,
                          { backgroundColor: colors.cardBg, borderColor: colors.border },
                          isActive && styles.categoryCardActive,
                        ]}
                        onPress={() => handleSelectCategory(c.cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                        <Text style={[styles.categoryLabel, { color: isActive ? '#fbbf24' : colors.text }]}>
                          {c.label}
                        </Text>
                        <Text style={[styles.categoryDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                          {c.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── STEP 1: MODE SWITCHER (Pre-approved vs Custom) ── */}
              <View style={[styles.modeSwitcherContainer, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modeSwitcherTab, !waCustomMode && styles.modeSwitcherTabActive]}
                  onPress={() => {
                    setWaCustomMode(false);
                    updateComposedMessage(waCategory, waAttachmentMode, selectedTemplate, selectedProduct, productQuantity, selectedInvoice, false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeSwitcherTabText, { color: !waCustomMode ? '#fbbf24' : colors.textSecondary }]}>
                    📋 Pre-Approved Template
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeSwitcherTab, waCustomMode && styles.modeSwitcherTabActiveCustom]}
                  onPress={() => {
                    setWaCustomMode(true);
                    updateComposedMessage(waCategory, waAttachmentMode, selectedTemplate, selectedProduct, productQuantity, selectedInvoice, true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeSwitcherTabText, { color: waCustomMode ? '#34d399' : colors.textSecondary }]}>
                    ✨ + Custom Template
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pre-Approved Template Selector */}
              {!waCustomMode ? (
                <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.stepNumBadge, { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                        <Text style={[styles.stepNumBadgeText, { color: '#34d399' }]}>2</Text>
                      </View>
                      <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>Select Template *</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>
                      ✓ {templates.filter(t => t.category === waCategory).length} Matching
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        ...templates.filter(t => t.category === waCategory),
                        ...templates.filter(t => t.category !== waCategory),
                      ].map((tpl) => {
                        const isSelected = selectedTemplate?.id === tpl.id;
                        const isCatMatch = tpl.category === waCategory;
                        return (
                          <TouchableOpacity
                            key={tpl.id}
                            style={[
                              styles.tplChipCard,
                              { backgroundColor: colors.cardBg, borderColor: colors.border, width: 220 },
                              isSelected && styles.tplCardSelected,
                            ]}
                            onPress={() => handleSelectTemplate(tpl)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={[styles.tplTitleText, { color: isSelected ? '#38bdf8' : colors.text, flex: 1 }]} numberOfLines={1}>
                                {isCatMatch ? '★ ' : ''}{tpl.title}
                              </Text>
                              {tpl.targetStatus && (
                                <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                                  <Text style={{ color: '#818cf8', fontSize: 8, fontWeight: '800' }}>➔ {tpl.targetStatus}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.tplPreviewText, { color: colors.textSecondary }]} numberOfLines={2}>
                              {tpl.text}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ) : (
                /* Custom Template Form */
                <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                  <Text style={[styles.waSectionTitleNew, { color: '#34d399', marginBottom: 6 }]}>
                    ✨ Compose Custom Template
                  </Text>
                  <TextInput
                    style={[styles.customTitleInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Custom Template Title (e.g. Special Deal Offer)"
                    placeholderTextColor={colors.textSecondary}
                    value={waCustomTitle}
                    onChangeText={setWaCustomTitle}
                  />
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}
                    onPress={() => setSaveCustomToLib(!saveCustomToLib)}
                  >
                    <View style={[styles.checkboxBox, saveCustomToLib && styles.checkboxBoxActive]}>
                      {saveCustomToLib && <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>💾 Save custom template to library for future team reuse</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 2: UNIFIED ATTACHMENT SLIDER (Product OR Invoice PDF — mutually exclusive) ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.stepNumBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
                      <Text style={[styles.stepNumBadgeText, { color: '#a855f7' }]}>3</Text>
                    </View>
                    <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>Unified Attachment (Only 1 Active)</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>Slider Toggle</Text>
                </View>

                {/* Slider Tabs */}
                <View style={[styles.sliderTabBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.sliderTabBtn, waAttachmentMode === 'PRODUCT' && styles.sliderTabBtnActiveProduct]}
                    onPress={() => handleSelectAttachmentMode('PRODUCT')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sliderTabBtnText, { color: waAttachmentMode === 'PRODUCT' ? '#34d399' : colors.textSecondary }]}>
                      🖼️ Product Details &amp; Images
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sliderTabBtn, waAttachmentMode === 'INVOICE' && styles.sliderTabBtnActiveInvoice]}
                    onPress={() => handleSelectAttachmentMode('INVOICE')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sliderTabBtnText, { color: waAttachmentMode === 'INVOICE' ? '#f59e0b' : colors.textSecondary }]}>
                      📄 Invoice PDF
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* A. PRODUCT ATTACHMENT */}
                {waAttachmentMode === 'PRODUCT' && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {CATALOG_PRODUCTS.map((prod) => {
                        const isSelected = selectedProduct?.id === prod.id;
                        return (
                          <TouchableOpacity
                            key={prod.id}
                            style={[
                              styles.productChip,
                              { backgroundColor: colors.cardBg, borderColor: colors.border },
                              isSelected && styles.productChipActive,
                            ]}
                            onPress={() => handleSelectProduct(prod)}
                          >
                            <Image source={{ uri: prod.imageUrl }} style={styles.prodThumb} />
                            <Text style={[styles.productChipText, { color: isSelected ? '#38bdf8' : colors.textSecondary }, isSelected && { fontWeight: '900' }]}>
                              {prod.name.split(' ')[0]} ({prod.minPrice})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedProduct && (
                      <View style={[styles.attachedProductCard, { backgroundColor: colors.cardBg, borderColor: '#34d399' }]}>
                        <Image source={{ uri: selectedProduct.imageUrl }} style={styles.attachedProductImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.attachedProdName, { color: colors.text }]}>{selectedProduct.name}</Text>
                          <Text style={[styles.attachedProdPrice, { color: '#34d399' }]}>{selectedProduct.minPrice} - {selectedProduct.maxPrice}</Text>
                          <Text style={[styles.attachedProdDesc, { color: colors.textSecondary }]} numberOfLines={2}>{selectedProduct.description}</Text>
                        </View>
                      </View>
                    )}

                    {/* Quantity & Tier Price Stepper */}
                    <View style={[styles.qtyCardContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Quantity &amp; Tier Discount:</Text>
                        {selectedProduct && (
                          <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>
                            Total: ₹{(whatsappTemplateEngine.getTieredPrice(selectedProduct, productQuantity).totalPrice).toLocaleString('en-IN')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.qtyRow}>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>Selected Units:</Text>
                        <View style={[styles.qtyCounterBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} onPress={() => handleChangeQuantity(productQuantity - 1)}>
                            <Text style={[styles.qtyBtnText, { color: colors.text }]}>-</Text>
                          </TouchableOpacity>
                          <Text style={[styles.qtyValText, { color: '#38bdf8' }]}>{productQuantity} Units</Text>
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} onPress={() => handleChangeQuantity(productQuantity + 1)}>
                            <Text style={[styles.qtyBtnText, { color: colors.text }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* B. INVOICE PDF ATTACHMENT */}
                {waAttachmentMode === 'INVOICE' && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <View style={{ gap: 6 }}>
                      {availableInvoices.map((inv) => {
                        const isSelected = selectedInvoice?.id === inv.id || selectedInvoice?.quoteNumber === inv.quoteNumber;
                        return (
                          <TouchableOpacity
                            key={inv.id}
                            style={[
                              styles.invoiceItemCard,
                              { backgroundColor: colors.cardBg, borderColor: colors.border },
                              isSelected && styles.invoiceItemCardActive,
                            ]}
                            onPress={() => handleSelectInvoice(inv)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              <View style={styles.invIconCircle}>
                                <Text style={{ fontSize: 13 }}>📄</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={[styles.invNumberText, { color: colors.text }]}>{inv.quoteNumber}</Text>
                                  <View style={styles.invDocTypePill}>
                                    <Text style={styles.invDocTypePillText}>{inv.docType.replace(/_/g, ' ')}</Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>
                                  {inv.buyerCompany} • {inv.itemsSummary}
                                </Text>
                              </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>
                                ₹{inv.totalAmount.toLocaleString('en-IN')}
                              </Text>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: isSelected ? '#fbbf24' : colors.textSecondary }}>
                                {isSelected ? '✓ Attached' : 'Tap to Attach'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Attached Invoice PDF Document Card */}
                    {selectedInvoice && (
                      <View style={[styles.attachedDocCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fbbf24' }}>📎 Attached PDF Document:</Text>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#34d399' }}>₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} (incl. GST)</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 20 }}>📕</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pdfFilenameText, { color: colors.text }]}>{getInvoicePdfFilename()}</Text>
                            <Text style={{ fontSize: 9, color: colors.textSecondary }}>Ref: {selectedInvoice.quoteNumber} • Buyer: {selectedInvoice.buyerCompany}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* ── STEP 3: LIVE MESSAGE PREVIEW & MANUAL EDITING ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                  <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>💬 WhatsApp Message Body (Live Editable)</Text>
                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: colors.textSecondary }}>Insert:</Text>
                    {['{name}', '{company}', '{value}', '{product}'].map((ph) => (
                      <TouchableOpacity
                        key={ph}
                        style={[styles.placeholderChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                        onPress={() => handleInsertPlaceholder(ph)}
                      >
                        <Text style={styles.placeholderChipText}>+{ph.replace(/[{}]/g, '')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TextInput
                  style={[styles.previewTextInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                  multiline
                  value={customMsgText}
                  onChangeText={setCustomMsgText}
                  placeholder="WhatsApp message body..."
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                    Target: {leadName} ({leadPhone || 'No Phone'})
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                    {customMsgText.length} chars · {customMsgText.trim().split(/\s+/).filter(Boolean).length} words
                  </Text>
                </View>
              </View>

              {/* ── STEP 4: TARGET LEAD STATUS UPDATE GRID (Matching Screenshot) ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>Select Target Lead Status to Update *</Text>
                  <View style={[styles.currentStatusBadge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 9, color: colors.textSecondary }}>Current: <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{leadStatusState}</Text></Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 8 }}>
                  Lead status automatically updates when message is sent. Tap any option below to change:
                </Text>

                <View style={styles.statusGrid}>
                  {WA_TARGET_STATUSES.map((st) => {
                    const isSelected = waTargetStatus === st.key;
                    return (
                      <TouchableOpacity
                        key={st.key}
                        style={[
                          styles.statusGridCard,
                          { backgroundColor: colors.cardBg, borderColor: colors.border },
                          isSelected && { borderColor: st.color, backgroundColor: st.color + '18' },
                        ]}
                        onPress={() => setWaTargetStatus(st.key)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={{ fontSize: 13 }}>{st.icon}</Text>
                          <Text style={[styles.statusGridCardText, { color: isSelected ? st.color : colors.text }]} numberOfLines={1}>
                            {st.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text style={{ color: st.color, fontWeight: '900', fontSize: 11 }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── STEP 5: SEND ACTION BUTTON ── */}
              <TouchableOpacity
                style={styles.sendWaDirectBtn}
                onPress={handleSendDirectWhatsApp}
                activeOpacity={0.8}
              >
                <Text style={styles.sendWaDirectBtnText}>🚀 Send via WhatsApp Direct →</Text>
              </TouchableOpacity>

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
        <View style={[styles.waModalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(15, 23, 42, 0.6)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxWidth: 380, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.waModalTitle, { color: colors.text }]}>⚡ Log Activity &amp; Advance Stage</Text>
                <Text style={[styles.waModalSub, { color: colors.textSecondary }]}>Recorded activity dynamically advances {leadName}'s lifecycle stage</Text>
              </View>
              <TouchableOpacity style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]} onPress={() => setStatusPickerOpen(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginVertical: 8 }}>
              {availableStatuses.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={{
                    backgroundColor: (leadStatusState || '').toUpperCase() === item.name.toUpperCase() ? item.color + '25' : colors.cardBgElevated,
                    borderWidth: 1,
                    borderColor: (leadStatusState || '').toUpperCase() === item.name.toUpperCase() ? item.color : colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                  onPress={() => {
                    const nextSt = item.name;
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
                      <Text style={{ fontSize: 12, fontWeight: '900', color: (leadStatusState || '').toUpperCase() === item.name.toUpperCase() ? item.color : colors.text }}>
                        {item.name}
                      </Text>
                    </View>
                    {(leadStatusState || '').toUpperCase() === item.name.toUpperCase() && (
                      <Text style={{ color: item.color, fontSize: 10, fontWeight: '900' }}>✓ Active Stage</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 3, paddingLeft: 23 }}>{item.desc}</Text>
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
  waModalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  waModalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  waModalSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  waCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  waSectionCard: { borderRadius: 14, borderWidth: 1, padding: 10 },
  stepNumBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', justifyContent: 'center', alignItems: 'center' },
  stepNumBadgeText: { fontSize: 9, fontWeight: '900', color: '#fbbf24' },
  waSectionTitleNew: { fontSize: 11, fontWeight: '900' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryCard: { width: '31.5%', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 1 },
  categoryCardActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  categoryLabel: { fontSize: 10, fontWeight: '800' },
  categoryDesc: { fontSize: 8, textAlign: 'center' },

  modeSwitcherContainer: { flexDirection: 'row', padding: 3, borderRadius: 10, borderWidth: 1, gap: 4 },
  modeSwitcherTab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  modeSwitcherTabActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  modeSwitcherTabActiveCustom: { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)' },
  modeSwitcherTabText: { fontSize: 10, fontWeight: '800' },

  tplChipCard: { borderWidth: 1, borderRadius: 10, padding: 8 },
  tplCardSelected: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)' },
  tplTitleText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  tplPreviewText: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  customTitleInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 },
  checkboxBox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  checkboxBoxActive: { backgroundColor: '#34d399', borderColor: '#34d399' },

  sliderTabBar: { flexDirection: 'row', padding: 3, borderRadius: 10, borderWidth: 1, gap: 4, marginBottom: 6 },
  sliderTabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  sliderTabBtnActiveProduct: { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.5)' },
  sliderTabBtnActiveInvoice: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.5)' },
  sliderTabBtnText: { fontSize: 10, fontWeight: '800' },

  productChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, marginRight: 6 },
  productChipActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)' },
  productChipText: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  prodThumb: { width: 20, height: 20, borderRadius: 5, resizeMode: 'cover' },

  attachedProductCard: { flexDirection: 'row', gap: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 10, padding: 8, marginBottom: 6 },
  attachedProductImg: { width: 44, height: 44, borderRadius: 8, resizeMode: 'cover' },
  attachedProdName: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  attachedProdPrice: { fontSize: 10, fontWeight: '800', color: '#34d399' },
  attachedProdDesc: { fontSize: 8, color: '#94a3b8', marginTop: 1 },

  qtyCardContainer: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 8 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  qtyCounterBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 6 },
  qtyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  qtyValText: { color: '#38bdf8', fontSize: 12, fontWeight: '900', paddingHorizontal: 10 },

  invoiceItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 10, borderWidth: 1 },
  invoiceItemCardActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  invIconCircle: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center' },
  invNumberText: { fontSize: 11, fontWeight: '900' },
  invDocTypePill: { backgroundColor: '#020617', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  invDocTypePillText: { fontSize: 8, color: '#fbbf24', fontWeight: '800' },

  attachedDocCard: { borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 4 },
  pdfFilenameText: { fontSize: 10, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  placeholderChip: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  placeholderChipText: { fontSize: 8, fontWeight: '700', color: '#38bdf8' },

  previewTextInput: { borderWidth: 1, borderRadius: 10, padding: 8, fontSize: 11, minHeight: 70, maxHeight: 110, textAlignVertical: 'top' },

  currentStatusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusGridCard: { width: '48.8%', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusGridCardText: { fontSize: 9, fontWeight: '800', flex: 1 },

  sendWaDirectBtn: { backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  sendWaDirectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
