/**
 * LeadDetailScreen.tsx — DAS CRM Android
 * 1:1 Parity with Web EmployeeLeadWorkspace:
 *  1. Working 📞 Call Now with Post-Call Outcome Logger & Auto Status Engine
 *  2. 💬 WhatsApp Direct & CRM Dispatcher with Live Product & Invoice PDF Attachments
 *  3. ☁️ WhatsApp Cloud API & 🚀 Email Marketing / Direct Email Dispatcher
 *  4. 📅 Meeting & Follow-up Scheduler with Auto Status Transition
 *  5. ✏️ In-Place Lead Details Editor (Name, Phone, Email, Company, Budget, Requirement, City)
 *  6. 🔗 Dynamic Real-Time Lead Allocation Trail (Admin → Manager → TL → Sales)
 *  7. 📊 Real-Time Call Telemetry & Contact Audit History (Synced with Backend Activities)
 *  8. 💳 Quotation, Invoice & Payment Status Tracker (Auto Mark WON on Full Payment)
 *  9. 🔄 Live Cloud Sync Engine with Manual Sync Header Action
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LeadsStackParamList } from '../../App';
import { callSyncEngine, LeadCallSummary } from '../services/callSyncEngine';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { apiService, LeadItem, AIScoreData } from '../services/apiService';
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
import { productCatalogService } from '../services/productCatalogService';
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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  const leadId = String(lead?.id || 'lead-1');
  const [leadData, setLeadData] = useState<LeadItem | null>(lead || null);
  const [isLoadingLead, setIsLoadingLead] = useState<boolean>(false);

  const leadName = leadData?.name || lead?.name || 'Lead Details';
  const leadPhone = leadData?.phone || lead?.phone || '';
  const leadCompany = leadData?.company || lead?.company || 'Independent Business';
  const leadValue = leadData?.value || lead?.value || '₹0';
  const leadEmail = leadData?.email || lead?.email || '—';
  const leadRequirement = leadData?.requirement || lead?.requirement || '—';
  const leadBudget = leadData?.budget || lead?.budget || '—';
  const leadCity = leadData?.city || lead?.city || '—';
  const leadSource = leadData?.source || lead?.source || 'Direct';

  // Lead Assigned Rep State & Reassignment
  const [leadAssignedRep, setLeadAssignedRep] = useState<string>(
    leadData?.assignedRep || lead?.assignedRep || 'Unassigned'
  );

  // Dynamic Lead Status State
  const [leadStatusState, setLeadStatusState] = useState<string>(
    leadData?.status || lead?.status || 'NEW LEAD'
  );

  // ⚡ Track Last Updated Status, Medium, and Timestamp
  const [lastStatusUpdate, setLastStatusUpdate] = useState<{
    status: string;
    medium: string;
    time: string;
  }>({
    status: leadData?.status || lead?.status || 'NEW LEAD',
    medium: '—',
    time: 'Never',
  });

  // 📞 Post-Call Outcome & Status Modal State & History
  const [postCallModalOpen, setPostCallModalOpen] = useState(false);
  const [recentOutcomes, setRecentOutcomes] = useState<CallOutcomeData[]>([]);

  // 🔄 Function to fetch lead and timeline activities from backend
  const fetchLeadDetailsAndActivities = useCallback(async () => {
    if (!leadId) return;
    setIsSyncing(true);
    try {
      const [fetchedLead, activities] = await Promise.all([
        apiService.getLeadById(token, leadId),
        apiService.getLeadActivities(token, leadId),
      ]);

      if (fetchedLead) {
        setLeadData(fetchedLead);
        if (fetchedLead.assignedRep) setLeadAssignedRep(fetchedLead.assignedRep);
        if (fetchedLead.status) setLeadStatusState(fetchedLead.status);
        setLastStatusUpdate({
          status: fetchedLead.status || 'NEW LEAD',
          medium: 'Cloud Database',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      if (Array.isArray(activities) && activities.length > 0) {
        const mapped: CallOutcomeData[] = activities.map((a: any) => {
          const actType = (a.type || a.activityType || '').toUpperCase();
          const meta = typeof a.metadata === 'object' && a.metadata !== null ? a.metadata : {};
          const isCall = actType.includes('CALL');
          const isWa = actType.includes('WHATSAPP') || actType.includes('WA');

          let outcome: 'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT' = 'PICKED_UP';
          if (isWa) outcome = 'WHATSAPP_CHAT';
          else if (a.outcome === 'BUSY' || meta.outcome === 'BUSY') outcome = 'BUSY';
          else if (a.outcome === 'NOT_RESPONDING' || meta.outcome === 'NOT_RESPONDING') outcome = 'NOT_RESPONDING';
          else if (a.outcome === 'SWITCHED_OFF' || a.outcome === 'SWITCH_OFF' || meta.outcome === 'SWITCHED_OFF') outcome = 'SWITCHED_OFF';

          const createdDate = a.createdAt ? new Date(a.createdAt) : new Date();
          const durSecs = a.durationSeconds || meta.durationSeconds || (isCall ? 90 : 0);
          const durStr = durSecs > 0 ? `${Math.floor(durSecs / 60)}m ${durSecs % 60}s` : undefined;

          const actorName = a.user
            ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim()
            : a.performedBy || a.userName || meta.by || leadAssignedRep || 'Sales Rep';

          const actorRole = a.user?.role?.name || a.user?.role || a.userRole || meta.byRole || 'SALES_EXEC';

          let subOption: 'TALKED' | 'CALL_LATER' | 'WILL_VISIT' | 'CATALOGUE_SHARED' | 'INTERESTED' | 'WA_SENT' | 'WA_RESPONDED' = isWa ? 'WA_SENT' : 'TALKED';
          if (a.subject === 'CATALOGUE_SHARED' || meta.subOption === 'CATALOGUE_SHARED') subOption = 'CATALOGUE_SHARED';
          else if (a.subject === 'INTERESTED' || meta.subOption === 'INTERESTED') subOption = 'INTERESTED';
          else if (a.subject === 'WILL_VISIT' || meta.subOption === 'WILL_VISIT') subOption = 'WILL_VISIT';
          else if (a.subject === 'CALL_LATER' || meta.subOption === 'CALL_LATER') subOption = 'CALL_LATER';

          return {
            leadId,
            leadName: fetchedLead?.name || leadName,
            phone: fetchedLead?.phone || leadPhone,
            outcome,
            subOption,
            notes: a.notes || a.description || meta.notes || (isWa ? 'WhatsApp communication logged' : 'Call completed'),
            durationStr: durStr,
            callerName: actorName,
            callerRole: actorRole,
            dateLabel: createdDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            timestamp: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            scheduledDate: meta.followUpDate || a.scheduledDate,
            scheduledTime: meta.followUpTime || a.scheduledTime,
          };
        });
        setRecentOutcomes(mapped);
      }
    } catch (e) {
      console.warn('Sync warning:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [leadId, token, leadName, leadPhone, leadAssignedRep]);

  useEffect(() => {
    fetchLeadDetailsAndActivities();
  }, [fetchLeadDetailsAndActivities]);

  // Live Call Telemetry State
  const [telemetry, setTelemetry] = useState<LeadCallSummary>({
    lastCalledAt: 'Never',
    connectionStatus: 'CONNECTED',
    lastDurationStr: '0s',
    totalTalkTimeSeconds: 0,
    incomingCount: 0,
    outgoingCount: 0,
    lastFollowupAt: 'Never',
  });

  const [hoursToMidnight, setHoursToMidnight] = useState(7);

  // 💬 WhatsApp Direct Engine State & Unified Dispatcher Workflow
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waCategory, setWaCategory] = useState<TemplateCategory>('OUTREACH');
  const [waAttachmentMode, setWaAttachmentMode] = useState<'PRODUCT' | 'INVOICE'>('PRODUCT');
  const [waCustomMode, setWaCustomMode] = useState(false);
  const [waCustomTitle, setWaCustomTitle] = useState('Custom Lead Message');
  const [waTargetStatus, setWaTargetStatus] = useState('Contacted');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(DEFAULT_TEMPLATES[0]);
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(SAMPLE_INVOICES[0]);
  const [availableInvoices] = useState<InvoiceItem[]>(SAMPLE_INVOICES);
  const [customMsgText, setCustomMsgText] = useState('');
  const [saveCustomToLib, setSaveCustomToLib] = useState(true);

  // ✉️ Direct Email & Email Marketing Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // 📅 Meeting & Follow-up Scheduler Modal State
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Product Demo & Discovery');
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetingTime, setMeetingTime] = useState('11:00 AM');
  const [meetingType, setMeetingType] = useState<'VIRTUAL' | 'IN_PERSON' | 'CALL'>('VIRTUAL');
  const [meetingNotes, setMeetingNotes] = useState('');

  // ✏️ Edit Lead Info Modal State
  const [editLeadModalOpen, setEditLeadModalOpen] = useState(false);
  const [editName, setEditName] = useState(leadName);
  const [editPhone, setEditPhone] = useState(leadPhone);
  const [editEmail, setEditEmail] = useState(leadEmail === '—' ? '' : leadEmail);
  const [editCompany, setEditCompany] = useState(leadCompany === '—' ? '' : leadCompany);
  const [editValue, setEditValue] = useState(leadValue);
  const [editRequirement, setEditRequirement] = useState(leadRequirement === '—' ? '' : leadRequirement);
  const [editCity, setEditCity] = useState(leadCity === '—' ? '' : leadCity);

  // Dynamic Status Picker Modal State
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<LeadStatusItem[]>(DEFAULT_ANDROID_STATUSES);

  // 💳 Payment Status Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // 🤖 AI Score Modal
  const [aiScoreModalOpen, setAiScoreModalOpen] = useState(false);

  // Load live products from product catalog service
  useEffect(() => {
    productCatalogService.getProducts().then((prods) => {
      if (Array.isArray(prods) && prods.length > 0) {
        const mapped: ProductItem[] = prods.map(p => ({
          id: p.id,
          name: p.name,
          minPrice: `₹${p.minPrice.toLocaleString('en-IN')}`,
          maxPrice: `₹${p.maxPrice.toLocaleString('en-IN')}`,
          category: p.category,
          description: p.description || '',
          features: p.features || [],
          imageUrl: p.imageUrl || '',
          priceTiers: [
            { minQty: p.moq || 1, maxQty: (p.moq || 1) * 5, unitPrice: p.minPrice, label: `Standard (${p.moq || 1}+)` },
            { minQty: (p.moq || 1) * 6, maxQty: (p.moq || 1) * 20, unitPrice: Math.round(p.minPrice * 0.9), label: `Volume (${(p.moq || 1) * 6}+)` },
          ],
        }));
        setLiveProducts(mapped);
        setSelectedProduct(mapped[0]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getStoredStatuses().then(setAvailableStatuses);
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
  }, [leadName, leadCompany, leadValue]);

  // List of assignable sales reps from moduleAccessStore
  const assignableRepOptions = useMemo(() => {
    const validUsers = (managedUsers || []).filter(u => isBatchAssignableRole(u.role));
    if (validUsers.length > 0) {
      return validUsers.map(u => {
        const r = (u.role || '').toUpperCase();
        const tag = r.includes('LEADER') || r.includes('TL') ? 'TL' : 'Sales Exec';
        return `${u.name} (${tag})`;
      });
    }
    return ['Sachin Puri (TL)', 'Nandini Rastogi (Sales Exec)', 'Sulekha Tomar (Sales Exec)', 'Sadhana (Sales Exec)'];
  }, [managedUsers]);

  // Dynamic Lead Allocation Trail computation
  const allocationTrail = useMemo(() => {
    const dateObj = leadData?._updatedAt ? new Date(leadData._updatedAt) : new Date();
    const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const assignedName = leadAssignedRep && leadAssignedRep !== 'Unassigned' ? leadAssignedRep : 'Sales Executive';
    const isTL = assignedName.toUpperCase().includes('TL') || assignedName.toUpperCase().includes('LEADER');

    return [
      {
        id: 'step-1',
        fromRole: 'Admin',
        fromColor: '#f59e0b',
        toRole: 'Manager',
        toColor: '#818cf8',
        title: `Ingestion: ${leadSource}`,
        by: 'Admin / System',
        time: `${dateStr} • ${timeStr}`,
      },
      {
        id: 'step-2',
        fromRole: 'Manager',
        fromColor: '#818cf8',
        toRole: 'TL',
        toColor: '#38bdf8',
        title: 'Team Allocation',
        by: 'Aditya Kumar Rai (Manager)',
        time: `${dateStr} • ${timeStr}`,
      },
      {
        id: 'step-3',
        fromRole: 'TL',
        fromColor: '#38bdf8',
        toRole: isTL ? 'Team Leader' : 'Sales Rep',
        toColor: '#34d399',
        title: `Assigned: ${assignedName}`,
        by: isTL ? 'Manager' : 'Sachin Puri (TL)',
        time: `${dateStr} • ${timeStr}`,
        isFinal: true,
      },
    ];
  }, [leadData, leadSource, leadAssignedRep]);

  const handleReassignLead = () => {
    const isUnassigned = !leadAssignedRep || leadAssignedRep === 'Unassigned' || leadAssignedRep === '—';
    const assignOptions = [
      ...assignableRepOptions.map(p => ({
        text: p,
        onPress: () => {
          setLeadAssignedRep(p);
          apiService.updateLead(token, leadId, { assignedRep: p }).catch(() => {});
          apiService.logLeadActivity(token, {
            leadId,
            activityType: 'NOTE',
            notes: `Lead reassigned to ${p}`,
            subject: 'Lead Reassigned',
            outcome: 'REASSIGNED',
          }).catch(() => {});
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
      '👤 Reassign Lead',
      `Assign ${leadName} (${isUnassigned ? 'Currently Unassigned' : leadAssignedRep}) to:`,
      assignOptions
    );
  };

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

  // 📞 CALL NOW HANDLER
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
      callerName: data.callerName || currentUser?.name || 'Sales Rep',
      callerRole: data.callerRole || userRole,
      dateLabel: data.dateLabel || 'Today',
      timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecentOutcomes(prev => [enrichedData, ...prev]);
    setTelemetry(prev => ({
      ...prev,
      lastCalledAt: `Today, ${enrichedData.timestamp}`,
      outgoingCount: prev.outgoingCount + 1,
      lastFollowupAt: data.scheduledDate ? `${data.scheduledDate} ${data.scheduledTime || ''}` : `Today, ${enrichedData.timestamp}`,
    }));

    // ⚡ AUTOMATED LEAD STATUS TRANSITION ENGINE
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

    let outcomeMedium = '📞 Phone Call';
    if (data.outcome === 'WHATSAPP_CHAT') {
      outcomeMedium = data.selectedProduct ? '💬 WhatsApp (Catalogue)' : '💬 WhatsApp';
    } else if (data.scheduledDate) {
      outcomeMedium = '📅 Meeting Follow-up';
    }

    const timeString = `Today, ${enrichedData.timestamp}`;

    if (nextStatus && nextStatus !== leadStatusState) {
      setLeadStatusState(nextStatus);
      apiService.updateLeadStatus(token, leadId, nextStatus);
      setLastStatusUpdate({
        status: nextStatus,
        medium: outcomeMedium,
        time: timeString,
      });
      setToastConfig({
        id: String(Date.now()),
        title: '⚡ Status Auto-Updated',
        message: `${updateReason}. Status updated to ${nextStatus}.`,
        type: 'SUCCESS',
      });
    } else {
      setLastStatusUpdate(prev => ({
        ...prev,
        medium: outcomeMedium,
        time: timeString,
      }));
    }

    // Persist activity to backend
    apiService.logLeadActivity(token, {
      activityType: data.outcome === 'WHATSAPP_CHAT' ? 'WHATSAPP' : 'CALL',
      leadId,
      notes: data.notes || `Outcome: ${data.outcome} - ${data.subOption || 'Call'}`,
      subject: data.subOption || 'Outreach',
      outcome: data.outcome,
      durationSeconds: data.durationStr ? 120 : 0,
      metadata: {
        productInterest: data.selectedProduct?.name,
        followUpDate: data.scheduledDate,
        followUpTime: data.scheduledTime,
      },
    }).catch(() => {});
  };

  // 💳 Confirm Payment Outcome
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
      notes: `Invoice Payment Result: ${result.paymentStatus} — ${result.notes || ''}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (result.targetLeadStatus === 'WON') {
      setToastConfig({
        id: String(Date.now()),
        title: '🎉 Deal Won!',
        message: 'Payment verified! Lead marked as WON.',
        type: 'SUCCESS',
      });
    } else {
      setToastConfig({
        id: String(Date.now()),
        title: '📄 Payment Recorded',
        message: `Status updated to ${result.targetLeadStatus}.`,
        type: 'INFO',
      });
    }
  };

  // 📅 Schedule Meeting Handler
  const handleConfirmScheduleMeeting = async () => {
    setMeetingModalOpen(false);
    const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setLeadStatusState('MEETING SCHEDULED');
    setLastStatusUpdate({
      status: 'MEETING SCHEDULED',
      medium: '📅 Meeting Scheduled',
      time: timeString,
    });

    handleSaveCallOutcome({
      leadId,
      leadName,
      phone: leadPhone,
      outcome: 'PICKED_UP',
      subOption: 'CALL_LATER',
      notes: `Scheduled ${meetingType.replace('_', ' ')} (${meetingTitle}) for ${meetingDate} at ${meetingTime}. Notes: ${meetingNotes || 'Standard Discovery'}`,
      scheduledDate: meetingDate,
      scheduledTime: meetingTime,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setToastConfig({
      id: String(Date.now()),
      title: '📅 Meeting Scheduled',
      message: `${meetingTitle} set for ${meetingDate} at ${meetingTime}. Status set to MEETING SCHEDULED.`,
      type: 'SUCCESS',
    });
  };

  // ✉️ Send Direct Email Handler
  const handleSendDirectEmail = () => {
    setEmailModalOpen(false);
    const cleanedEmail = (leadEmail || '').trim();
    if (!cleanedEmail || cleanedEmail === '—' || !cleanedEmail.includes('@')) {
      Alert.alert('Email Missing', 'This lead does not have a valid email address configured.');
      return;
    }

    const mailUrl = `mailto:${cleanedEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    Linking.openURL(mailUrl).catch(() => {
      Alert.alert('Email Client Error', 'Could not launch device email client.');
    });

    const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setLeadStatusState('IN NEGOTIATION');
    setLastStatusUpdate({
      status: 'IN NEGOTIATION',
      medium: '✉️ Direct Email',
      time: timeString,
    });

    apiService.updateLeadStatus(token, leadId, 'IN NEGOTIATION');
    apiService.logLeadActivity(token, {
      leadId,
      activityType: 'EMAIL',
      subject: emailSubject,
      notes: emailBody,
      outcome: 'EMAIL_SENT',
    }).catch(() => {});

    handleSaveCallOutcome({
      leadId,
      leadName,
      phone: leadPhone,
      outcome: 'WHATSAPP_CHAT',
      subOption: 'WA_SENT',
      notes: `Sent Email "${emailSubject}" to ${cleanedEmail}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setToastConfig({
      id: String(Date.now()),
      title: '✉️ Email Dispatched',
      message: `Email dispatched to ${leadName}. Status updated to IN NEGOTIATION.`,
      type: 'SUCCESS',
    });
  };

  // ✏️ Save Lead Info Updates
  const handleSaveLeadInfo = async () => {
    setEditLeadModalOpen(false);
    setIsLoadingLead(true);
    try {
      const updates = {
        name: editName,
        phone: editPhone,
        email: editEmail,
        company: editCompany,
        value: editValue,
        requirement: editRequirement,
        city: editCity,
      };
      await apiService.updateLead(token, leadId, updates);
      setLeadData(prev => ({
        ...(prev || { id: leadId, status: leadStatusState, source: leadSource, priority: 'Medium' }),
        ...updates,
      }));
      setToastConfig({
        id: String(Date.now()),
        title: '✏️ Lead Details Saved',
        message: 'Lead details synchronized with cloud database.',
        type: 'SUCCESS',
      });
    } catch (e) {
      Alert.alert('Update Failed', 'Could not save lead details.');
    } finally {
      setIsLoadingLead(false);
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

  const rawAiScore = leadData?.aiScore?.totalScore || (lead as any)?.aiScore?.totalScore || (lead as any)?.score || 8.7;
  const aiScoreDisplay = typeof rawAiScore === 'number' ? rawAiScore.toFixed(1) : String(rawAiScore);

  const aiScoreData: AIScoreData = useMemo(() => {
    const candidateScore = leadData?.aiScore || lead?.aiScore;
    if (candidateScore && typeof candidateScore === 'object' && 'totalScore' in candidateScore) {
      return candidateScore as AIScoreData;
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
  }, [lead, leadData, rawAiScore]);

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 10 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Top Header Row: Back Button & Manual Live Cloud Sync */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 500, marginBottom: 8 }}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back to Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncHeaderBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(79,70,229,0.1)', borderColor: isDark ? 'rgba(99,102,241,0.4)' : '#6366f1' }]}
            onPress={fetchLeadDetailsAndActivities}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={isDark ? '#818cf8' : '#4f46e5'} />
            ) : (
              <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5' }}>🔄 Sync Cloud</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lead Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>
                {leadName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{leadName}</Text>
                <TouchableOpacity onPress={() => setEditLeadModalOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 13 }}>✏️</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.company, { color: colors.textSecondary }]}>
                {leadCompany} • {leadValue}
              </Text>
            </View>
            {/* 🔥 AI SCORE BADGE */}
            <TouchableOpacity
              style={styles.aiScoreBadgeHeader}
              onPress={() => setAiScoreModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.aiScoreTextHeader}>🔥 {aiScoreDisplay} AI Score</Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC LEAD STATUS BADGE */}
          <TouchableOpacity
            style={[styles.statusBadgeContainer, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}
            onPress={() => setStatusPickerOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{leadStatusState || lead?.status || 'NEW LEAD'}</Text>
            <View style={[styles.autoActivityPill, { backgroundColor: statusColor + '25', borderColor: statusColor + '40' }]}>
              <Text style={[styles.autoActivityText, { color: statusColor }]}>⚡ Change Status ▾</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Toolbar (6 Glassmorphism Cards) */}
        <View style={{ width: '100%', maxWidth: 500, gap: 8, marginBottom: 16 }}>
          {/* Row 1: Call, WhatsApp, WA Cloud */}
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
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#a5b4fc' : '#4f46e5', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>☁️ WA Cloud</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Direct Email, Update Status, Schedule Meeting */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(192,132,252,0.15)' : 'rgba(147,51,234,0.12)', borderWidth: 1, borderColor: isDark ? '#c084fc' : '#9333ea', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                setEmailSubject(`Proposal & Product Discussion for ${leadCompany}`);
                setEmailBody(`Hi ${leadName},\n\nThank you for connecting with us regarding your requirement for ${leadCompany}.\n\nPlease let us know your preferred time for a quick discovery call.\n\nBest regards,\n${currentUser?.name || 'DAS Team'}`);
                setEmailModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#c084fc' : '#7c3aed', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>✉️ Direct Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.12)', borderWidth: 1, borderColor: isDark ? '#38bdf8' : '#0284c7', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setMeetingModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📅 Meeting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.12)', borderWidth: 1, borderColor: isDark ? '#fbbf24' : '#d97706', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setStatusPickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: isDark ? '#fbbf24' : '#b45309', fontSize: 11, fontWeight: '900' }} numberOfLines={1}>📝 Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 🔗 LEAD ALLOCATION & ASSIGNMENT CHAIN TRAIL ───────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔗 Lead Allocation &amp; Assignment Chain</Text>
        <View style={[styles.telemetryCard, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingBottom: 8 }]}>
          {/* Section Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5' }}>Live Delegation Trail</Text>
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
              {allocationTrail.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <View style={{ width: 165, backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderRadius: 12, padding: 10, marginRight: 2 }}>
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                      <View style={{ backgroundColor: step.fromColor + '20', borderWidth: 1, borderColor: step.fromColor + '40', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 8, fontWeight: '900', color: step.fromColor }}>{step.fromRole}</Text>
                      </View>
                      <Text style={{ fontSize: 8, color: colors.textSecondary, alignSelf: 'center' }}>→</Text>
                      <View style={{ backgroundColor: step.toColor + '20', borderWidth: 1, borderColor: step.toColor + '40', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 8, fontWeight: '900', color: step.toColor }}>{step.toRole}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text, marginBottom: 2 }} numberOfLines={1}>{step.title}</Text>
                    <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 3 }}>By {step.by}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: step.toColor }}>{step.time}</Text>
                  </View>
                  {idx < allocationTrail.length - 1 && (
                    <View style={{ width: 18, alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>▶</Text>
                    </View>
                  )}
                </React.Fragment>
              ))}
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

          {/* ⚡ LAST UPDATED STATUS */}
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

          {/* 1-Day Storage Notice */}
          <View style={[styles.purgeNoticeBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
            <Text style={[styles.purgeNoticeText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
              ⌛ 1-Day Local Storage: Raw call logs auto-purge at Midnight 12:00 AM ({hoursToMidnight}h remaining). Cumulative lead telemetry is permanently saved.
            </Text>
          </View>
        </View>

        {/* ── 📋 LEAD FOLLOW-UP ACTIVITY & TIMELINE LOG HISTORY ───────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, width: '100%', maxWidth: 500 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>📋 Call Timeline &amp; Contact Audit</Text>
          <TouchableOpacity onPress={fetchLeadDetailsAndActivities}>
            <Text style={{ fontSize: 10, color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '800' }}>Refresh 🔄</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.activityHistoryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {recentOutcomes.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>No Activity Logged Yet</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                Calls, WhatsApp chats, meetings, and emails will appear here automatically.
              </Text>
            </View>
          ) : (
            recentOutcomes.map((item, idx) => {
              const roleStr = String(item.callerRole || '').toUpperCase();
              const roleColor = roleStr.includes('LEADER') || roleStr.includes('TL') ? (isDark ? '#38bdf8' : '#0284c7') : roleStr.includes('MANAGER') ? (isDark ? '#818cf8' : '#4f46e5') : roleStr.includes('ADMIN') ? (isDark ? '#f59e0b' : '#b45309') : (isDark ? '#34d399' : '#059669');
              const roleLabel = roleStr.includes('LEADER') || roleStr.includes('TL') ? 'TL' : roleStr.includes('MANAGER') ? 'Manager' : roleStr.includes('ADMIN') ? 'Admin' : 'Sales Rep';

              const isMeetingEvent = item.scheduledDate || item.notes.toLowerCase().includes('meeting');
              const isEmailEvent = item.notes.toLowerCase().includes('email');

              return (
                <View key={idx} style={[styles.activityItemRow, idx < recentOutcomes.length - 1 && [styles.activityItemBorder, { borderBottomColor: colors.border }]]}>
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.activityTitleText, { color: colors.text }]}>
                        {isMeetingEvent ? '📅 Meeting Scheduled' : isEmailEvent ? '✉️ Email Dispatched' : item.outcome === 'PICKED_UP' ? '🟢 Call Connected' : item.outcome === 'WHATSAPP_CHAT' ? '💬 WhatsApp Sent' : item.outcome === 'BUSY' ? '🟡 Line Busy' : '🔴 Not Responding'}
                      </Text>
                      {item.subOption && (
                        <View style={styles.subOptionPill}>
                          <Text style={[styles.subOptionPillText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>{item.subOption.replace(/_/g, ' ')}</Text>
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

                  {/* Actor Badge */}
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

                  {/* Scheduled Callback / Meeting */}
                  {item.scheduledDate && (
                    <View style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)', borderWidth: 1, borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)', borderRadius: 8, padding: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '800' }}>
                        📅 Follow-up: {item.scheduledDate} {item.scheduledTime ? `at ${item.scheduledTime}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Details (With Copy-on-Tap Support for Phone & Email) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 500, marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Contact Information (Tap to Copy 📋)</Text>
          <TouchableOpacity onPress={() => setEditLeadModalOpen(true)}>
            <Text style={{ fontSize: 10, color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '800' }}>Edit ✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {[
            { label: '📞 Phone', value: leadPhone || '—', isCopyable: Boolean(leadPhone), type: 'Phone Number' },
            { label: '✉️ Email', value: leadEmail, isCopyable: Boolean(leadEmail && leadEmail !== '—'), type: 'Email Address' },
            { label: '🏢 Company', value: leadCompany, isCopyable: false, type: '' },
            { label: '💰 Deal Value', value: leadValue, isCopyable: false, type: '' },
            { label: '🛍️ Requirement', value: leadRequirement, isCopyable: false, type: '' },
            { label: '📍 City / Location', value: leadCity, isCopyable: false, type: '' },
            { label: '🌐 Source', value: leadSource, isCopyable: false, type: '' },
          ].map((item, i) => {
            const handleTap = () => {
              if (item.isCopyable) {
                try {
                  Clipboard.setString(item.value);
                } catch (e) {}
                setToastConfig({
                  id: `toast_${Date.now()}`,
                  title: '📋 Copied to Clipboard',
                  message: `${item.type} "${item.value}" copied!`,
                  type: 'COPY',
                });
              }
            };

            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, i < 6 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={handleTap}
                activeOpacity={item.isCopyable ? 0.7 : 1}
              >
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <Text style={[styles.rowValue, { color: item.isCopyable ? (isDark ? '#38bdf8' : '#0284c7') : colors.text }]} numberOfLines={1}>
                    {item.value}
                  </Text>
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

              {/* ── STEP 1: MODE SWITCHER ── */}
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
                <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                  <Text style={[styles.waSectionTitleNew, { color: '#34d399', marginBottom: 6 }]}>
                    ✨ Compose Custom Template
                  </Text>
                  <TextInput
                    style={[styles.customTitleInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Custom Template Title"
                    placeholderTextColor={colors.textSecondary}
                    value={waCustomTitle}
                    onChangeText={setWaCustomTitle}
                  />
                </View>
              )}

              {/* ── STEP 2: UNIFIED ATTACHMENT SLIDER ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.stepNumBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
                      <Text style={[styles.stepNumBadgeText, { color: '#a855f7' }]}>3</Text>
                    </View>
                    <Text style={[styles.waSectionTitleNew, { color: colors.text }]}>Unified Attachment</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>Catalog / PDF</Text>
                </View>

                {/* Slider Tabs */}
                <View style={[styles.sliderTabBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.sliderTabBtn, waAttachmentMode === 'PRODUCT' && styles.sliderTabBtnActiveProduct]}
                    onPress={() => handleSelectAttachmentMode('PRODUCT')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sliderTabBtnText, { color: waAttachmentMode === 'PRODUCT' ? '#34d399' : colors.textSecondary }]}>
                      🖼️ Product Details
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
                      {(liveProducts.length > 0 ? liveProducts : CATALOG_PRODUCTS).map((prod) => {
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
                            <Image source={{ uri: prod.imageUrl || 'https://via.placeholder.com/150' }} style={styles.prodThumb} />
                            <Text style={[styles.productChipText, { color: isSelected ? '#38bdf8' : colors.textSecondary }, isSelected && { fontWeight: '900' }]}>
                              {prod.name.split(' ')[0]} ({prod.minPrice})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedProduct && (
                      <View style={[styles.attachedProductCard, { backgroundColor: colors.cardBg, borderColor: '#34d399' }]}>
                        <Image source={{ uri: selectedProduct.imageUrl || 'https://via.placeholder.com/150' }} style={styles.attachedProductImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.attachedProdName, { color: colors.text }]}>{selectedProduct.name}</Text>
                          <Text style={[styles.attachedProdPrice, { color: '#34d399' }]}>{selectedProduct.minPrice} - {selectedProduct.maxPrice}</Text>
                          <Text style={[styles.attachedProdDesc, { color: colors.textSecondary }]} numberOfLines={2}>{selectedProduct.description}</Text>
                        </View>
                      </View>
                    )}

                    {/* Quantity Stepper */}
                    <View style={[styles.qtyCardContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Quantity:</Text>
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
                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#f59e0b' }}>
                              ₹{inv.totalAmount.toLocaleString('en-IN')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* ── STEP 3: MESSAGE PREVIEW & SEND ── */}
              <View style={[styles.waSectionCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={[styles.waSectionTitleNew, { color: colors.text, marginBottom: 6 }]}>
                  📝 Live Message Preview
                </Text>
                <TextInput
                  style={[styles.previewTextInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                  multiline
                  value={customMsgText}
                  onChangeText={setCustomMsgText}
                />
              </View>

              <TouchableOpacity
                style={styles.sendWaDirectBtn}
                onPress={handleSendDirectWhatsApp}
                activeOpacity={0.8}
              >
                <Text style={styles.sendWaDirectBtnText}>🚀 Dispatch WhatsApp Direct</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ✉️ DIRECT EMAIL MODAL                                                       */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={emailModalOpen} transparent animationType="slide" onRequestClose={() => setEmailModalOpen(false)}>
        <View style={[styles.waModalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.65)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.waModalTitle, { color: colors.text }]}>✉️ Direct Email Dispatcher</Text>
                <Text style={[styles.waModalSub, { color: colors.textSecondary }]}>To: {leadEmail} ({leadName})</Text>
              </View>
              <TouchableOpacity onPress={() => setEmailModalOpen(false)} style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16, gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Subject:</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Email Subject"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Message Body:</Text>
              <TextInput
                style={[styles.previewTextInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text, minHeight: 140 }]}
                multiline
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Write your email here..."
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.sendWaDirectBtn, { backgroundColor: '#7c3aed' }]}
                onPress={handleSendDirectEmail}
                activeOpacity={0.8}
              >
                <Text style={styles.sendWaDirectBtnText}>🚀 Dispatch Email</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📅 SCHEDULE MEETING / VISIT MODAL                                           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={meetingModalOpen} transparent animationType="slide" onRequestClose={() => setMeetingModalOpen(false)}>
        <View style={[styles.waModalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.65)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.waModalTitle, { color: colors.text }]}>📅 Schedule Meeting / Visit</Text>
                <Text style={[styles.waModalSub, { color: colors.textSecondary }]}>With {leadName} • Auto-sets Status</Text>
              </View>
              <TouchableOpacity onPress={() => setMeetingModalOpen(false)} style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16, gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Meeting Title:</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={meetingTitle}
                onChangeText={setMeetingTitle}
                placeholder="e.g. Product Demo & Contract Review"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={meetingDate}
                    onChangeText={setMeetingDate}
                    placeholder="2026-10-10"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Time:</Text>
                  <TextInput
                    style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={meetingTime}
                    onChangeText={setMeetingTime}
                    placeholder="11:00 AM"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Meeting Type:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['VIRTUAL', 'IN_PERSON', 'CALL'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.modeSwitcherTab,
                      { backgroundColor: meetingType === t ? (isDark ? '#38bdf8' : '#0284c7') : colors.cardBgElevated, flex: 1 },
                    ]}
                    onPress={() => setMeetingType(t)}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: meetingType === t ? '#fff' : colors.textSecondary }}>
                      {t === 'VIRTUAL' ? '💻 Virtual' : t === 'IN_PERSON' ? '🏢 In-Person' : '📞 Call'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Agenda &amp; Notes:</Text>
              <TextInput
                style={[styles.previewTextInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text, minHeight: 70 }]}
                multiline
                value={meetingNotes}
                onChangeText={setMeetingNotes}
                placeholder="Add meeting agenda or topics..."
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.sendWaDirectBtn, { backgroundColor: '#0284c7' }]}
                onPress={handleConfirmScheduleMeeting}
                activeOpacity={0.8}
              >
                <Text style={styles.sendWaDirectBtnText}>📅 Confirm &amp; Schedule Meeting</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ✏️ EDIT LEAD DETAILS MODAL                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={editLeadModalOpen} transparent animationType="slide" onRequestClose={() => setEditLeadModalOpen(false)}>
        <View style={[styles.waModalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.65)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.waModalTitle, { color: colors.text }]}>✏️ Edit Lead Details</Text>
                <Text style={[styles.waModalSub, { color: colors.textSecondary }]}>Cloud Synced</Text>
              </View>
              <TouchableOpacity onPress={() => setEditLeadModalOpen(false)} style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16, gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Lead Name *</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Phone Number *</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 99999 00000"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Email Address</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="lead@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Company Name</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editCompany}
                onChangeText={setEditCompany}
                placeholder="Company Name"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Deal Value / Budget</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editValue}
                onChangeText={setEditValue}
                placeholder="₹1,50,000"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Requirement / Product Interested</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editRequirement}
                onChangeText={setEditRequirement}
                placeholder="e.g. Enterprise CRM License"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>City / Location</Text>
              <TextInput
                style={[styles.customTitleInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="e.g. Mumbai, Delhi"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.sendWaDirectBtn, { backgroundColor: '#10b981' }]}
                onPress={handleSaveLeadInfo}
                activeOpacity={0.8}
              >
                <Text style={styles.sendWaDirectBtnText}>💾 Save &amp; Cloud Sync</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📝 STATUS PICKER MODAL                                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={statusPickerOpen} transparent animationType="fade" onRequestClose={() => setStatusPickerOpen(false)}>
        <View style={[styles.waModalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.waModalCard, { backgroundColor: colors.cardBg, borderColor: colors.border, maxWidth: 360 }]}>
            <View style={[styles.waModalHeaderRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.waModalTitle, { color: colors.text }]}>📝 Update Lead Status</Text>
              <TouchableOpacity onPress={() => setStatusPickerOpen(false)} style={[styles.waCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {availableStatuses.map(st => (
                <TouchableOpacity
                  key={st.id || st.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => {
                    setStatusPickerOpen(false);
                    const timeString = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    setLeadStatusState(st.name);
                    setLastStatusUpdate({
                      status: st.name,
                      medium: 'Manual Update',
                      time: timeString,
                    });
                    apiService.updateLeadStatus(token, leadId, st.name);
                    handleSaveCallOutcome({
                      leadId,
                      leadName,
                      phone: leadPhone,
                      outcome: 'PICKED_UP',
                      subOption: 'TALKED',
                      notes: `Lead status updated to ${st.name}`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    });
                    setToastConfig({
                      id: String(Date.now()),
                      title: 'Status Updated',
                      message: `Lead status updated to ${st.name}.`,
                      type: 'SUCCESS',
                    });
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: st.color }} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{st.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📞 POST-CALL OUTCOME MODAL */}
      <PostCallOutcomeModal
        visible={postCallModalOpen}
        onClose={() => setPostCallModalOpen(false)}
        leadId={leadId}
        leadName={leadName}
        phone={leadPhone}
        onSaveOutcome={handleSaveCallOutcome}
      />

      {/* 💳 PAYMENT STATUS MODAL */}
      <PaymentStatusModal
        visible={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        leadName={leadName}
        leadValue={leadValue}
        onConfirmPaymentOutcome={handleConfirmPaymentOutcome}
      />

      {/* 🤖 AI SCORE MODAL */}
      <AIScoreDetailModal
        visible={aiScoreModalOpen}
        score={aiScoreData}
        onClose={() => setAiScoreModalOpen(false)}
      />

      {/* TOAST & CUSTOM ALERT */}
      {toastConfig && <ToastBanner toast={toastConfig} onDismiss={() => setToastConfig(null)} />}
      {customAlertConfig && <CustomAlertModal alert={customAlertConfig} onClose={() => setCustomAlertConfig(null)} />}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, alignItems: 'center' },
  backButton: { marginBottom: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 12, fontWeight: '800' },
  syncHeaderBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },

  headerCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900' },
  title: { fontSize: 16, fontWeight: '900' },
  company: { fontSize: 11, marginTop: 2 },
  aiScoreBadgeHeader: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiScoreTextHeader: { fontSize: 10, fontWeight: '900', color: '#ef4444' },

  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '900', flex: 1, letterSpacing: 0.5 },
  autoActivityPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  autoActivityText: { fontSize: 9, fontWeight: '900' },

  sectionTitle: { fontSize: 13, fontWeight: '900', marginBottom: 8, marginTop: 4, width: '100%', maxWidth: 500 },

  telemetryCard: {
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  telemetryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  telemetryHeaderTitle: { fontSize: 12, fontWeight: '800' },
  connectedPill: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connectedPillText: { fontSize: 9, fontWeight: '900' },

  telemetryGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  telemetryItem: { flex: 1, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1 },
  telemetryVal: { fontSize: 14, fontWeight: '900' },
  telemetryLbl: { fontSize: 9, marginTop: 2 },

  metaDivider: { height: 1, marginVertical: 8 },

  lastStatusCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
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
  lastStatusTitle: { fontSize: 11, fontWeight: '800' },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeSmallText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  lastStatusMetaRow: { flexDirection: 'row', alignItems: 'center' },
  lastStatusMetaText: { fontSize: 10 },
  lastStatusMetaHighlight: { fontWeight: '800' },

  purgeNoticeBox: { borderRadius: 10, padding: 8, marginTop: 10, borderWidth: 1 },
  purgeNoticeText: { fontSize: 9, fontStyle: 'italic' },

  activityHistoryCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  activityItemRow: { paddingVertical: 8 },
  activityItemBorder: { borderBottomWidth: 1 },
  activityTitleText: { fontSize: 11, fontWeight: '800' },
  subOptionPill: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  subOptionPillText: { fontSize: 8, fontWeight: '800' },

  detailCard: { width: '100%', maxWidth: 500, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 11, fontWeight: '600' },
  rowValue: { fontSize: 11, fontWeight: '700' },

  // WhatsApp Modal Styles
  waModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  waModalCard: { width: '100%', maxWidth: 440, borderRadius: 20, borderWidth: 1, padding: 16 },
  waModalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, paddingBottom: 10 },
  waModalTitle: { fontSize: 14, fontWeight: '900' },
  waModalSub: { fontSize: 10, marginTop: 2 },
  waCloseBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

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
  tplTitleText: { fontSize: 11, fontWeight: '800' },
  tplPreviewText: { fontSize: 9, marginTop: 2 },

  customTitleInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 },

  sliderTabBar: { flexDirection: 'row', padding: 3, borderRadius: 10, borderWidth: 1, gap: 4, marginBottom: 6 },
  sliderTabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  sliderTabBtnActiveProduct: { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.5)' },
  sliderTabBtnActiveInvoice: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.5)' },
  sliderTabBtnText: { fontSize: 10, fontWeight: '800' },

  productChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, marginRight: 6 },
  productChipActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)' },
  productChipText: { fontSize: 9, fontWeight: '700' },
  prodThumb: { width: 20, height: 20, borderRadius: 5, resizeMode: 'cover' },

  attachedProductCard: { flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#38bdf8', borderRadius: 10, padding: 8, marginBottom: 6 },
  attachedProductImg: { width: 44, height: 44, borderRadius: 8, resizeMode: 'cover' },
  attachedProdName: { fontSize: 11, fontWeight: '800' },
  attachedProdPrice: { fontSize: 10, fontWeight: '800' },
  attachedProdDesc: { fontSize: 8, marginTop: 1 },

  qtyCardContainer: { borderWidth: 1, borderRadius: 10, padding: 8 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  qtyCounterBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  qtyBtnText: { fontSize: 14, fontWeight: '900' },
  qtyValText: { fontSize: 12, fontWeight: '900', paddingHorizontal: 10 },

  invoiceItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 10, borderWidth: 1 },
  invoiceItemCardActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  invIconCircle: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center' },
  invNumberText: { fontSize: 11, fontWeight: '900' },
  invDocTypePill: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
  invDocTypePillText: { fontSize: 8, color: '#fbbf24', fontWeight: '800' },

  previewTextInput: { borderWidth: 1, borderRadius: 10, padding: 8, fontSize: 11, minHeight: 70, maxHeight: 110, textAlignVertical: 'top' },

  sendWaDirectBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  sendWaDirectBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
