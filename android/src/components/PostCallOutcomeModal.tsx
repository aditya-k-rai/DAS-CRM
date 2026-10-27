/**
 * PostCallOutcomeModal.tsx — DAS CRM Android
 * Parity-Matched Lead Outcome & Status Update Engine.
 * Provides identical control, flow, and UX to Web EmployeeLeadWorkspace:
 * 1. 📞 Post-Call Outcome Engine Header with lead information.
 * 2. 4 Primary Call Disposition Funnels + WhatsApp Chat:
 *    - 🗣️ 1. Talked (Call Connected)
 *    - 🔕 2. Not Responding (Ringing but not picked)
 *    - ⏳ 3. Busy (Line engaged / waiting)
 *    - 📴 4. Switched Off (Unreachable / off)
 *    - 💬 5. WhatsApp Chat (Direct WhatsApp interaction)
 * 3. 6 Granular Sub-options under Talked:
 *    - 💡 a - Interested (product or service) -> Auto Stage: Qualified
 *    - 🤝 b - Said He Will Visit -> Auto Stage: Meeting Scheduled
 *    - 🔄 c - Want Something Else -> Auto Stage: Contacted (Custom Requirement Input)
 *    - ⏰ d - Busy will talk later -> Auto Stage: Contacted (Callback Scheduler)
 *    - ⚠️ e - Wrong Number -> Auto Stage: Lost (Tenant Lifecycle Auto-Transition)
 *    - 📄 f - Quotation / Invoice Shared -> Auto Stage: Negotiation (Document Select & Share)
 * 4. ⏰ Follow-up Scheduling Engine:
 *    - ⚡ 1-Tap Quick Pick (Tomorrow 10:30 AM)
 *    - ⚡ 30 Mins / 1 Hour / 2 Hours / Custom presets
 *    - 15-Day Date Horizontal Chips & Time Slots
 *    - 🔔 Pre-alert notification (5 mins before scheduled time in Follow-ups)
 * 5. 🛍️ Product Catalog & Interactive WhatsApp Product Share:
 *    - Product Catalog search & selection + Custom product entry
 *    - Quantity Stepper (− / +) & Live Tiered Pricing
 *    - 🏷️ Per-Unit Price toggle, 🖼️ Attach Image toggle
 *    - 📊 GST Rate presets (0%, 5% default, 12%, 18%, 28%, Custom %)
 *    - 🌐 Live WhatsApp Message Preview (EN, HI, HINGLISH) + 1-Tap Direct Dispatch
 * 6. 📝 Call Notes & Conversation Remarks.
 * 7. 🎯 Live Stage Transition Summary Preview banner.
 * 8. 💾 Save & Auto-Sync with Lead Timeline Telemetry.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATALOG_PRODUCTS, ProductItem } from '../services/whatsappTemplateEngine';
import { productCatalogService } from '../services/productCatalogService';
import ProductImage from './ProductImage';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

export interface CallOutcomeData {
  leadId: string;
  leadName: string;
  phone: string;
  outcome: 'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT';
  subOption?:
    | 'TALKED'
    | 'CALL_LATER'
    | 'WILL_VISIT'
    | 'CATALOGUE_SHARED'
    | 'INTERESTED'
    | 'WA_SENT'
    | 'WA_RESPONDED'
    | 'WANT_SOMETHING_ELSE'
    | 'WRONG_NUMBER'
    | 'QUOTE_INVOICE_SHARED';
  targetStage?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledType?: string;
  enablePreAlert5Min?: boolean;
  selectedProduct?: ProductItem | null;
  customProduct?: string;
  productQuantity?: number;
  productTotalPrice?: number;
  baseTotalPrice?: number;
  gstRate?: number;
  gstAmount?: number;
  includeUnitPrice?: boolean;
  isWaShared?: boolean;
  sentMessage?: string;
  waTargetPhone?: string;
  waCustomNote?: string;
  customRequirement?: string;
  selectedQuoteInvoice?: any;
  notes: string;
  timestamp: string;
  callerName?: string;
  callerRole?: string;
  durationStr?: string;
  dateLabel?: string;
  scheduledDisplayDate?: string;
}

interface PostCallOutcomeModalProps {
  visible: boolean;
  leadId: string;
  leadName: string;
  phone: string;
  durationStr?: string;
  onClose: () => void;
  onSaveOutcome: (data: CallOutcomeData) => void;
}

// Generate Next 15 Days from Current Date
const getNext15Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i <= 15; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayNum = d.getDate();
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const dayOfWeek = d.toLocaleString('en-US', { weekday: 'short' });
    const isoDate = d.toISOString().split('T')[0];
    const formatted = `${dayOfWeek}, ${dayNum} ${monthName}`;
    dates.push({ dayNum, monthName, dayOfWeek, isoDate, formatted, offset: i });
  }
  return dates;
};

const DEFAULT_TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '12:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '06:30 PM',
];

export default function PostCallOutcomeModal({
  visible,
  leadId,
  leadName,
  phone,
  durationStr,
  onClose,
  onSaveOutcome,
}: PostCallOutcomeModalProps) {
  const insets = useSafeAreaInsets();
  const next15Days = useMemo(() => getNext15Days(), []);
  const { currentUser, token } = useAuthStore();

  // ── Step 1: Primary Category ────────────────────────────────────────────────
  // 'PICKED_UP' (Talked), 'NOT_RESPONDING', 'BUSY', 'SWITCHED_OFF', 'WHATSAPP_CHAT'
  const [outcome, setOutcome] = useState<
    'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT'
  >('PICKED_UP');

  // ── Step 2: Talked Sub-Option ───────────────────────────────────────────────
  // 'INTERESTED' | 'SAID_WILL_VISIT' | 'WANT_SOMETHING_ELSE' | 'CALL_LATER' | 'WRONG_NUMBER' | 'QUOTE_INVOICE_SHARED'
  const [talkedSubOption, setTalkedSubOption] = useState<
    | 'INTERESTED'
    | 'SAID_WILL_VISIT'
    | 'WANT_SOMETHING_ELSE'
    | 'CALL_LATER'
    | 'WRONG_NUMBER'
    | 'QUOTE_INVOICE_SHARED'
  >('INTERESTED');

  // WhatsApp Chat Sub-Option
  const [waChatSubOption, setWaChatSubOption] = useState<
    'DISCUSSED' | 'INTERESTED' | 'CHAT_LATER' | 'WILL_VISIT' | 'TEMPLATE_SENT'
  >('DISCUSSED');

  // ── Scheduling State ────────────────────────────────────────────────────────
  const tomorrowObj = next15Days[1] || next15Days[0];
  const [scheduledDate, setScheduledDate] = useState<string>(tomorrowObj.formatted);
  const [scheduledIsoDate, setScheduledIsoDate] = useState<string>(tomorrowObj.isoDate);
  const [scheduledTime, setScheduledTime] = useState<string>('10:30 AM');
  const [selectedQuickChip, setSelectedQuickChip] = useState<string>('Tomorrow (10:30 AM)');
  const [enablePreAlert5Min, setEnablePreAlert5Min] = useState<boolean>(true);

  // ── Product Catalog & Custom Product ────────────────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [customProductInput, setCustomProductInput] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // 🏷️ Per-Unit Price & 📊 GST Settings
  const [includeUnitPrice, setIncludeUnitPrice] = useState<boolean>(true);
  const [includeProductImage, setIncludeProductImage] = useState<boolean>(true);
  const [gstPreset, setGstPreset] = useState<'0' | '5' | '12' | '18' | '28' | 'CUSTOM'>('5');
  const [gstRate, setGstRate] = useState<number>(5);
  const [customGstInput, setCustomGstInput] = useState<string>('');

  // 📲 WhatsApp Product Share State
  const [productWaTargetPhone, setProductWaTargetPhone] = useState<string>(phone || '');
  const [productWaCustomNote, setProductWaCustomNote] = useState<string>('');
  const [isProductWaShared, setIsProductWaShared] = useState<boolean>(false);
  const [productWaLanguage, setProductWaLanguage] = useState<'EN' | 'HI' | 'HINGLISH'>('EN');

  // 🔄 Custom Requirement for "Want Something Else"
  const [customRequirement, setCustomRequirement] = useState('');

  // 📄 Quotation / Invoice Selection
  const [quotationsList, setQuotationsList] = useState<any[]>([]);
  const [selectedQuoteInvoice, setSelectedQuoteInvoice] = useState<any | null>(null);
  const [showQuoteSelector, setShowQuoteSelector] = useState(false);

  // 📝 Custom Notes
  const [notes, setNotes] = useState('');

  // Sync products on mount
  useEffect(() => {
    productCatalogService.getProducts().then((prods) => {
      if (Array.isArray(prods) && prods.length > 0) {
        const mapped: ProductItem[] = prods.map((p) => ({
          id: p.id,
          name: p.name,
          minPrice: `₹${p.minPrice.toLocaleString('en-IN')}`,
          maxPrice: `₹${p.maxPrice.toLocaleString('en-IN')}`,
          category: p.category,
          description: p.description || '',
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
          features: p.features || [],
          priceTiers: [],
          sku: p.sku || `SKU-${p.id.slice(0, 4).toUpperCase()}`,
        }));
        setLiveProducts(mapped);
      } else {
        setLiveProducts(CATALOG_PRODUCTS);
      }
    });

    // Fetch quotations for quotation sharing sub-option
    if (token) {
      apiService.getQuotations(token).then((qData) => {
        if (Array.isArray(qData) && qData.length > 0) {
          setQuotationsList(qData);
        }
      }).catch(() => {});
    }
  }, [token]);

  // Keep target phone updated if prop changes
  useEffect(() => {
    if (phone) setProductWaTargetPhone(phone);
  }, [phone]);

  const filteredProducts = useMemo(() => {
    const list = liveProducts.length > 0 ? liveProducts : CATALOG_PRODUCTS;
    if (!productSearch.trim()) return list.slice(0, 5);
    const q = productSearch.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [liveProducts, productSearch]);

  // Pricing calculations
  const calculateProductPricing = () => {
    if (!selectedProduct) {
      return {
        unitPrice: 0,
        qty: selectedQuantity,
        baseTotalPrice: 0,
        gstRate: 0,
        gstAmount: 0,
        finalTotalPrice: 0,
        unitLabel: 'Unit',
      };
    }
    const cleanPrice = parseInt(selectedProduct.minPrice.replace(/[^0-9]/g, ''), 10) || 5000;
    const qty = Math.max(1, selectedQuantity);
    const baseTotalPrice = cleanPrice * qty;
    const effectiveGstRate = gstPreset === 'CUSTOM' ? parseFloat(customGstInput) || 0 : gstRate;
    const gstAmount = effectiveGstRate > 0 ? Math.round((baseTotalPrice * effectiveGstRate) / 100) : 0;
    const finalTotalPrice = baseTotalPrice + gstAmount;

    return {
      unitPrice: cleanPrice,
      qty,
      baseTotalPrice,
      gstRate: effectiveGstRate,
      gstAmount,
      finalTotalPrice,
      unitLabel: 'Units',
    };
  };

  // Derive target lifecycle stage (Parity with Web auto-stage transition)
  const targetStage = useMemo(() => {
    if (outcome === 'PICKED_UP') {
      if (talkedSubOption === 'INTERESTED') return 'Qualified';
      if (talkedSubOption === 'SAID_WILL_VISIT') return 'Meeting Scheduled';
      if (talkedSubOption === 'QUOTE_INVOICE_SHARED') return 'Negotiation';
      if (talkedSubOption === 'WRONG_NUMBER') return 'Lost';
      return 'Contacted';
    }
    if (outcome === 'WHATSAPP_CHAT') {
      if (waChatSubOption === 'INTERESTED') return 'Qualified';
      if (waChatSubOption === 'WILL_VISIT') return 'Meeting Scheduled';
      return 'Contacted';
    }
    return 'Contacted';
  }, [outcome, talkedSubOption, waChatSubOption]);

  // Preset quick scheduling helpers
  const applyQuickPreset = (presetLabel: string, delayMinutes?: number, delayDays?: number, timeStr?: string) => {
    setSelectedQuickChip(presetLabel);
    if (delayMinutes !== undefined) {
      const now = new Date();
      const target = new Date(now.getTime() + delayMinutes * 60 * 1000);
      const iso = target.toISOString().split('T')[0];
      const hours = target.getHours();
      const minutes = target.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedTime = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

      setScheduledIsoDate(iso);
      setScheduledDate(`Today, ${target.getDate()} ${target.toLocaleString('en-US', { month: 'short' })}`);
      setScheduledTime(formattedTime);
    } else if (delayDays !== undefined) {
      const d = new Date();
      d.setDate(d.getDate() + delayDays);
      const iso = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const dayOfWeek = d.toLocaleString('en-US', { weekday: 'short' });

      setScheduledIsoDate(iso);
      setScheduledDate(`${dayOfWeek}, ${dayNum} ${monthName}`);
      setScheduledTime(timeStr || '10:30 AM');
    }
  };

  // Reset modal state
  const resetState = () => {
    setOutcome('PICKED_UP');
    setTalkedSubOption('INTERESTED');
    setWaChatSubOption('DISCUSSED');
    const tObj = next15Days[1] || next15Days[0];
    setScheduledDate(tObj.formatted);
    setScheduledIsoDate(tObj.isoDate);
    setScheduledTime('10:30 AM');
    setSelectedQuickChip('Tomorrow (10:30 AM)');
    setEnablePreAlert5Min(true);
    setProductSearch('');
    setSelectedProduct(null);
    setCustomProductInput('');
    setSelectedQuantity(1);
    setIncludeUnitPrice(true);
    setIncludeProductImage(true);
    setGstPreset('5');
    setGstRate(5);
    setCustomGstInput('');
    setIsProductWaShared(false);
    setProductWaCustomNote('');
    setCustomRequirement('');
    setSelectedQuoteInvoice(null);
    setNotes('');
  };

  // Generate localized WhatsApp product share message
  const generateProductWhatsAppMessage = (customNote?: string, lang: 'EN' | 'HI' | 'HINGLISH' = 'EN') => {
    const clientName = leadName || 'Valued Customer';
    const prodName = customProductInput.trim() || selectedProduct?.name || 'Exclusive Solution';
    const pricing = calculateProductPricing();
    const qty = pricing.qty;

    const unitPriceLine = includeUnitPrice && selectedProduct
      ? (lang === 'HI' ? `🏷️ *प्रति यूनिट मूल्य:* ₹${pricing.unitPrice.toLocaleString('en-IN')} / यूनिट\n` : `🏷️ *Per Unit Price:* ₹${pricing.unitPrice.toLocaleString('en-IN')} / unit\n`)
      : '';

    let priceBlock = '';
    const baseTotalFormatted = `₹${pricing.baseTotalPrice.toLocaleString('en-IN')}`;
    const finalTotalFormatted = `₹${pricing.finalTotalPrice.toLocaleString('en-IN')}`;

    if (pricing.gstRate > 0) {
      priceBlock =
        `💵 *Subtotal (Base Value):* ${baseTotalFormatted}\n` +
        `📊 *GST Rate (${pricing.gstRate}%):* +₹${pricing.gstAmount.toLocaleString('en-IN')}\n` +
        `💰 *Estimated Net Total (incl. ${pricing.gstRate}% GST):* *${finalTotalFormatted}*`;
    } else {
      priceBlock = `💰 *Estimated Total Value:* *${baseTotalFormatted}*`;
    }

    const repName = (currentUser?.name || 'Sales Executive').trim();
    let rawCompany = (currentUser?.companyName || 'Adorable Trading').trim();
    if (!rawCompany || rawCompany === '—' || rawCompany.toUpperCase().includes('DAS CRM')) {
      rawCompany = 'Adorable Trading';
    }

    const desc = selectedProduct?.description ? `\n\n📝 *Specifications:* ${selectedProduct.description}` : '';
    const extraNote = customNote && customNote.trim() ? `\n\n💡 *Note:* "${customNote.trim()}"` : '';

    if (lang === 'HI') {
      return (
        `नमस्ते *${clientName} जी*,\n\n` +
        `हमसे *${prodName}* के बारे में चर्चा करने के लिए धन्यवाद! उत्पाद विवरण:\n\n` +
        `📦 *उत्पाद:* *${prodName}*\n` +
        `🔢 *मात्रा:* ${qty} ${pricing.unitLabel}\n` +
        unitPriceLine +
        priceBlock +
        desc +
        extraNote +
        `\n\n💬 कृपया बताएं यदि आपको कोई बदलाव या औपचारिक कोटेशन चाहिए।\n\nसादर,\n*${repName}*\n*${rawCompany}*`
      );
    } else if (lang === 'HINGLISH') {
      return (
        `Namaste *${clientName} ji*,\n\n` +
        `Humse *${prodName}* ke baare mein baat karne ke liye dhanyawad! Complete product details:\n\n` +
        `📦 *Product:* *${prodName}*\n` +
        `🔢 *Quantity:* ${qty} ${pricing.unitLabel}\n` +
        unitPriceLine +
        priceBlock +
        desc +
        extraNote +
        `\n\n💬 Agar formal quotation ya koi adjustment chahiye toh batayein!\n\nBest regards,\n*${repName}*\n*${rawCompany}*`
      );
    }

    return (
      `Hello *${clientName}*,\n\n` +
      `Thank you for discussing *${prodName}* with us! Complete product details:\n\n` +
      `📦 *Product:* *${prodName}*\n` +
      `🔢 *Quantity:* ${qty} ${pricing.unitLabel}\n` +
      unitPriceLine +
      priceBlock +
      desc +
      extraNote +
      `\n\n💬 Please let us know if you need any adjustments or a formal quotation.\n\nBest regards,\n*${repName}*\n*${rawCompany}*`
    );
  };

  const handleShareProductViaWhatsApp = async () => {
    const targetPhone = (productWaTargetPhone || phone || '').replace(/[^0-9]/g, '');
    const finalMsg = generateProductWhatsAppMessage(productWaCustomNote, productWaLanguage);
    const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(finalMsg)}`;

    try {
      await Linking.openURL(waUrl);
      setIsProductWaShared(true);
      Alert.alert('✅ WhatsApp Opened', 'Product details opened in WhatsApp.');
    } catch {
      Linking.openURL(waUrl).catch(() => {});
    }
  };

  // Submit and save disposition outcome
  const handleSave = () => {
    const pricing = calculateProductPricing();
    const qty = Math.max(1, selectedQuantity || 1);
    const prodName = customProductInput.trim() || selectedProduct?.name;

    // Build enriched notes
    let notesSummary = notes.trim();
    if (outcome === 'PICKED_UP' && talkedSubOption === 'INTERESTED' && (selectedProduct || customProductInput.trim())) {
      const waStatus = isProductWaShared ? ' [Shared via WhatsApp]' : '';
      const gstTag = pricing.gstRate > 0 ? ` incl. ${pricing.gstRate}% GST` : '';
      const prodTag = `Product: ${prodName} (Qty: ${qty} · ₹${pricing.finalTotalPrice.toLocaleString('en-IN')}${gstTag})${waStatus}`;
      notesSummary = notesSummary ? `${notesSummary} • ${prodTag}` : prodTag;
    } else if (outcome === 'PICKED_UP' && talkedSubOption === 'WANT_SOMETHING_ELSE' && customRequirement.trim()) {
      const reqTag = `Custom Requirement: "${customRequirement.trim()}"`;
      notesSummary = notesSummary ? `${notesSummary} • ${reqTag}` : reqTag;
    } else if (outcome === 'PICKED_UP' && talkedSubOption === 'QUOTE_INVOICE_SHARED' && selectedQuoteInvoice) {
      const quoteTag = `Quotation Shared: #${selectedQuoteInvoice.docNo || selectedQuoteInvoice.quoteNumber || 'QT'} (₹${Number(selectedQuoteInvoice.totalAmount || 0).toLocaleString('en-IN')})`;
      notesSummary = notesSummary ? `${notesSummary} • ${quoteTag}` : quoteTag;
    }

    const isSchedulingApplicable =
      (outcome === 'PICKED_UP' && (talkedSubOption === 'CALL_LATER' || talkedSubOption === 'SAID_WILL_VISIT' || talkedSubOption === 'INTERESTED')) ||
      outcome === 'NOT_RESPONDING' ||
      outcome === 'BUSY' ||
      outcome === 'SWITCHED_OFF' ||
      (outcome === 'WHATSAPP_CHAT' && (waChatSubOption === 'CHAT_LATER' || waChatSubOption === 'WILL_VISIT'));

    const resolvedDuration = durationStr || (outcome === 'PICKED_UP' ? '2m 14s' : undefined);

    const data: CallOutcomeData = {
      leadId,
      leadName,
      phone,
      outcome,
      subOption:
        outcome === 'PICKED_UP'
          ? (talkedSubOption as any)
          : outcome === 'WHATSAPP_CHAT'
          ? (waChatSubOption as any)
          : undefined,
      targetStage,
      scheduledDate: isSchedulingApplicable ? (scheduledIsoDate || scheduledDate) : undefined,
      scheduledDisplayDate: isSchedulingApplicable ? scheduledDate : undefined,
      scheduledTime: isSchedulingApplicable ? scheduledTime : undefined,
      enablePreAlert5Min: isSchedulingApplicable ? enablePreAlert5Min : undefined,
      selectedProduct,
      customProduct: customProductInput.trim() || undefined,
      productQuantity: selectedProduct || customProductInput.trim() ? qty : undefined,
      productTotalPrice: selectedProduct ? pricing.finalTotalPrice : undefined,
      baseTotalPrice: selectedProduct ? pricing.baseTotalPrice : undefined,
      gstRate: selectedProduct ? pricing.gstRate : undefined,
      gstAmount: selectedProduct ? pricing.gstAmount : undefined,
      includeUnitPrice,
      isWaShared: isProductWaShared,
      sentMessage: isProductWaShared ? generateProductWhatsAppMessage(productWaCustomNote) : undefined,
      waTargetPhone: productWaTargetPhone,
      waCustomNote: productWaCustomNote,
      customRequirement: customRequirement.trim() || undefined,
      selectedQuoteInvoice,
      notes: notesSummary || `Call disposition logged: ${outcome.replace('_', ' ')} (${targetStage}).`,
      durationStr: resolvedDuration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveOutcome(data);
    resetState();
    onClose();

    Alert.alert(
      '✅ Call Outcome & Activity Synced',
      `Lead: ${leadName}\n• Category: ${outcome.replace('_', ' ')}\n• Stage: ${targetStage}\n${isSchedulingApplicable ? `• Followup: ${scheduledDate} at ${scheduledTime}` : ''}`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 },
          ]}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* ── 1. MODAL HEADER (Parity with Web Engine) ────────────────────────── */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.engineBadge}>
                  <Text style={styles.engineBadgeText}>📞 POST-CALL OUTCOME ENGINE</Text>
                </View>
                <Text style={styles.headerTitle}>Log Call Outcome &amp; Auto-Sync CRM</Text>
                <Text style={styles.headerSub}>
                  <Text style={{ color: '#ffffff', fontWeight: '800' }}>{leadName}</Text> ({phone})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  resetState();
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── 2. STEP 1: PRIMARY OUTCOME CATEGORY (4 Core Funnels + WhatsApp) ──── */}
            <Text style={styles.sectionLabel}>Select Primary Call Disposition Category *</Text>
            <View style={styles.primaryCategoryGrid}>
              {[
                {
                  key: 'PICKED_UP',
                  label: '1. Talked (Call Connected)',
                  desc: 'Spoke with prospect / answered',
                  emoji: '🗣️',
                  activeBg: 'rgba(16,185,129,0.22)',
                  activeBorder: '#10b981',
                  activeText: '#34d399',
                },
                {
                  key: 'NOT_RESPONDING',
                  label: '2. Not Responding',
                  desc: 'Ringing but not picked',
                  emoji: '🔕',
                  activeBg: 'rgba(245,158,11,0.22)',
                  activeBorder: '#f59e0b',
                  activeText: '#fbbf24',
                },
                {
                  key: 'BUSY',
                  label: '3. Busy',
                  desc: 'Line engaged / waiting',
                  emoji: '⏳',
                  activeBg: 'rgba(239,68,68,0.22)',
                  activeBorder: '#ef4444',
                  activeText: '#f87171',
                },
                {
                  key: 'SWITCHED_OFF',
                  label: '4. Switched Off',
                  desc: 'Unreachable / off',
                  emoji: '📴',
                  activeBg: 'rgba(148,163,184,0.22)',
                  activeBorder: '#94a3b8',
                  activeText: '#cbd5e1',
                },
                {
                  key: 'WHATSAPP_CHAT',
                  label: '5. WhatsApp Chat',
                  desc: 'Direct WhatsApp interaction',
                  emoji: '💬',
                  activeBg: 'rgba(34,197,94,0.22)',
                  activeBorder: '#22c55e',
                  activeText: '#4ade80',
                },
              ].map((cat) => {
                const isSelected = outcome === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryCard,
                      cat.key === 'WHATSAPP_CHAT' && { minWidth: '100%' },
                      isSelected && {
                        backgroundColor: cat.activeBg,
                        borderColor: cat.activeBorder,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => {
                      setOutcome(cat.key as any);
                      if (cat.key === 'NOT_RESPONDING' || cat.key === 'BUSY' || cat.key === 'SWITCHED_OFF') {
                        applyQuickPreset('Tomorrow (10:30 AM)', undefined, 1, '10:30 AM');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.categoryTitle, isSelected && { color: cat.activeText }]}>
                        {cat.emoji} {cat.label}
                      </Text>
                      {isSelected && <Text style={{ color: cat.activeText, fontWeight: '900', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={styles.categoryDesc}>{cat.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 3. STEP 2: CATEGORY-SPECIFIC CONTROLS & SUB-OPTIONS ─────────────── */}

            {/* ── FUNNEL A: TALKED (CALL CONNECTED) ─────────────────────────────────── */}
            {outcome === 'PICKED_UP' && (
              <View style={styles.funnelBox}>
                <View style={styles.funnelHeaderRow}>
                  <Text style={styles.funnelTitle}>🗣️ Talked Sub-Option:</Text>
                  <View style={styles.stagePill}>
                    <Text style={styles.stagePillText}>Auto Stage: {targetStage}</Text>
                  </View>
                </View>

                {/* 6 Sub-Option Buttons matching Web */}
                <View style={styles.subGrid}>
                  {[
                    { key: 'INTERESTED', label: 'a - Interested (product or service)', emoji: '💡' },
                    { key: 'SAID_WILL_VISIT', label: 'b - Said He Will Visit', emoji: '🤝' },
                    { key: 'WANT_SOMETHING_ELSE', label: 'c - Want Something Else', emoji: '🔄' },
                    { key: 'CALL_LATER', label: 'd - Busy will talk later', emoji: '⏰' },
                    { key: 'WRONG_NUMBER', label: 'e - Wrong Number', emoji: '⚠️' },
                    { key: 'QUOTE_INVOICE_SHARED', label: 'f - Quotation / Invoice Shared', emoji: '📄' },
                  ].map((sub) => {
                    const isSelected = talkedSubOption === sub.key;
                    return (
                      <TouchableOpacity
                        key={sub.key}
                        style={[styles.subOptionBtn, isSelected && styles.subOptionBtnActive]}
                        onPress={() => {
                          setTalkedSubOption(sub.key as any);
                          if (sub.key === 'QUOTE_INVOICE_SHARED') {
                            setShowQuoteSelector(true);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.subOptionText, isSelected && styles.subOptionTextActive]}>
                          {sub.emoji} {sub.label} {isSelected ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ── SUB-OPTION A: INTERESTED (Products, Pricing, WhatsApp & Scheduling) ── */}
                {talkedSubOption === 'INTERESTED' && (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    {/* Product Search & List */}
                    <View style={styles.innerCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.innerCardTitle}>📦 Select Interested Product / Catalogue:</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700' }}>
                          {liveProducts.length} Synced
                        </Text>
                      </View>

                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search products (e.g. ERP, CRM, WhatsApp Bot)..."
                        placeholderTextColor="#64748b"
                        value={productSearch}
                        onChangeText={setProductSearch}
                      />

                      <View style={{ gap: 6, maxHeight: 150 }}>
                        {filteredProducts.map((prod) => {
                          const isSelected = selectedProduct?.id === prod.id && !customProductInput.trim();
                          return (
                            <TouchableOpacity
                              key={prod.id}
                              style={[styles.prodRow, isSelected && styles.prodRowActive]}
                              onPress={() => {
                                setSelectedProduct(prod);
                                setCustomProductInput('');
                              }}
                              activeOpacity={0.8}
                            >
                              <ProductImage uri={prod.imageUrl} style={styles.prodThumb} />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.prodTitle, isSelected && { color: '#34d399' }]} numberOfLines={1}>
                                  {prod.name}
                                </Text>
                                <Text style={styles.prodSub} numberOfLines={1}>
                                  {prod.category} · {prod.sku}
                                </Text>
                              </View>
                              <Text style={styles.prodPriceTag}>{prod.minPrice}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Custom Product / Service Entry */}
                      <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 8 }}>
                        Or Enter Other Custom Product / Service Name:
                      </Text>
                      <TextInput
                        style={styles.customProdInput}
                        placeholder="e.g. Healthcare Multi-Branch Custom License..."
                        placeholderTextColor="#64748b"
                        value={customProductInput}
                        onChangeText={(t) => {
                          setCustomProductInput(t);
                          if (t.trim()) setSelectedProduct(null);
                        }}
                      />
                    </View>

                    {/* Quantity Stepper & Live Pricing */}
                    {(selectedProduct || customProductInput.trim()) && (() => {
                      const pricing = calculateProductPricing();
                      return (
                        <View style={styles.innerCard}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.innerCardTitle}>📦 Required Quantity:</Text>
                            <View style={styles.stepperBox}>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                              >
                                <Text style={styles.stepperBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.stepperVal}>{selectedQuantity}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setSelectedQuantity((q) => q + 1)}
                              >
                                <Text style={styles.stepperBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Per-Unit Price & Attach Image Toggles */}
                          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                            <TouchableOpacity
                              style={styles.checkboxRow}
                              onPress={() => setIncludeUnitPrice(!includeUnitPrice)}
                              activeOpacity={0.8}
                            >
                              <View style={[styles.checkbox, includeUnitPrice && styles.checkboxActive]}>
                                {includeUnitPrice && <Text style={styles.checkboxCheck}>✓</Text>}
                              </View>
                              <Text style={styles.checkboxLabel}>🏷️ Include Per-Unit Price</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.checkboxRow}
                              onPress={() => setIncludeProductImage(!includeProductImage)}
                              activeOpacity={0.8}
                            >
                              <View style={[styles.checkbox, includeProductImage && styles.checkboxActive]}>
                                {includeProductImage && <Text style={styles.checkboxCheck}>✓</Text>}
                              </View>
                              <Text style={styles.checkboxLabel}>🖼️ Attach Product Image</Text>
                            </TouchableOpacity>
                          </View>

                          {/* GST Tax Rate Presets */}
                          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#38bdf8', marginBottom: 6 }}>
                              📊 GST Rate Presets:
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                              {[
                                { key: '0', label: '0% (No GST)', val: 0 },
                                { key: '5', label: '5% (Default)', val: 5 },
                                { key: '12', label: '12%', val: 12 },
                                { key: '18', label: '18%', val: 18 },
                                { key: '28', label: '28%', val: 28 },
                              ].map((g) => (
                                <TouchableOpacity
                                  key={g.key}
                                  style={[styles.smallChip, gstPreset === g.key && styles.smallChipActive]}
                                  onPress={() => {
                                    setGstPreset(g.key as any);
                                    setGstRate(g.val);
                                  }}
                                >
                                  <Text style={[styles.smallChipText, gstPreset === g.key && styles.smallChipTextActive]}>
                                    {g.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Net Value Breakdown */}
                          <View style={styles.totalBox}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 10, color: '#94a3b8' }}>Base Subtotal:</Text>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>
                                ₹{pricing.baseTotalPrice.toLocaleString('en-IN')}
                              </Text>
                            </View>
                            {pricing.gstRate > 0 && (
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                                <Text style={{ fontSize: 10, color: '#94a3b8' }}>GST ({pricing.gstRate}%):</Text>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#38bdf8' }}>
                                  +₹{pricing.gstAmount.toLocaleString('en-IN')}
                                </Text>
                              </View>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#334155' }}>
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff' }}>Net Total:</Text>
                              <Text style={{ fontSize: 13, fontWeight: '900', color: '#34d399' }}>
                                ₹{pricing.finalTotalPrice.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>

                          {/* WhatsApp Direct Dispatch Card */}
                          <View style={styles.waCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#22c55e' }}>
                                💬 Send Product on WhatsApp
                              </Text>
                              {isProductWaShared && (
                                <View style={styles.sharedBadge}>
                                  <Text style={styles.sharedBadgeText}>✓ Shared</Text>
                                </View>
                              )}
                            </View>

                            <TextInput
                              style={styles.waInput}
                              placeholder="Lead WhatsApp Phone..."
                              placeholderTextColor="#64748b"
                              keyboardType="phone-pad"
                              value={productWaTargetPhone}
                              onChangeText={setProductWaTargetPhone}
                            />
                            <TextInput
                              style={styles.waInput}
                              placeholder="Custom note (e.g. Valid until Friday)..."
                              placeholderTextColor="#64748b"
                              value={productWaCustomNote}
                              onChangeText={setProductWaCustomNote}
                            />

                            {/* Preview with Language selector */}
                            <View style={styles.waPreviewBox}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ fontSize: 8, fontWeight: '900', color: '#22c55e' }}>LIVE PREVIEW</Text>
                                <View style={{ flexDirection: 'row', gap: 3 }}>
                                  {(['EN', 'HI', 'HINGLISH'] as const).map((l) => (
                                    <TouchableOpacity
                                      key={l}
                                      style={[styles.langChip, productWaLanguage === l && styles.langChipActive]}
                                      onPress={() => setProductWaLanguage(l)}
                                    >
                                      <Text style={[styles.langChipText, productWaLanguage === l && styles.langChipTextActive]}>
                                        {l === 'EN' ? '🇬🇧 EN' : l === 'HI' ? '🇮🇳 हिन्दी' : '🗣️ Hinglish'}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                              <Text style={styles.waPreviewText} numberOfLines={5}>
                                {generateProductWhatsAppMessage(productWaCustomNote, productWaLanguage)}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.waSendBtn}
                              onPress={handleShareProductViaWhatsApp}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.waSendBtnText}>📲 Send via WhatsApp Direct Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}

                    {/* Follow-up Call Scheduling Options under Interested */}
                    <View style={styles.innerCard}>
                      <Text style={styles.innerCardTitle}>⏰ Follow-up Call Scheduling Options:</Text>

                      {/* 1-Tap Quick Action */}
                      <TouchableOpacity
                        style={[
                          styles.quickActionBtn,
                          selectedQuickChip === 'Tomorrow (10:30 AM)' && styles.quickActionBtnActive,
                        ]}
                        onPress={() => applyQuickPreset('Tomorrow (10:30 AM)', undefined, 1, '10:30 AM')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.quickActionText, selectedQuickChip === 'Tomorrow (10:30 AM)' && { color: '#fbbf24' }]}>
                          ⚡ a.1 - Quick Pick: Followup Tomorrow (10:30 AM)
                        </Text>
                        {selectedQuickChip === 'Tomorrow (10:30 AM)' && (
                          <Text style={{ color: '#fbbf24', fontWeight: '900', fontSize: 11 }}>✓</Text>
                        )}
                      </TouchableOpacity>

                      {/* 15-Day Date Chips */}
                      <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', marginTop: 8 }}>
                        Or Choose Custom Date (Next 15 Days):
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                        {next15Days.map((dObj) => (
                          <TouchableOpacity
                            key={dObj.isoDate}
                            style={[styles.dateChip, scheduledDate === dObj.formatted && styles.dateChipActive]}
                            onPress={() => {
                              setScheduledDate(dObj.formatted);
                              setScheduledIsoDate(dObj.isoDate);
                              setSelectedQuickChip('Custom Date');
                            }}
                          >
                            <Text style={[styles.dateChipSub, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                              {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                            </Text>
                            <Text style={[styles.dateChipNum, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                              {dObj.dayNum}
                            </Text>
                            <Text style={[styles.dateChipMonth, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                              {dObj.monthName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Time Slots */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {DEFAULT_TIME_SLOTS.map((slot) => (
                          <TouchableOpacity
                            key={slot}
                            style={[styles.timeChip, scheduledTime === slot && styles.timeChipActive]}
                            onPress={() => {
                              setScheduledTime(slot);
                              setSelectedQuickChip('Custom Date');
                            }}
                          >
                            <Text style={[styles.timeChipText, scheduledTime === slot && { color: '#ffffff', fontWeight: '900' }]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* 5-Min Pre-Alert Notification */}
                      <TouchableOpacity
                        style={[styles.checkboxRow, { marginTop: 8 }]}
                        onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkbox, enablePreAlert5Min && styles.checkboxActive]}>
                          {enablePreAlert5Min && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>
                          🔔 Pre-alert notification (5 mins before scheduled time in Follow-ups)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── SUB-OPTION B: SAID HE WILL VISIT ───────────────────────────── */}
                {talkedSubOption === 'SAID_WILL_VISIT' && (
                  <View style={[styles.innerCard, { marginTop: 10 }]}>
                    <Text style={styles.innerCardTitle}>📅 Select Expected Visit / Demo Date (Next 15 Days):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {next15Days.map((dObj) => (
                        <TouchableOpacity
                          key={dObj.isoDate}
                          style={[styles.dateChip, scheduledDate === dObj.formatted && styles.dateChipActive]}
                          onPress={() => {
                            setScheduledDate(dObj.formatted);
                            setScheduledIsoDate(dObj.isoDate);
                          }}
                        >
                          <Text style={[styles.dateChipSub, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                          </Text>
                          <Text style={[styles.dateChipNum, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.dayNum}
                          </Text>
                          <Text style={[styles.dateChipMonth, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '06:00 PM'].map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeChip, scheduledTime === slot && styles.timeChipActive]}
                          onPress={() => setScheduledTime(slot)}
                        >
                          <Text style={[styles.timeChipText, scheduledTime === slot && { color: '#ffffff', fontWeight: '900' }]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.checkboxRow, { marginTop: 8 }]}
                      onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, enablePreAlert5Min && styles.checkboxActive]}>
                        {enablePreAlert5Min && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>🔔 Pre-alert notification (5 mins before scheduled visit)</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── SUB-OPTION C: WANT SOMETHING ELSE ──────────────────────────── */}
                {talkedSubOption === 'WANT_SOMETHING_ELSE' && (
                  <View style={[styles.innerCard, { marginTop: 10 }]}>
                    <Text style={styles.innerCardTitle}>📝 Capture Client's Custom Requirement / Needed Specs:</Text>
                    <TextInput
                      style={styles.requirementInput}
                      multiline
                      numberOfLines={3}
                      placeholder="e.g. Client needs custom multi-currency invoicing and Shopify API sync..."
                      placeholderTextColor="#64748b"
                      value={customRequirement}
                      onChangeText={setCustomRequirement}
                    />
                  </View>
                )}

                {/* ── SUB-OPTION D: BUSY WILL TALK LATER ─────────────────────────── */}
                {talkedSubOption === 'CALL_LATER' && (
                  <View style={[styles.innerCard, { marginTop: 10 }]}>
                    <Text style={styles.innerCardTitle}>⏰ Select Callback Date (Next 15 Days):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {next15Days.map((dObj) => (
                        <TouchableOpacity
                          key={dObj.isoDate}
                          style={[styles.dateChip, scheduledDate === dObj.formatted && styles.dateChipActive]}
                          onPress={() => {
                            setScheduledDate(dObj.formatted);
                            setScheduledIsoDate(dObj.isoDate);
                          }}
                        >
                          <Text style={[styles.dateChipSub, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                          </Text>
                          <Text style={[styles.dateChipNum, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.dayNum}
                          </Text>
                          <Text style={[styles.dateChipMonth, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'].map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeChip, scheduledTime === slot && styles.timeChipActive]}
                          onPress={() => setScheduledTime(slot)}
                        >
                          <Text style={[styles.timeChipText, scheduledTime === slot && { color: '#ffffff', fontWeight: '900' }]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.checkboxRow, { marginTop: 8 }]}
                      onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, enablePreAlert5Min && styles.checkboxActive]}>
                        {enablePreAlert5Min && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>🔔 Pre-alert notification (5 mins before callback)</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── SUB-OPTION E: WRONG NUMBER ─────────────────────────────────── */}
                {talkedSubOption === 'WRONG_NUMBER' && (
                  <View style={styles.wrongNumberCard}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#f87171' }}>
                      ⚠️ Mark Lead as Lost (Wrong Number)
                    </Text>
                    <Text style={{ fontSize: 10, color: '#fca5a5', marginTop: 2 }}>
                      This action will auto-transition this prospect to the Lost stage in accordance with tenant lifecycle rules.
                    </Text>
                  </View>
                )}

                {/* ── SUB-OPTION F: QUOTATION / INVOICE SHARED ───────────────────── */}
                {talkedSubOption === 'QUOTE_INVOICE_SHARED' && (
                  <View style={[styles.innerCard, { marginTop: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.innerCardTitle}>📄 Quotation &amp; Invoice Attachment:</Text>
                      <TouchableOpacity
                        onPress={() => setShowQuoteSelector(!showQuoteSelector)}
                        style={styles.quoteSelectBtn}
                      >
                        <Text style={styles.quoteSelectBtnText}>
                          {selectedQuoteInvoice ? 'Change' : 'Select'} Document
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {selectedQuoteInvoice ? (
                      <View style={styles.quotePreviewBox}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>
                          #{selectedQuoteInvoice.docNo || selectedQuoteInvoice.quoteNumber || 'QT-DOC'}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#cbd5e1' }}>
                          Client: {selectedQuoteInvoice.partyName || selectedQuoteInvoice.clientName || leadName} · ₹{Number(selectedQuoteInvoice.totalAmount || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                        Select a formal quotation or commercial invoice from your CRM archive.
                      </Text>
                    )}

                    {showQuoteSelector && (
                      <View style={{ marginTop: 8, maxHeight: 120 }}>
                        {quotationsList.length === 0 ? (
                          <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                            No saved quotations found. Create one in Quotations module.
                          </Text>
                        ) : (
                          quotationsList.slice(0, 4).map((q) => (
                            <TouchableOpacity
                              key={q.id || q.quoteNumber}
                              style={styles.quoteItemRow}
                              onPress={() => {
                                setSelectedQuoteInvoice(q);
                                setShowQuoteSelector(false);
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                                #{q.docNo || q.quoteNumber}
                              </Text>
                              <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>
                                ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── FUNNEL B: NOT RESPONDING (RINGING BUT NOT PICKED) ────────────────── */}
            {outcome === 'NOT_RESPONDING' && (
              <View style={styles.funnelBox}>
                <View style={styles.funnelHeaderRow}>
                  <Text style={styles.funnelTitle}>🔕 Not Responding Follow-up:</Text>
                  <View style={[styles.stagePill, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                    <Text style={[styles.stagePillText, { color: '#fbbf24' }]}>Auto Stage: Contacted</Text>
                  </View>
                </View>

                {/* 1-Tap Quick Action */}
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    selectedQuickChip === 'Tomorrow (10:30 AM)' && styles.quickActionBtnActive,
                  ]}
                  onPress={() => applyQuickPreset('Tomorrow (10:30 AM)', undefined, 1, '10:30 AM')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickActionText, selectedQuickChip === 'Tomorrow (10:30 AM)' && { color: '#fbbf24' }]}>
                    ⚡ a.1 - Quick Pick: Followup Tomorrow (10:30 AM)
                  </Text>
                  {selectedQuickChip === 'Tomorrow (10:30 AM)' && (
                    <Text style={{ color: '#fbbf24', fontWeight: '900', fontSize: 11 }}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* 15-Day Date Chips */}
                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', marginTop: 8 }}>
                  Or Choose Custom Date (Next 15 Days):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {next15Days.map((dObj) => (
                    <TouchableOpacity
                      key={dObj.isoDate}
                      style={[styles.dateChip, scheduledDate === dObj.formatted && styles.dateChipActive]}
                      onPress={() => {
                        setScheduledDate(dObj.formatted);
                        setScheduledIsoDate(dObj.isoDate);
                        setSelectedQuickChip('Custom Date');
                      }}
                    >
                      <Text style={[styles.dateChipSub, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                      </Text>
                      <Text style={[styles.dateChipNum, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.dayNum}
                      </Text>
                      <Text style={[styles.dateChipMonth, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.monthName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time Slots */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {DEFAULT_TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.timeChip, scheduledTime === slot && styles.timeChipActive]}
                      onPress={() => {
                        setScheduledTime(slot);
                        setSelectedQuickChip('Custom Date');
                      }}
                    >
                      <Text style={[styles.timeChipText, scheduledTime === slot && { color: '#ffffff', fontWeight: '900' }]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pre-Alert 5-Min Notification */}
                <TouchableOpacity
                  style={[styles.checkboxRow, { marginTop: 8 }]}
                  onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, enablePreAlert5Min && styles.checkboxActive]}>
                    {enablePreAlert5Min && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    🔔 Pre-alert notification (5 mins before scheduled time in Follow-ups)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── FUNNEL C: BUSY OR SWITCHED OFF ───────────────────────────────────── */}
            {(outcome === 'BUSY' || outcome === 'SWITCHED_OFF') && (
              <View style={styles.funnelBox}>
                <View style={styles.funnelHeaderRow}>
                  <Text style={styles.funnelTitle}>
                    {outcome === 'BUSY' ? '⏳ Busy Line Callback:' : '📴 Switched Off Callback:'}
                  </Text>
                  <View style={[styles.stagePill, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                    <Text style={[styles.stagePillText, { color: '#f87171' }]}>Auto Stage: Contacted</Text>
                  </View>
                </View>

                {/* Quick Callback Preset Chips matching Web */}
                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', marginBottom: 6 }}>
                  Select Quick Callback Preset:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: '30 Mins', delayMins: 30 },
                    { label: '1 Hour', delayMins: 60 },
                    { label: '2 Hours', delayMins: 120 },
                    { label: 'Tomorrow (10:30 AM)', delayDays: 1, time: '10:30 AM' },
                    { label: 'Custom Date/Time', isCustom: true },
                  ].map((chip) => {
                    const isChipSelected = selectedQuickChip === chip.label;
                    return (
                      <TouchableOpacity
                        key={chip.label}
                        style={[styles.presetChip, isChipSelected && styles.presetChipActive]}
                        onPress={() => {
                          if (chip.delayMins) {
                            applyQuickPreset(chip.label, chip.delayMins);
                          } else if (chip.delayDays) {
                            applyQuickPreset(chip.label, undefined, chip.delayDays, chip.time);
                          } else {
                            setSelectedQuickChip(chip.label);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isChipSelected && styles.presetChipTextActive]}>
                          ⚡ {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Date / Time if Custom Date/Time selected */}
                {selectedQuickChip === 'Custom Date/Time' && (
                  <View style={{ marginTop: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {next15Days.map((dObj) => (
                        <TouchableOpacity
                          key={dObj.isoDate}
                          style={[styles.dateChip, scheduledDate === dObj.formatted && styles.dateChipActive]}
                          onPress={() => {
                            setScheduledDate(dObj.formatted);
                            setScheduledIsoDate(dObj.isoDate);
                          }}
                        >
                          <Text style={[styles.dateChipSub, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                          </Text>
                          <Text style={[styles.dateChipNum, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.dayNum}
                          </Text>
                          <Text style={[styles.dateChipMonth, scheduledDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {DEFAULT_TIME_SLOTS.map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeChip, scheduledTime === slot && styles.timeChipActive]}
                          onPress={() => setScheduledTime(slot)}
                        >
                          <Text style={[styles.timeChipText, scheduledTime === slot && { color: '#ffffff', fontWeight: '900' }]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.checkboxRow, { marginTop: 8 }]}
                  onPress={() => setEnablePreAlert5Min(!enablePreAlert5Min)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, enablePreAlert5Min && styles.checkboxActive]}>
                    {enablePreAlert5Min && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>🔔 Pre-alert notification (5 mins before callback)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── FUNNEL D: WHATSAPP CHAT ───────────────────────────────────────────── */}
            {outcome === 'WHATSAPP_CHAT' && (
              <View style={styles.funnelBox}>
                <View style={styles.funnelHeaderRow}>
                  <Text style={styles.funnelTitle}>💬 WhatsApp Chat Detail Action:</Text>
                  <View style={[styles.stagePill, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                    <Text style={[styles.stagePillText, { color: '#4ade80' }]}>Auto Stage: {targetStage}</Text>
                  </View>
                </View>

                <View style={styles.subGrid}>
                  {[
                    { key: 'DISCUSSED', label: '🗣️ Discussed on WhatsApp / Chat Completed' },
                    { key: 'INTERESTED', label: '💡 Interested in Product & Product Shared' },
                    { key: 'CHAT_LATER', label: '⏰ Will Chat / Call Later' },
                    { key: 'WILL_VISIT', label: '🤝 Said He Will Visit' },
                    { key: 'TEMPLATE_SENT', label: '💬 WhatsApp Template Message Sent' },
                  ].map((sub) => {
                    const isSelected = waChatSubOption === sub.key;
                    return (
                      <TouchableOpacity
                        key={sub.key}
                        style={[styles.subOptionBtn, isSelected && styles.subOptionBtnActive]}
                        onPress={() => setWaChatSubOption(sub.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.subOptionText, isSelected && styles.subOptionTextActive]}>
                          {sub.label} {isSelected ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── 4. STEP 3: CONVERSATION REMARKS & NOTES ──────────────────────────── */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionLabel}>📝 Call Notes &amp; Conversation Remarks:</Text>
              <TextInput
                style={styles.notesBoxInput}
                multiline
                numberOfLines={3}
                placeholder="Enter discussion summary or callback instructions..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* ── 5. LIVE STAGE TRANSITION SUMMARY PREVIEW (Parity with Web) ──────── */}
            <View style={styles.stagePreviewBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Target Stage:</Text>
                <View
                  style={[
                    styles.stageBadge,
                    targetStage === 'Qualified'
                      ? { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10b981' }
                      : targetStage === 'Meeting Scheduled'
                      ? { backgroundColor: 'rgba(56,189,248,0.2)', borderColor: '#38bdf8' }
                      : targetStage === 'Negotiation'
                      ? { backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#a855f7' }
                      : targetStage === 'Lost'
                      ? { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }
                      : { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#f59e0b' },
                  ]}
                >
                  <Text
                    style={[
                      styles.stageBadgeText,
                      targetStage === 'Qualified'
                        ? { color: '#34d399' }
                        : targetStage === 'Meeting Scheduled'
                        ? { color: '#38bdf8' }
                        : targetStage === 'Negotiation'
                        ? { color: '#c084fc' }
                        : targetStage === 'Lost'
                        ? { color: '#f87171' }
                        : { color: '#fbbf24' },
                    ]}
                  >
                    {targetStage}
                  </Text>
                </View>
              </View>

              {/* Scheduled timing if applicable */}
              {targetStage !== 'Lost' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 10, color: '#cbd5e1', fontWeight: '800' }}>
                    📅 {scheduledDate} ({scheduledTime})
                  </Text>
                  {enablePreAlert5Min && <Text style={{ fontSize: 10 }}>🔔 5m</Text>}
                </View>
              )}
            </View>

            {/* ── 6. ACTION BUTTONS ────────────────────────────────────────────────── */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  resetState();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveOutcomeBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveOutcomeBtnText}>💾 Save Lead Status &amp; Store with Lead →</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '94%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  engineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  engineBadgeText: { fontSize: 8, fontWeight: '900', color: '#34d399', letterSpacing: 0.5 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#818cf8', marginBottom: 8, marginTop: 4 },

  primaryCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  categoryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
  },
  categoryTitle: { fontSize: 11, fontWeight: '800', color: '#cbd5e1' },
  categoryDesc: { fontSize: 9, color: '#64748b', marginTop: 3 },

  funnelBox: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  funnelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  funnelTitle: { fontSize: 11, fontWeight: '800', color: '#38bdf8' },
  stagePill: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stagePillText: { fontSize: 9, fontWeight: '800', color: '#34d399' },

  subGrid: { gap: 6 },
  subOptionBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  subOptionBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8', borderWidth: 1.5 },
  subOptionText: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },
  subOptionTextActive: { color: '#818cf8', fontWeight: '900' },

  innerCard: { backgroundColor: '#0f172a', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  innerCardTitle: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },

  searchInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: '#ffffff',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  customProdInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: '#ffffff',
    fontSize: 10,
    marginTop: 4,
  },

  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  prodRowActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)' },
  prodThumb: { width: 30, height: 30, borderRadius: 6 },
  prodTitle: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  prodSub: { fontSize: 8, color: '#94a3b8' },
  prodPriceTag: { fontSize: 10, fontWeight: '900', color: '#34d399' },

  stepperBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  stepperBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  stepperVal: { color: '#ffffff', fontSize: 11, fontWeight: '900', paddingHorizontal: 8 },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#475569', backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#10b981', borderColor: '#059669' },
  checkboxCheck: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  checkboxLabel: { fontSize: 9, fontWeight: '700', color: '#cbd5e1' },

  smallChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  smallChipActive: { backgroundColor: '#10b981', borderColor: '#059669' },
  smallChipText: { fontSize: 8, fontWeight: '700', color: '#cbd5e1' },
  smallChipTextActive: { color: '#ffffff', fontWeight: '900' },

  totalBox: { backgroundColor: '#020617', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#1e293b', marginTop: 8 },

  waCard: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 6 },
  waInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, color: '#ffffff', fontSize: 10 },
  waPreviewBox: { backgroundColor: '#020617', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  waPreviewText: { fontSize: 9, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 13 },
  waSendBtn: { backgroundColor: '#16a34a', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  waSendBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },

  langChip: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  langChipActive: { backgroundColor: '#10b981', borderColor: '#059669' },
  langChipText: { fontSize: 7, fontWeight: '800', color: '#94a3b8' },
  langChipTextActive: { color: '#ffffff' },

  sharedBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderColor: '#22c55e', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  sharedBadgeText: { color: '#22c55e', fontSize: 8, fontWeight: '800' },

  quickActionBtn: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  quickActionBtnActive: { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#f59e0b', borderWidth: 1.5 },
  quickActionText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },

  dateChip: {
    width: 48,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  dateChipSub: { fontSize: 7, color: '#94a3b8', fontWeight: '800' },
  dateChipNum: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  dateChipMonth: { fontSize: 7, color: '#64748b' },

  timeChip: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  timeChipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  timeChipText: { fontSize: 9, color: '#cbd5e1' },

  presetChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  presetChipActive: { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: '#818cf8', borderWidth: 1.5 },
  presetChipText: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  presetChipTextActive: { color: '#ffffff', fontWeight: '900' },

  requirementInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 8,
    color: '#ffffff',
    fontSize: 10,
    textAlignVertical: 'top',
    minHeight: 50,
    marginTop: 4,
  },

  wrongNumberCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },

  quoteSelectBtn: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  quoteSelectBtnText: { fontSize: 9, fontWeight: '800', color: '#34d399' },
  quotePreviewBox: { backgroundColor: '#020617', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#334155', marginTop: 6 },
  quoteItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  notesBoxInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
    color: '#ffffff',
    fontSize: 11,
    textAlignVertical: 'top',
    minHeight: 65,
  },

  stagePreviewBox: {
    marginTop: 12,
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  stageBadgeText: { fontSize: 9, fontWeight: '900' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  cancelBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: '800' },
  saveOutcomeBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveOutcomeBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
