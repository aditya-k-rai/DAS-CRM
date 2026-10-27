/**
 * DirectWhatsAppModal.tsx — DAS CRM Android
 * Parity-Matched Direct WhatsApp Template & Lead Status Dispatcher Modal.
 * Identical control, flow, details, and naming to Web EmployeeLeadWorkspace:
 * 1. Title: "Direct WhatsApp Template & Lead Status Dispatcher" (Tag: WHATSAPP CHAT DIRECT DISPATCHER)
 * 2. Step 1: Select Message Type / Category * (6 Categories: OUTREACH, PROPOSAL, INVOICE, MEETING, FOLLOWUP, PROMOTION)
 * 3. Step 2: Mode Switcher (Select Pre-Approved Template vs + Create & Send Custom Template)
 * 4. Step 3: Unified Attachment Panel (Slider Toggle: Product Details & Images vs Invoice PDF)
 *    - Product: Search bar, category filter, multi-product selection with quantity stepper, attached preview
 *    - Invoice: Search bar, doc type filter, invoice list, attached PDF document preview & clear
 * 5. Unified 15-Day Date & Time Scheduler for Meeting & Follow-up touchpoints
 * 6. Quick Insert Placeholders (+Name, +Company, +Value, +Product)
 * 7. Live Message Preview & Direct Edit with Chars/Words Counter & Target Phone
 * 8. Step 5: Select Target Lead Status to Update * (7 Status Options with color badges & checkmark)
 * 9. Step 6: Additional Notes / Response Entry
 * 10. Step 7: Send WhatsApp Direct & Auto-Update Lead Status + CRM Follow-up Sync
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TemplateCategory,
  WhatsAppTemplate,
  ProductItem,
  InvoiceItem,
  DEFAULT_TEMPLATES,
  CATALOG_PRODUCTS,
  SAMPLE_INVOICES,
  STATUS_OPTIONS,
  whatsappTemplateEngine,
} from '../services/whatsappTemplateEngine';
import { productCatalogService } from '../services/productCatalogService';
import ProductImage from './ProductImage';
import { apiService } from '../services/apiService';
import { followUpSyncEngine } from '../services/followUpSyncEngine';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';

export interface DirectWhatsAppModalProps {
  visible: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCompany?: string;
  leadValue?: string;
  leadRequirement?: string;
  currentStatus: string;
  onStatusUpdate: (newStatus: string) => void;
  onDispatchSuccess?: (data: {
    status: string;
    message: string;
    category: TemplateCategory;
    targetStage?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    isScheduled?: boolean;
    scheduledType?: 'MEETING' | 'CALL';
    notes?: string;
    productInterest?: string;
    selectedProduct?: ProductItem | null;
    invoice?: InvoiceItem | null;
  }) => void;
}

const WA_CATEGORIES: { cat: TemplateCategory; label: string; icon: string; desc: string; defaultStatus: string }[] = [
  { cat: 'OUTREACH', label: 'Outreach', icon: '🌱', desc: 'Initial contact', defaultStatus: 'Contacted' },
  { cat: 'PROPOSAL', label: 'Proposal', icon: '💼', desc: 'Product details', defaultStatus: 'Proposal' },
  { cat: 'INVOICE', label: 'Invoice', icon: '📦', desc: 'Invoice / PDF', defaultStatus: 'Negotiation' },
  { cat: 'MEETING', label: 'Meeting', icon: '📅', desc: 'Schedule demo', defaultStatus: 'Meeting Scheduled' },
  { cat: 'FOLLOWUP', label: 'Follow-up', icon: '⏰', desc: 'Callback nudge', defaultStatus: 'Contacted' },
  { cat: 'PROMOTION', label: 'Promotion', icon: '🎉', desc: 'Offer / discount', defaultStatus: 'Qualified' },
];

export const DirectWhatsAppModal: React.FC<DirectWhatsAppModalProps> = ({
  visible,
  onClose,
  leadId,
  leadName,
  leadPhone,
  leadCompany = 'your organization',
  leadValue = '₹14,999',
  leadRequirement,
  currentStatus,
  onStatusUpdate,
  onDispatchSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { token, currentUser } = useAuthStore();

  // Step 1: Category
  const [category, setCategory] = useState<TemplateCategory>('OUTREACH');

  // Step 2: Mode Switcher & Templates
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(DEFAULT_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState<string>('Custom Lead Proposal');
  const [saveCustomToLib, setSaveCustomToLib] = useState<boolean>(true);

  // Step 3: Unified Attachment Panel
  const [attachmentMode, setAttachmentMode] = useState<'PRODUCT' | 'INVOICE'>('PRODUCT');
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(CATALOG_PRODUCTS);
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [selectedProductQuantities, setSelectedProductQuantities] = useState<Record<string, number>>({});

  // Invoices
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceItem[]>(SAMPLE_INVOICES);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // 15-Day Scheduler (For Meeting / Follow-up)
  const [enableScheduler, setEnableScheduler] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<'MEETING' | 'FOLLOWUP'>('MEETING');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>('11:30 AM');
  const [enablePreAlert5Min, setEnablePreAlert5Min] = useState<boolean>(true);

  // Step 4: Live Message Preview
  const [messageText, setMessageText] = useState<string>('');

  // Step 5: Target Status
  const [targetStatus, setTargetStatus] = useState<string>('Contacted');

  // Step 6: Additional Notes
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Load products & templates on mount
  useEffect(() => {
    productCatalogService.getProducts().then((prods) => {
      if (Array.isArray(prods) && prods.length > 0) {
        const mapped: ProductItem[] = prods.map(p => ({
          id: p.id,
          name: p.name,
          minPrice: `₹${p.minPrice.toLocaleString('en-IN')}`,
          maxPrice: `₹${p.maxPrice.toLocaleString('en-IN')}`,
          category: p.category || 'General',
          description: p.description || '',
          features: p.features || [],
          imageUrl: p.imageUrl || '',
          sku: p.sku || '',
          price: p.minPrice,
          unit: 'Units',
          priceTiers: [
            { minQty: p.moq || 1, maxQty: (p.moq || 1) * 5, unitPrice: p.minPrice, label: `Standard (${p.moq || 1}+)` },
            { minQty: (p.moq || 1) * 6, maxQty: (p.moq || 1) * 20, unitPrice: Math.round(p.minPrice * 0.9), label: `Volume (${(p.moq || 1) * 6}+)` },
          ],
        }));
        setCatalogProducts(mapped);
      }
    }).catch(() => {});

    whatsappTemplateEngine.getTemplates().then((tpls) => {
      setTemplates(tpls);
      if (tpls.length > 0) {
        setSelectedTemplate(tpls[0]);
      }
    }).catch(() => {});
  }, []);

  // Sync initial target status from current status or category
  useEffect(() => {
    if (visible) {
      setCategory('OUTREACH');
      setIsCustomMode(false);
      setAttachmentMode('PRODUCT');
      setEnableScheduler(false);
      setTargetStatus('Contacted');
      setAdditionalNotes('');
      const defaultTpl = templates.find(t => t.category === 'OUTREACH') || templates[0];
      if (defaultTpl) {
        setSelectedTemplate(defaultTpl);
        setMessageText(
          whatsappTemplateEngine.interpolateTemplate(
            defaultTpl.text,
            { name: leadName, company: leadCompany, value: leadValue },
            null,
            1
          )
        );
      }
    }
  }, [visible, leadName, leadCompany, leadValue]);

  // Product categories list
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [catalogProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return catalogProducts.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      const matchCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
      return matchQ && matchCat;
    });
  }, [catalogProducts, productSearch, productCategoryFilter]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    return availableInvoices.filter(inv => {
      const matchQ = !q ||
        inv.quoteNumber.toLowerCase().includes(q) ||
        inv.buyerCompany.toLowerCase().includes(q) ||
        inv.itemsSummary.toLowerCase().includes(q);
      const matchType = invoiceTypeFilter === 'ALL' || inv.docType === invoiceTypeFilter;
      return matchQ && matchType;
    });
  }, [availableInvoices, invoiceSearch, invoiceTypeFilter]);

  // Selected products totals
  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedProductQuantities).reduce((acc, q) => acc + q, 0);
  }, [selectedProductQuantities]);

  const proposalGrandTotal = useMemo(() => {
    return Object.entries(selectedProductQuantities).reduce((acc, [pId, qty]) => {
      const p = catalogProducts.find(item => item.id === pId);
      const priceNum = p?.price || (p?.minPrice ? parseInt(p.minPrice.replace(/[^\d]/g, ''), 10) : 0);
      return acc + priceNum * qty;
    }, 0);
  }, [selectedProductQuantities, catalogProducts]);

  // Invoice PDF filename
  const invoicePdfFilename = useMemo(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    const safeName = (leadName || 'Lead').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    return `${safeName}_${dateStr}_${timeStr}.pdf`;
  }, [leadName]);

  // Format date helper
  const formatDateDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      if (isoStr === today) return 'Today';
      if (isoStr === tomorrow) return 'Tomorrow';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
    } catch {
      return isoStr;
    }
  };

  // Message generators
  const generateMeetingMessage = (dateStr: string, timeStr: string) => {
    const formattedDate = formatDateDisplay(dateStr);
    return `Hi ${leadName || 'Client'}, looking forward to our scheduled live walkthrough for ${leadCompany} on ${formattedDate} at ${timeStr}!\n\nLet me know if you would like me to share a Google Meet / Zoom link or adjust the timing.`;
  };

  const generateFollowUpMessage = (dateStr: string, timeStr: string) => {
    const formattedDate = formatDateDisplay(dateStr);
    return `Hi ${leadName || 'Client'}, following up regarding our discussion for ${leadCompany}. I have scheduled our next follow-up touchpoint for ${formattedDate} at ${timeStr}.\n\nPlease let me know if you would like to connect earlier or need any additional details!`;
  };

  const generateProposalMessage = (quantities: Record<string, number>) => {
    const selectedEntries = Object.entries(quantities).filter(([_, q]) => q > 0);
    if (selectedEntries.length === 0) {
      return `Hi ${leadName || 'Client'}, sharing details regarding our discussion for ${leadCompany}. Please let me know what products you would like to explore!`;
    }

    let grandTotal = 0;
    const lines: string[] = [];

    selectedEntries.forEach(([pId, qty]) => {
      const p = catalogProducts.find(item => item.id === pId);
      if (p) {
        const priceNum = p.price || (p.minPrice ? parseInt(p.minPrice.replace(/[^\d]/g, ''), 10) : 0);
        const lineTotal = priceNum * qty;
        grandTotal += lineTotal;
        const unitLabel = p.unit || 'Units';
        lines.push(`• ${p.name} (Qty: ${qty} ${unitLabel}) @ ₹${priceNum.toLocaleString('en-IN')} = ₹${lineTotal.toLocaleString('en-IN')}`);
      }
    });

    return `Hi ${leadName || 'Client'}! Please find our customized commercial proposal prepared for ${leadCompany}:\n\n📦 Selected Products & Specifications:\n${lines.join('\n')}\n━━━━━━━━━━━━━━━━━━━━\n💰 Total Proposal Value: ₹${grandTotal.toLocaleString('en-IN')} (incl. 18% GST)\n\nPlease review the attached product specifications above, and reply to confirm your commercial order!`;
  };

  const generateInvoiceMessage = (inv: InvoiceItem) => {
    const docLabel = inv.docType.replace(/_/g, ' ');
    const pdfLink = inv.pdfUrl || `https://nexcrm.com/invoices/${inv.quoteNumber}.pdf`;
    return `Hi ${leadName || 'Client'}! Please find the official ${docLabel} (${inv.quoteNumber}) prepared for ${leadCompany}:\n\n📄 Document: ${docLabel}\n🔢 Invoice Ref: ${inv.quoteNumber}\n💰 Total Amount: ₹${inv.totalAmount.toLocaleString('en-IN')} (incl. 18% GST)\n📅 Issued Date: ${inv.date}\n📦 Items: ${inv.itemsSummary}\n📎 Official Invoice PDF: ${invoicePdfFilename} (${pdfLink})\n\nPlease review the attached official invoice PDF and reply to confirm payment processing!`;
  };

  // Category selection handler
  const handleSelectCategory = (cat: TemplateCategory) => {
    setCategory(cat);
    const catCfg = WA_CATEGORIES.find(c => c.cat === cat);
    if (catCfg) setTargetStatus(catCfg.defaultStatus);

    if (cat === 'PROPOSAL') {
      setAttachmentMode('PRODUCT');
      setEnableScheduler(false);
      // Auto-select first product if none selected
      if (Object.keys(selectedProductQuantities).length === 0 && catalogProducts.length > 0) {
        const initial = { [catalogProducts[0].id]: 1 };
        setSelectedProductQuantities(initial);
        setMessageText(generateProposalMessage(initial));
        return;
      } else {
        setMessageText(generateProposalMessage(selectedProductQuantities));
        return;
      }
    } else if (cat === 'INVOICE') {
      setAttachmentMode('INVOICE');
      setEnableScheduler(false);
      const inv = selectedInvoice || availableInvoices[0];
      if (inv) {
        setSelectedInvoice(inv);
        setMessageText(generateInvoiceMessage(inv));
        return;
      }
    } else if (cat === 'MEETING') {
      setEnableScheduler(true);
      setScheduleType('MEETING');
      setMessageText(generateMeetingMessage(scheduledDate, scheduledTime));
      return;
    } else if (cat === 'FOLLOWUP') {
      setEnableScheduler(true);
      setScheduleType('FOLLOWUP');
      setMessageText(generateFollowUpMessage(scheduledDate, scheduledTime));
      return;
    }

    // Default template match
    const matchingTpl = templates.find(t => t.category === cat) || templates[0];
    if (matchingTpl) {
      setSelectedTemplate(matchingTpl);
      setMessageText(
        whatsappTemplateEngine.interpolateTemplate(
          matchingTpl.text,
          { name: leadName, company: leadCompany, value: leadValue },
          null,
          1
        )
      );
    }
  };

  // Pre-approved template select
  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
    if (tpl.targetStatus) setTargetStatus(tpl.targetStatus);
    setMessageText(
      whatsappTemplateEngine.interpolateTemplate(
        tpl.text,
        { name: leadName, company: leadCompany, value: leadValue },
        null,
        1
      )
    );
  };

  // Product quantity update
  const handleUpdateProductQuantity = (productId: string, delta: number) => {
    setSelectedProductQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[productId];
      } else {
        updated[productId] = next;
      }
      setMessageText(generateProposalMessage(updated));
      return updated;
    });
  };

  // Invoice apply
  const handleApplyInvoice = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setMessageText(generateInvoiceMessage(inv));
  };

  // Quick placeholder insert
  const handleInsertPlaceholder = (placeholder: string) => {
    setMessageText(prev => `${prev} ${placeholder}`);
  };

  // Scheduler updates
  const handleUpdateMeetingDate = (isoDate: string) => {
    setScheduledDate(isoDate);
    if (scheduleType === 'MEETING') {
      setMessageText(generateMeetingMessage(isoDate, scheduledTime));
    } else {
      setMessageText(generateFollowUpMessage(isoDate, scheduledTime));
    }
  };

  const handleUpdateMeetingTime = (slot: string) => {
    setScheduledTime(slot);
    if (scheduleType === 'MEETING') {
      setMessageText(generateMeetingMessage(scheduledDate, slot));
    } else {
      setMessageText(generateFollowUpMessage(scheduledDate, slot));
    }
  };

  // 🚀 DISPATCH WHATSAPP DIRECT HANDLER
  const handleSendWhatsAppDirect = async () => {
    let cleaned = (leadPhone || '').replace(/[^\d]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    if (!cleaned) {
      Alert.alert('Phone Missing', 'This lead does not have a valid phone number for WhatsApp.');
      return;
    }

    const finalMsg = messageText.trim() || `Hi ${leadName}, following up regarding ${leadCompany}.`;
    const encoded = encodeURIComponent(finalMsg);
    const nativeUrl = `whatsapp://send?phone=${cleaned}&text=${encoded}`;
    const webFallback = `https://wa.me/${cleaned}?text=${encoded}`;

    try {
      const canNative = await Linking.canOpenURL('whatsapp://send');
      if (canNative) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webFallback).catch(() => {
          Alert.alert('WhatsApp Ready', `Message ready for ${leadName} (+${cleaned}):\n\n"${finalMsg}"`);
        });
      }
    } catch {
      await Linking.openURL(webFallback).catch(() => {
        Alert.alert('WhatsApp Ready', `Message ready for ${leadName} (+${cleaned}):\n\n"${finalMsg}"`);
      });
    }

    // Save custom template to library if requested
    if (isCustomMode && saveCustomToLib && customTitle.trim()) {
      try {
        const customTpl: WhatsAppTemplate = {
          id: `tpl_${Date.now()}`,
          title: customTitle.trim(),
          category,
          text: finalMsg,
          targetStatus: targetStatus !== 'KEEP_CURRENT' ? targetStatus : undefined,
          isDefault: false,
          usageCount: 1,
        };
        await whatsappTemplateEngine.upsertTemplate(customTpl);
      } catch (_) {}
    } else if (!isCustomMode && selectedTemplate) {
      // Increment usage count
      whatsappTemplateEngine.incrementUsage(selectedTemplate.id).catch(() => {});
    }

    // Determine target lead status
    const effectiveStatus = (targetStatus && targetStatus !== 'KEEP_CURRENT')
      ? targetStatus
      : (enableScheduler && scheduleType === 'MEETING' ? 'Meeting Scheduled' : currentStatus);

    if (effectiveStatus && effectiveStatus !== currentStatus) {
      onStatusUpdate(effectiveStatus);
      apiService.updateLeadStatus(token, leadId, effectiveStatus).catch(() => {});
    }

    // Resolve Product Interest
    let activeProductInterest: string | undefined = undefined;
    const selectedEntries = Object.entries(selectedProductQuantities).filter(([_, q]) => q > 0);
    if (selectedEntries.length > 0) {
      activeProductInterest = selectedEntries.map(([pId, qty]) => {
        const prod = catalogProducts.find(p => p.id === pId);
        return prod ? `${prod.name} (Qty: ${qty})` : `Item #${pId}`;
      }).join('; ');
    } else if (category === 'INVOICE' && selectedInvoice) {
      activeProductInterest = `${selectedInvoice.itemsSummary} (${selectedInvoice.quoteNumber})`;
    }

    // Sync Scheduled Follow-up / Meeting if active
    if (enableScheduler) {
      followUpSyncEngine.saveAndSyncFollowUp(token, {
        leadId,
        leadName,
        leadCompany,
        leadPhone,
        followUpType: scheduleType === 'MEETING' ? 'MEETING' : 'WHATSAPP',
        scheduledDate,
        scheduledTime,
        purpose: additionalNotes || `Direct WhatsApp touchpoint for ${leadName}`,
        notes: additionalNotes || `Scheduled via Direct WhatsApp dispatcher`,
        reminderMinutes: enablePreAlert5Min ? 5 : 0,
        assigneeId: currentUser?.id,
        assignedRepName: currentUser?.name || 'Sales Rep',
      }).catch(() => {});

      apiService.logLeadActivity(token, {
        leadId,
        activityType: scheduleType === 'MEETING' ? 'MEETING' : 'FOLLOWUP',
        subject: scheduleType === 'MEETING' ? 'Walkthrough Meeting Scheduled' : 'Follow-up Callback Scheduled',
        notes: `Scheduled via Direct WhatsApp for ${scheduledDate} at ${scheduledTime}. Notes: ${additionalNotes || 'Direct WhatsApp Dispatch'}`,
        outcome: scheduleType === 'MEETING' ? 'MEETING_SCHEDULED' : 'FOLLOWUP_SCHEDULED',
        metadata: {
          followUpDate: scheduledDate,
          followUpTime: scheduledTime,
          channel: 'WHATSAPP_DIRECT',
          sentMessage: finalMsg,
          preAlert: enablePreAlert5Min,
        },
      }).catch(() => {});
    }

    // Persist activity to backend
    apiService.logLeadActivity(token, {
      leadId,
      userId: currentUser?.id,
      activityType: 'NOTE',
      subject: `Direct WhatsApp (${isCustomMode ? customTitle : selectedTemplate?.title || category})`,
      notes: additionalNotes ? `WhatsApp Direct: ${additionalNotes}` : `WhatsApp Direct sent to ${leadName}`,
      outcome: 'WA_SENT',
      metadata: {
        type: 'WHATSAPP_DIRECT',
        channel: 'WHATSAPP_DIRECT',
        outcome: 'WA_SENT',
        sentMessage: finalMsg,
        productInterest: activeProductInterest,
        category,
        targetStatus: effectiveStatus,
        docNo: selectedInvoice?.quoteNumber,
        docAmount: selectedInvoice?.totalAmount || (proposalGrandTotal > 0 ? proposalGrandTotal : undefined),
        userId: currentUser?.id,
        by: currentUser?.name || 'Sales Rep',
        byRole: (currentUser?.role || 'SALES_EXEC').toUpperCase(),
      },
    }).catch(() => {});

    if (onDispatchSuccess) {
      onDispatchSuccess({
        status: effectiveStatus,
        message: finalMsg,
        category,
        targetStage: effectiveStatus,
        scheduledDate: enableScheduler ? scheduledDate : undefined,
        scheduledTime: enableScheduler ? scheduledTime : undefined,
        isScheduled: enableScheduler,
        scheduledType: scheduleType === 'MEETING' ? 'MEETING' : 'CALL',
        notes: additionalNotes,
        productInterest: activeProductInterest,
        selectedProduct: selectedEntries.length > 0 ? catalogProducts.find(p => p.id === selectedEntries[0][0]) : null,
        invoice: selectedInvoice,
      });
    }

    onClose();
  };

  // Word & Char Count
  const charCount = messageText.length;
  const wordCount = messageText.trim() ? messageText.trim().split(/\s+/).length : 0;

  const showAttachmentSection = category === 'PROPOSAL' || category === 'INVOICE';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.65)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: Math.max(insets.top, 16) }]}>

          {/* ── HEADER (MATCHING WEB NAME & TAG EXACTLY) ── */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>WHATSAPP CHAT DIRECT DISPATCHER</Text>
                </View>
                <View style={styles.syncBadge}>
                  <Text style={styles.syncBadgeText}>CRM SYNC</Text>
                </View>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Direct WhatsApp Template &amp; Lead Status Dispatcher
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                Target: <Text style={{ color: '#10b981', fontWeight: '800' }}>{leadName}</Text> ({whatsappTemplateEngine.formatPhoneDisplay(leadPhone)}) • Auto-updates Status
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.cardBgElevated }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── STEP 1: SELECT MESSAGE TYPE / CATEGORY * ── */}
            <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Select Message Type / Category *
                  </Text>
                </View>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{category}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 8 }}>
                Defines type of message &amp; auto-selects CRM lead status:
              </Text>

              <View style={styles.categoryGrid}>
                {WA_CATEGORIES.map((c) => {
                  const isActive = category === c.cat;
                  return (
                    <TouchableOpacity
                      key={c.cat}
                      style={[
                        styles.categoryBtn,
                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                        isActive && styles.categoryBtnActive,
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

            {/* ── STEP 2: MODE SWITCHER ── */}
            <View style={[styles.modeSwitcherBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modeTab, !isCustomMode && styles.modeTabActive]}
                onPress={() => {
                  setIsCustomMode(false);
                  const best = templates.find(t => t.category === category) || templates[0];
                  if (best) handleSelectTemplate(best);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, { color: !isCustomMode ? '#fbbf24' : colors.textSecondary }]}>
                  📋 Select Pre-Approved Template
                </Text>
                <View style={styles.modeCountBadge}>
                  <Text style={styles.modeCountBadgeText}>
                    {templates.filter(t => t.category === category).length || templates.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, isCustomMode && styles.modeTabActiveCustom]}
                onPress={() => setIsCustomMode(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, { color: isCustomMode ? '#34d399' : colors.textSecondary }]}>
                  ✨ + Create &amp; Send Custom Template
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pre-Approved Template Selector */}
            {!isCustomMode ? (
              <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.stepBadge, { backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                      <Text style={[styles.stepBadgeText, { color: '#34d399' }]}>2</Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Template *</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>
                    ✓ {templates.filter(t => t.category === category).length} Matching
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      ...templates.filter(t => t.category === category),
                      ...templates.filter(t => t.category !== category),
                    ].map((tpl) => {
                      const isSelected = selectedTemplate?.id === tpl.id;
                      const isCatMatch = tpl.category === category;
                      return (
                        <TouchableOpacity
                          key={tpl.id}
                          style={[
                            styles.tplChipCard,
                            { backgroundColor: colors.cardBg, borderColor: colors.border },
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
                              <View style={styles.tplStatusTag}>
                                <Text style={styles.tplStatusTagText}>➔ {tpl.targetStatus}</Text>
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
              /* Custom Template Builder */
              <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { color: '#34d399' }]}>
                    ✨ Compose Custom Template &amp; Message
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>Custom Mode Active</Text>
                </View>

                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  Custom Template Title *
                </Text>
                <TextInput
                  style={[styles.inputBox, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Customized Quotation / Commercial Proposal Breakdown"
                  placeholderTextColor={colors.textSecondary}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}
                  onPress={() => setSaveCustomToLib(!saveCustomToLib)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxBox, saveCustomToLib && { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                    {saveCustomToLib && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.text }}>
                    💾 Save this custom template to template library for future team reuse
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 3: UNIFIED ATTACHMENT PANEL (Product OR Invoice) ── */}
            {showAttachmentSection && (
              <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.stepBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
                      <Text style={[styles.stepBadgeText, { color: '#a855f7' }]}>3</Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Unified Attachment</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>Catalog / PDF</Text>
                </View>

                {/* Slider Tabs */}
                <View style={[styles.sliderTabBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.sliderTabBtn, attachmentMode === 'PRODUCT' && styles.sliderTabBtnActiveProduct]}
                    onPress={() => {
                      setAttachmentMode('PRODUCT');
                      setCategory('PROPOSAL');
                      setTargetStatus('Proposal');
                      setMessageText(generateProposalMessage(selectedProductQuantities));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sliderTabBtnText, { color: attachmentMode === 'PRODUCT' ? '#34d399' : colors.textSecondary }]}>
                      🖼️ Product Details &amp; Images
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sliderTabBtn, attachmentMode === 'INVOICE' && styles.sliderTabBtnActiveInvoice]}
                    onPress={() => {
                      setAttachmentMode('INVOICE');
                      setCategory('INVOICE');
                      setTargetStatus('Negotiation');
                      if (!selectedInvoice && availableInvoices.length > 0) handleApplyInvoice(availableInvoices[0]);
                      else if (selectedInvoice) handleApplyInvoice(selectedInvoice);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sliderTabBtnText, { color: attachmentMode === 'INVOICE' ? '#f59e0b' : colors.textSecondary }]}>
                      📄 Invoice PDF
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* A. PRODUCT ATTACHMENT */}
                {attachmentMode === 'PRODUCT' && (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {/* Search & Category Filter */}
                    <View style={{ gap: 6 }}>
                      <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <Text style={{ fontSize: 12 }}>🔍</Text>
                        <TextInput
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder="Search products by name, SKU..."
                          placeholderTextColor={colors.textSecondary}
                          value={productSearch}
                          onChangeText={setProductSearch}
                        />
                        {productSearch ? (
                          <TouchableOpacity onPress={() => setProductSearch('')}>
                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {productCategories.map((cat) => {
                            const isCatActive = productCategoryFilter === cat;
                            return (
                              <TouchableOpacity
                                key={cat}
                                style={[
                                  styles.filterChip,
                                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                                  isCatActive && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' },
                                ]}
                                onPress={() => setProductCategoryFilter(cat)}
                              >
                                <Text style={[styles.filterChipText, { color: isCatActive ? '#10b981' : colors.textSecondary }]}>
                                  {cat}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Products List */}
                    <View style={{ maxHeight: 220 }}>
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        <View style={{ gap: 6 }}>
                          {filteredProducts.map((prod) => {
                            const qty = selectedProductQuantities[prod.id] || 0;
                            const isSelected = qty > 0;
                            return (
                              <View
                                key={prod.id}
                                style={[
                                  styles.productCardRow,
                                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                                  isSelected && { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
                                ]}
                              >
                                <ProductImage
                                  uri={prod.imageUrl}
                                  style={styles.productImg}
                                  fallback="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200"
                                />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                                    {prod.name}
                                  </Text>
                                  <Text style={[styles.productPrice, { color: '#10b981' }]}>
                                    {prod.minPrice} • {prod.unit || 'Unit'} {prod.sku ? `• ${prod.sku}` : ''}
                                  </Text>
                                </View>

                                {isSelected ? (
                                  <View style={[styles.stepperContainer, { backgroundColor: colors.cardBgElevated, borderColor: '#10b981' }]}>
                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() => handleUpdateProductQuantity(prod.id, -1)}
                                    >
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperValText, { color: '#10b981' }]}>{qty}</Text>
                                    <TouchableOpacity
                                      style={styles.stepperBtn}
                                      onPress={() => handleUpdateProductQuantity(prod.id, 1)}
                                    >
                                      <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.selectProdBtn}
                                    onPress={() => handleUpdateProductQuantity(prod.id, 1)}
                                  >
                                    <Text style={styles.selectProdBtnText}>+ Select</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Attached Visuals Preview Card */}
                    {totalSelectedCount > 0 && (
                      <View style={[styles.attachedSummaryCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981' }}>
                            📎 Attached Products &amp; Visuals ({totalSelectedCount} items):
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#10b981' }}>
                            Total: ₹{proposalGrandTotal.toLocaleString('en-IN')} (incl. GST)
                          </Text>
                        </View>

                        <View style={{ gap: 4, marginTop: 4 }}>
                          {Object.entries(selectedProductQuantities).map(([pId, qty]) => {
                            const prod = catalogProducts.find(p => p.id === pId);
                            if (!prod) return null;
                            const priceNum = prod.price || (prod.minPrice ? parseInt(prod.minPrice.replace(/[^\d]/g, ''), 10) : 0);
                            return (
                              <View key={pId} style={[styles.attachedMiniRow, { backgroundColor: colors.cardBgElevated }]}>
                                <ProductImage
                                  uri={prod.imageUrl}
                                  style={styles.attachedMiniImg}
                                  fallback="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100"
                                />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text style={[styles.attachedMiniName, { color: colors.text }]} numberOfLines={1}>
                                    {prod.name}
                                  </Text>
                                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                                    Qty: <Text style={{ color: '#10b981', fontWeight: '800' }}>{qty}</Text> × ₹{priceNum.toLocaleString('en-IN')} = ₹{(priceNum * qty).toLocaleString('en-IN')}
                                  </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleUpdateProductQuantity(pId, -qty)}>
                                  <Text style={{ color: '#ef4444', fontSize: 12, padding: 4 }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                        <Text style={{ fontSize: 9, color: '#06b6d4', marginTop: 2 }}>
                          🖼️ High-res images and commercial specs are attached to the WhatsApp message
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* B. INVOICE ATTACHMENT */}
                {attachmentMode === 'INVOICE' && (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {/* Search & Doc Type Filter */}
                    <View style={{ gap: 6 }}>
                      <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <Text style={{ fontSize: 12 }}>🔍</Text>
                        <TextInput
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder="Search by invoice number, buyer..."
                          placeholderTextColor={colors.textSecondary}
                          value={invoiceSearch}
                          onChangeText={setInvoiceSearch}
                        />
                        {invoiceSearch ? (
                          <TouchableOpacity onPress={() => setInvoiceSearch('')}>
                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[
                            { key: 'ALL', label: 'All Invoices' },
                            { key: 'TAX_INVOICE', label: 'Tax Invoices' },
                            { key: 'PROFORMA_INVOICE', label: 'Proforma' },
                            { key: 'QUOTATION', label: 'Quotations' },
                          ].map((t) => {
                            const isTypeActive = invoiceTypeFilter === t.key;
                            return (
                              <TouchableOpacity
                                key={t.key}
                                style={[
                                  styles.filterChip,
                                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                                  isTypeActive && { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' },
                                ]}
                                onPress={() => setInvoiceTypeFilter(t.key)}
                              >
                                <Text style={[styles.filterChipText, { color: isTypeActive ? '#fbbf24' : colors.textSecondary }]}>
                                  {t.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Invoices List */}
                    <View style={{ maxHeight: 220 }}>
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        <View style={{ gap: 6 }}>
                          {filteredInvoices.map((inv) => {
                            const isSelected = selectedInvoice?.id === inv.id || selectedInvoice?.quoteNumber === inv.quoteNumber;
                            return (
                              <TouchableOpacity
                                key={inv.id}
                                style={[
                                  styles.invoiceItemCard,
                                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                                  isSelected && styles.invoiceItemCardActive,
                                ]}
                                onPress={() => handleApplyInvoice(inv)}
                                activeOpacity={0.7}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <View style={styles.invIconCircle}>
                                    <Text style={{ fontSize: 13 }}>📄</Text>
                                  </View>
                                  <View style={{ flex: 1, minWidth: 0 }}>
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
                                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#f59e0b' }}>
                                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                                  </Text>
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: isSelected ? '#fbbf24' : colors.textSecondary }}>
                                    {isSelected ? '✓ Attached' : 'Attach'}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Attached Invoice PDF Card */}
                    {selectedInvoice && (
                      <View style={[styles.attachedSummaryCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#fbbf24' }}>
                            📎 Attached Document to WhatsApp Dispatch:
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#10b981' }}>
                            ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} (incl. GST)
                          </Text>
                        </View>

                        <View style={[styles.attachedMiniRow, { backgroundColor: colors.cardBgElevated, marginTop: 4 }]}>
                          <Text style={{ fontSize: 18 }}>📕</Text>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.attachedMiniName, { color: colors.text }]} numberOfLines={1}>
                                {invoicePdfFilename}
                              </Text>
                              <View style={styles.invDocTypePill}>
                                <Text style={styles.invDocTypePillText}>{selectedInvoice.docType}</Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                              Ref: {selectedInvoice.quoteNumber} • Buyer: {selectedInvoice.buyerCompany}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedInvoice(null)} style={{ padding: 4 }}>
                            <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '800' }}>Clear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── UNIFIED 15-DAY DATE & TIME SCHEDULER (MEETING & FOLLOW-UP) ── */}
            {enableScheduler && (
              <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: scheduleType === 'MEETING' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(245, 158, 11, 0.5)' }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.stepBadge, { backgroundColor: scheduleType === 'MEETING' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)', borderColor: scheduleType === 'MEETING' ? '#6366f1' : '#f59e0b' }]}>
                      <Text style={[styles.stepBadgeText, { color: scheduleType === 'MEETING' ? '#818cf8' : '#fbbf24' }]}>
                        {scheduleType === 'MEETING' ? '🤝' : '📞'}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {scheduleType === 'MEETING' ? 'Schedule Walkthrough / Demo Meeting' : 'Schedule Follow-up Touchpoint / Callback'}
                    </Text>
                  </View>
                  <View style={[styles.categoryPill, { backgroundColor: scheduleType === 'MEETING' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
                    <Text style={[styles.categoryPillText, { color: scheduleType === 'MEETING' ? '#818cf8' : '#fbbf24' }]}>
                      {scheduleType === 'MEETING' ? 'Meeting Funnel' : 'Follow-up Funnel'}
                    </Text>
                  </View>
                </View>

                {/* Switcher & Date/Time Badge */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6, flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: colors.border }}>
                    <TouchableOpacity
                      style={[styles.schedTypeBtn, scheduleType === 'MEETING' && { backgroundColor: '#6366f1' }]}
                      onPress={() => {
                        setScheduleType('MEETING');
                        setCategory('MEETING');
                        setTargetStatus('Meeting Scheduled');
                        setMessageText(generateMeetingMessage(scheduledDate, scheduledTime));
                      }}
                    >
                      <Text style={[styles.schedTypeBtnText, { color: scheduleType === 'MEETING' ? '#fff' : colors.textSecondary }]}>
                        🤝 Meeting
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.schedTypeBtn, scheduleType === 'FOLLOWUP' && { backgroundColor: '#f59e0b' }]}
                      onPress={() => {
                        setScheduleType('FOLLOWUP');
                        setCategory('FOLLOWUP');
                        setTargetStatus('Contacted');
                        setMessageText(generateFollowUpMessage(scheduledDate, scheduledTime));
                      }}
                    >
                      <Text style={[styles.schedTypeBtnText, { color: scheduleType === 'FOLLOWUP' ? '#fff' : colors.textSecondary }]}>
                        📞 Follow-up
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.schedPill, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                    <Text style={{ color: '#818cf8', fontSize: 10, fontWeight: '800' }}>
                      📅 {formatDateDisplay(scheduledDate)} at {scheduledTime}
                    </Text>
                  </View>
                </View>

                {/* 15-Day Date Chips */}
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  Select Scheduled Date (Next 15 Days):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {Array.from({ length: 15 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const isoDate = d.toISOString().split('T')[0];
                      const label =
                        i === 0
                          ? 'Today'
                          : i === 1
                          ? 'Tomorrow'
                          : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                      const isSelected = scheduledDate === isoDate;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.dateChip,
                            { backgroundColor: colors.cardBg, borderColor: colors.border },
                            isSelected && { backgroundColor: '#6366f1', borderColor: '#818cf8' },
                          ]}
                          onPress={() => handleUpdateMeetingDate(isoDate)}
                        >
                          <Text style={[styles.dateChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Time Slots */}
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                  Time Slot:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '06:00 PM'].map((slot) => {
                    const isTimeActive = scheduledTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.timeChip,
                          { backgroundColor: colors.cardBg, borderColor: colors.border },
                          isTimeActive && { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#818cf8' },
                        ]}
                        onPress={() => handleUpdateMeetingTime(slot)}
                      >
                        <Text style={[styles.timeChipText, { color: isTimeActive ? '#818cf8' : colors.textSecondary }]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Pre-alert toggle */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}
                  onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxBox, enablePreAlert5Min && { backgroundColor: '#6366f1', borderColor: '#6366f1' }]}>
                    {enablePreAlert5Min && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.text }}>
                    🔔 Pre-alert notification (5 mins before scheduled touchpoint in Follow-ups)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Scheduler Toggle for other categories */}
            {category !== 'MEETING' && category !== 'FOLLOWUP' && (
              <View style={[styles.quickSchedRow, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>
                  📅 Schedule Next Follow-up / Meeting for this lead:
                </Text>
                <TouchableOpacity
                  style={[styles.quickSchedBtn, enableScheduler && { backgroundColor: '#6366f1', borderColor: '#818cf8' }]}
                  onPress={() => {
                    const next = !enableScheduler;
                    setEnableScheduler(next);
                    if (next) {
                      setScheduleType('MEETING');
                      setMessageText(generateMeetingMessage(scheduledDate, scheduledTime));
                    }
                  }}
                >
                  <Text style={[styles.quickSchedBtnText, { color: enableScheduler ? '#fff' : colors.text }]}>
                    {enableScheduler ? '✓ Scheduler Active' : '+ Schedule Follow-up / Meeting'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 4: LIVE MESSAGE PREVIEW & DIRECT EDIT ── */}
            <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>📝</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    WhatsApp Message Body (Live Editable Preview)
                  </Text>
                </View>

                {/* Placeholder Chips */}
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity style={styles.placeholderChip} onPress={() => handleInsertPlaceholder('{name}')}>
                    <Text style={styles.placeholderChipText}>+Name</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.placeholderChip} onPress={() => handleInsertPlaceholder('{company}')}>
                    <Text style={styles.placeholderChipText}>+Company</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.placeholderChip} onPress={() => handleInsertPlaceholder('{value}')}>
                    <Text style={styles.placeholderChipText}>+Value</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.placeholderChip} onPress={() => handleInsertPlaceholder('{product}')}>
                    <Text style={styles.placeholderChipText}>+Product</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={[styles.previewTextInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                multiline
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type your WhatsApp message..."
                placeholderTextColor={colors.textSecondary}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                  Target: {leadName} ({whatsappTemplateEngine.formatPhoneDisplay(leadPhone)})
                </Text>
                <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                  {charCount} chars · {wordCount} words
                </Text>
              </View>
            </View>

            {/* ── STEP 5: SELECT TARGET LEAD STATUS TO UPDATE * ── */}
            <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Select Target Lead Status to Update *
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                    Lead status automatically updates when message is sent:
                  </Text>
                </View>
                <View style={styles.currentStatusPill}>
                  <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                    Current: <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{currentStatus || 'New'}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.statusGrid}>
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = targetStatus === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.statusCardBtn,
                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                        isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                      ]}
                      onPress={() => setTargetStatus(opt.key)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Text style={{ fontSize: 13 }}>{opt.badge}</Text>
                        <Text style={[styles.statusCardLabel, { color: isSelected ? opt.color : colors.text }]} numberOfLines={1}>
                          {opt.label}
                        </Text>
                      </View>
                      {isSelected && <Text style={{ color: opt.color, fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── STEP 6: ADDITIONAL NOTES / RESPONSE ENTRY ── */}
            <View style={[styles.cardSection, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
                Additional Notes / Response Entry (Optional)
              </Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Sent pricing breakdown and meeting invitation via Direct WhatsApp..."
                placeholderTextColor={colors.textSecondary}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
              />
            </View>

            {/* ── STEP 7: DISPATCH WHATSAPP DIRECT BUTTON ── */}
            <TouchableOpacity
              style={styles.dispatchBtn}
              onPress={handleSendWhatsAppDirect}
              activeOpacity={0.8}
            >
              <Text style={styles.dispatchBtnIcon}>🚀</Text>
              <Text style={styles.dispatchBtnText}>
                Send WhatsApp Direct &amp; Update Lead Status to &quot;{STATUS_OPTIONS.find(s => s.key === targetStatus)?.label || targetStatus}&quot;
                {enableScheduler && ` (Syncs Scheduled ${scheduleType === 'MEETING' ? 'Meeting' : 'Follow-up'} to CRM)`} →
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  tagBadgeText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  syncBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  syncBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  cardSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  categoryPillText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBtn: {
    width: '31.5%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  categoryBtnActive: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryDesc: {
    fontSize: 8,
  },
  modeSwitcherBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  modeTabActiveCustom: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modeCountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  modeCountBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
  },
  tplChipCard: {
    width: 210,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  tplCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  tplTitleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tplStatusTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tplStatusTagText: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: '800',
  },
  tplPreviewText: {
    fontSize: 9,
    lineHeight: 13,
  },
  inputBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 4,
  },
  sliderTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  sliderTabBtnActiveProduct: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  sliderTabBtnActiveInvoice: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  sliderTabBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    height: 32,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    padding: 0,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  productImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  productName: {
    fontSize: 11,
    fontWeight: '800',
  },
  productPrice: {
    fontSize: 9,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepperValText: {
    fontSize: 11,
    fontWeight: '900',
    minWidth: 18,
    textAlign: 'center',
  },
  selectProdBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectProdBtnText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  attachedSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  attachedMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 8,
  },
  attachedMiniImg: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  attachedMiniName: {
    fontSize: 10,
    fontWeight: '800',
  },
  invoiceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  invoiceItemCardActive: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  invIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  invDocTypePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  invDocTypePillText: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800',
  },
  schedTypeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  schedTypeBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  schedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickSchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  quickSchedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  quickSchedBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  placeholderChip: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  placeholderChipText: {
    color: '#38bdf8',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  previewTextInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    minHeight: 85,
    textAlignVertical: 'top',
    fontSize: 11,
    lineHeight: 16,
  },
  currentStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  statusCardBtn: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusCardLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  dispatchBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 4,
  },
  dispatchBtnIcon: {
    fontSize: 14,
  },
  dispatchBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    flex: 1,
  },
});
