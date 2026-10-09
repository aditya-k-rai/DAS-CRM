/**
 * PostCallOutcomeModal.tsx — DAS CRM Android
 * Lead Outcome & Status Update Modal.
 * Supports:
 * 1. Primary Outcomes: Picked Up, Not Responding, Busy, Switched Off, WhatsApp Chat.
 * 2. Detailed Actions for BOTH Picked Up Call and WhatsApp Chat:
 *    - 🗣️ Talked / Chat Completed Smoothly
 *    - ⏰ Will Call / Chat Later (15-Day Date Selector + Time Slot Selector)
 *    - 🤝 Talked & Said He Will Visit / Come (15-Day Expected Visit Date Selector)
 *    - 💡 Interested in Product & Product Shared (Quantity Stepper, Live Tiered Pricing & 1-Tap WhatsApp Sharing)
 *    - 💬 WhatsApp Message Sent / Responded
 * 3. 📲 WhatsApp Product Details Dispatcher with Live Message Preview & 1-Tap Direct Timeline Logging.
 * 4. Write Your Own Custom Notes Box.
 * 5. Save & Store directly to Lead Activity Telemetry.
 */

import React, { useState, useEffect } from 'react';
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

export interface CallOutcomeData {
  leadId: string;
  leadName: string;
  phone: string;
  outcome: 'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT';
  subOption?: 'TALKED' | 'CALL_LATER' | 'WILL_VISIT' | 'CATALOGUE_SHARED' | 'INTERESTED' | 'WA_SENT' | 'WA_RESPONDED';
  scheduledDate?: string;
  scheduledTime?: string;
  selectedProduct?: ProductItem | null;
  productQuantity?: number;
  productTotalPrice?: number;
  isWaShared?: boolean;
  sentMessage?: string;
  waTargetPhone?: string;
  waCustomNote?: string;
  notes: string;
  timestamp: string;
  callerName?: string;
  callerRole?: string;
  durationStr?: string;
  dateLabel?: string;
}

interface PostCallOutcomeModalProps {
  visible: boolean;
  leadId: string;
  leadName: string;
  phone: string;
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

const TIME_SLOTS = [
  '09:30 AM',
  '11:00 AM',
  '12:30 PM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
  '06:30 PM',
];

export default function PostCallOutcomeModal({
  visible,
  leadId,
  leadName,
  phone,
  onClose,
  onSaveOutcome,
}: PostCallOutcomeModalProps) {
  const insets = useSafeAreaInsets();
  const next15Days = getNext15Days();

  // Modal Step State
  const [outcome, setOutcome] = useState<'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT' | null>('PICKED_UP');
  const [subOption, setSubOption] = useState<'TALKED' | 'CALL_LATER' | 'WILL_VISIT' | 'CATALOGUE_SHARED' | 'INTERESTED' | 'WA_SENT' | 'WA_RESPONDED' | null>('TALKED');

  // Scheduling State (15-Day Date & Time)
  const [selectedDate, setSelectedDate] = useState<string>(next15Days[1]?.formatted || next15Days[0].formatted);
  const [selectedTime, setSelectedTime] = useState<string>('02:00 PM');

  // Product Search & Selection State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>([]);

  // WhatsApp Product Share State
  const [productWaTargetPhone, setProductWaTargetPhone] = useState<string>(phone || '');
  const [productWaCustomNote, setProductWaCustomNote] = useState<string>('');
  const [isProductWaShared, setIsProductWaShared] = useState<boolean>(false);

  // Custom Notes Input Box
  const [notes, setNotes] = useState('');

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
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (phone && !productWaTargetPhone) {
      setProductWaTargetPhone(phone);
    }
  }, [phone, productWaTargetPhone]);

  const displayProducts = liveProducts.length > 0 ? liveProducts : CATALOG_PRODUCTS;
  const filteredProducts = displayProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const calculateProductPricing = () => {
    if (!selectedProduct) {
      return { unitPrice: 0, totalPrice: 0, discountPct: 0, unitLabel: 'Units' };
    }
    const baseNum = parseFloat(String(selectedProduct.minPrice || '0').replace(/[^0-9.]/g, '')) || 0;
    const qty = Math.max(1, selectedQuantity || 1);
    
    let unitPrice = baseNum;
    let discountPct = 0;
    if (Array.isArray(selectedProduct.priceTiers) && selectedProduct.priceTiers.length > 0) {
      for (const tier of selectedProduct.priceTiers) {
        if (qty >= (tier.minQty || 1) && (!tier.maxQty || qty <= tier.maxQty)) {
          unitPrice = tier.unitPrice || baseNum;
          if (baseNum > 0 && unitPrice < baseNum) {
            discountPct = Math.round(((baseNum - unitPrice) / baseNum) * 100);
          }
          break;
        }
      }
    }
    const totalPrice = unitPrice * qty;
    return {
      unitPrice,
      totalPrice,
      discountPct,
      unitLabel: 'Units',
    };
  };

  const generateProductWhatsAppMessage = (customNote?: string) => {
    const clientName = (!leadName || leadName === 'Lead Prospect' || leadName === '—') ? 'Valued Client' : leadName;
    const pricing = calculateProductPricing();
    const prodName = selectedProduct?.name || 'Product of Interest';
    const categoryText = selectedProduct?.category ? `📁 *Category:* ${selectedProduct.category}\n` : '';
    const qty = Math.max(1, selectedQuantity || 1);
    const unitPriceFormatted = `₹${pricing.unitPrice.toLocaleString('en-IN')}`;
    const totalPriceFormatted = `₹${pricing.totalPrice.toLocaleString('en-IN')}`;
    const discountStr = pricing.discountPct > 0 ? ` [Includes ${pricing.discountPct}% Volume Tier Discount]` : '';
    const desc = selectedProduct?.description ? `\n\n📝 *Product Specifications & Details:*\n${selectedProduct.description.trim()}` : '';
    const extraNote = customNote && customNote.trim() ? `\n\n💡 *Note from Representative:* "${customNote.trim()}"` : '';

    return (
      `Hello *${clientName}*,\n\n` +
      `Thank you for discussing *${prodName}* with us! Here are the complete product details and pricing:\n\n` +
      `📦 *Product Name:* *${prodName}*\n` +
      categoryText +
      `🔢 *Selected Quantity:* ${qty} ${pricing.unitLabel}\n` +
      `🏷️ *Unit Price:* ${unitPriceFormatted} / ${pricing.unitLabel}\n` +
      `💰 *Estimated Total Value:* *${totalPriceFormatted}*${discountStr}` +
      desc +
      extraNote +
      `\n\n💬 *Next Steps:* Please let us know if you need any adjustments or if you would like us to issue a formal commercial quotation / tax invoice.` +
      `\n\nBest regards,\n*DAS CRM Team*`
    );
  };

  const handleShareProductViaWhatsApp = async () => {
    const targetPhone = (productWaTargetPhone || phone || '').replace(/[^0-9]/g, '');
    const finalMsg = generateProductWhatsAppMessage(productWaCustomNote);
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(finalMsg)}`;

    try {
      await Linking.openURL(waUrl);
      setIsProductWaShared(true);
      Alert.alert('✅ WhatsApp Opened', 'Product details formatted and opened in WhatsApp.');
    } catch (e) {
      Alert.alert('Notice', 'Opening web WhatsApp fallback...');
      Linking.openURL(waUrl).catch(() => {});
    }
  };

  const resetState = () => {
    setOutcome('PICKED_UP');
    setSubOption('TALKED');
    setSelectedDate(next15Days[1]?.formatted || next15Days[0].formatted);
    setSelectedTime('02:00 PM');
    setProductSearch('');
    setSelectedProduct(null);
    setSelectedQuantity(1);
    setIsProductWaShared(false);
    setProductWaCustomNote('');
    setNotes('');
  };

  const handleSave = () => {
    if (!outcome) {
      Alert.alert('Select Outcome', 'Please select a lead outcome status.');
      return;
    }

    if ((outcome === 'PICKED_UP' || outcome === 'WHATSAPP_CHAT') && !subOption) {
      Alert.alert('Select Action', 'Please select a detail action for this outcome.');
      return;
    }

    if (subOption === 'INTERESTED' && !selectedProduct) {
      Alert.alert('Select Product', 'Please search and select the interested product from the catalog.');
      return;
    }

    const pricing = calculateProductPricing();
    const qty = Math.max(1, selectedQuantity || 1);
    const prodName = selectedProduct?.name;
    const finalMsg = isProductWaShared ? generateProductWhatsAppMessage(productWaCustomNote) : undefined;

    let baseNotes = notes.trim();
    if (subOption === 'INTERESTED' && selectedProduct) {
      const waStatus = isProductWaShared ? ' [Shared via WhatsApp Direct]' : '';
      const prodTag = `Product: ${prodName} (Qty: ${qty} · ₹${pricing.totalPrice.toLocaleString('en-IN')})${waStatus}`;
      baseNotes = baseNotes ? `${baseNotes} • ${prodTag}` : prodTag;
    }

    const data: CallOutcomeData = {
      leadId,
      leadName,
      phone,
      outcome,
      subOption: subOption || undefined,
      scheduledDate: (subOption === 'CALL_LATER' || subOption === 'WILL_VISIT' || outcome === 'NOT_RESPONDING' || outcome === 'BUSY' || outcome === 'SWITCHED_OFF') ? selectedDate : undefined,
      scheduledTime: subOption === 'CALL_LATER' ? selectedTime : undefined,
      selectedProduct,
      productQuantity: selectedProduct ? qty : undefined,
      productTotalPrice: selectedProduct ? pricing.totalPrice : undefined,
      isWaShared: isProductWaShared,
      sentMessage: finalMsg,
      waTargetPhone: productWaTargetPhone,
      waCustomNote: productWaCustomNote,
      notes: baseNotes || 'Lead status updated.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveOutcome(data);
    resetState();
    onClose();

    Alert.alert(
      '✅ Lead Status & Activity Saved',
      `Outcome stored for ${leadName}:\n• Status: ${outcome.replace('_', ' ')}\n• Action: ${subOption ? subOption.replace('_', ' ') : 'Updated'}${selectedProduct ? '\n• Product Interested: ' + selectedProduct.name + ` (Qty: ${qty})` : ''}${isProductWaShared ? '\n• WhatsApp: Shared to Client' : ''}${selectedDate ? '\n• Scheduled Date: ' + selectedDate : ''}`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>📝 Update Lead Status &amp; Log Activity</Text>
                <Text style={styles.headerSub}>Lead: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{leadName}</Text> • {phone}</Text>
              </View>
              <TouchableOpacity onPress={() => { resetState(); onClose(); }} style={styles.closeBtn}>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* STEP 1: PRIMARY CALL / WHATSAPP OUTCOME BUTTONS                    */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>1. Select Call / WhatsApp Outcome Status:</Text>
            <View style={styles.outcomeGrid}>
              <TouchableOpacity
                style={[styles.outcomeChip, outcome === 'PICKED_UP' && styles.outcomeChipPicked]}
                onPress={() => { setOutcome('PICKED_UP'); setSubOption('TALKED'); }}
              >
                <Text style={[styles.outcomeChipText, outcome === 'PICKED_UP' && { color: '#15803d' }]}>
                  🟢 Picked Up
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeChip, outcome === 'NOT_RESPONDING' && styles.outcomeChipNotResp]}
                onPress={() => { setOutcome('NOT_RESPONDING'); setSubOption(null); }}
              >
                <Text style={[styles.outcomeChipText, outcome === 'NOT_RESPONDING' && { color: '#b91c1c' }]}>
                  🔴 Not Responding
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeChip, outcome === 'BUSY' && styles.outcomeChipBusy]}
                onPress={() => { setOutcome('BUSY'); setSubOption(null); }}
              >
                <Text style={[styles.outcomeChipText, outcome === 'BUSY' && { color: '#b45309' }]}>
                  🟡 Busy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeChip, outcome === 'SWITCHED_OFF' && styles.outcomeChipOff]}
                onPress={() => { setOutcome('SWITCHED_OFF'); setSubOption(null); }}
              >
                <Text style={[styles.outcomeChipText, outcome === 'SWITCHED_OFF' && { color: '#334155' }]}>
                  ⚫ Switched Off
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeChip, outcome === 'WHATSAPP_CHAT' && styles.outcomeChipWa]}
                onPress={() => { setOutcome('WHATSAPP_CHAT'); setSubOption('TALKED'); }}
              >
                <Text style={[styles.outcomeChipText, outcome === 'WHATSAPP_CHAT' && { color: '#16a34a' }]}>
                  💬 WhatsApp Chat
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* STEP 2: RICH DETAIL ACTIONS (FOR BOTH CALL & WHATSAPP)              */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            {(outcome === 'PICKED_UP' || outcome === 'WHATSAPP_CHAT') && (
              <View style={styles.subContainer}>
                <Text style={styles.sectionLabel}>
                  2. {outcome === 'WHATSAPP_CHAT' ? 'WhatsApp Chat' : 'Picked Up Call'} Detail Action:
                </Text>

                <View style={styles.subOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.subBtn, subOption === 'TALKED' && styles.subBtnActive]}
                    onPress={() => setSubOption('TALKED')}
                  >
                    <Text style={[styles.subBtnText, subOption === 'TALKED' && styles.subBtnTextActive]}>
                      🗣️ {outcome === 'WHATSAPP_CHAT' ? 'Discussed on WhatsApp / Chat Completed' : 'Talked (Call completed smoothly)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subBtn, subOption === 'CALL_LATER' && styles.subBtnActive]}
                    onPress={() => setSubOption('CALL_LATER')}
                  >
                    <Text style={[styles.subBtnText, subOption === 'CALL_LATER' && styles.subBtnTextActive]}>
                      ⏰ Will Call / Chat Later (Select Date &amp; Time Slot)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subBtn, subOption === 'WILL_VISIT' && styles.subBtnActive]}
                    onPress={() => setSubOption('WILL_VISIT')}
                  >
                    <Text style={[styles.subBtnText, subOption === 'WILL_VISIT' && styles.subBtnTextActive]}>
                      🤝 Talked &amp; Said He Will Visit / Come
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subBtn, (subOption === 'INTERESTED' || subOption === 'CATALOGUE_SHARED') && styles.subBtnActive]}
                    onPress={() => setSubOption('INTERESTED')}
                  >
                    <Text style={[styles.subBtnText, (subOption === 'INTERESTED' || subOption === 'CATALOGUE_SHARED') && styles.subBtnTextActive]}>
                      💡 Interested in Product &amp; Product Shared
                    </Text>
                  </TouchableOpacity>

                  {outcome === 'WHATSAPP_CHAT' && (
                    <TouchableOpacity
                      style={[styles.subBtn, subOption === 'WA_SENT' && styles.subBtnActive]}
                      onPress={() => setSubOption('WA_SENT')}
                    >
                      <Text style={[styles.subBtnText, subOption === 'WA_SENT' && styles.subBtnTextActive]}>
                        💬 WhatsApp Template Message Sent
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 🗓️ 15-DAY DATE SELECTOR & TIME SELECTOR FOR "WILL CALL/CHAT LATER" & "WILL VISIT" */}
                {(subOption === 'CALL_LATER' || subOption === 'WILL_VISIT') && (
                  <View style={styles.schedulerCard}>
                    <Text style={styles.schedulerTitle}>
                      📅 Select Date ({subOption === 'WILL_VISIT' ? 'Expected Visit' : 'Callback/Chat'} - Next 15 Days):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8, flexGrow: 0 }}>
                      {next15Days.map((dObj) => (
                        <TouchableOpacity
                          key={dObj.isoDate}
                          style={[styles.dateChip, selectedDate === dObj.formatted && styles.dateChipActive]}
                          onPress={() => setSelectedDate(dObj.formatted)}
                        >
                          <Text style={[styles.dateChipSub, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                          </Text>
                          <Text style={[styles.dateChipNum, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.dayNum}
                          </Text>
                          <Text style={[styles.dateChipMonth, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                            {dObj.monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {subOption === 'CALL_LATER' && (
                      <>
                        <Text style={[styles.schedulerTitle, { marginTop: 6 }]}>⏰ Select Callback / Chat Time Slot:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, flexGrow: 0 }}>
                          {TIME_SLOTS.map((tSlot) => (
                            <TouchableOpacity
                              key={tSlot}
                              style={[styles.timeSlotChip, selectedTime === tSlot && styles.timeSlotChipActive]}
                              onPress={() => setSelectedTime(tSlot)}
                            >
                              <Text style={[styles.timeSlotText, selectedTime === tSlot && { color: '#ffffff', fontWeight: '900' }]}>
                                {tSlot}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </>
                    )}
                  </View>
                )}

                {/* 🛍️ PRODUCT SEARCH, QUANTITY & WHATSAPP SHARING FOR "INTERESTED" */}
                {subOption === 'INTERESTED' && (
                  <View style={styles.productSearchCard}>
                    <Text style={styles.schedulerTitle}>🔍 Search &amp; Select Interested Product:</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search (e.g. DAS CRM Enterprise, AI Scoring, WhatsApp Bot)..."
                      placeholderTextColor="#64748b"
                      value={productSearch}
                      onChangeText={setProductSearch}
                    />

                    <View style={styles.productListContainer}>
                      {filteredProducts.map((prod) => {
                        const isSelected = selectedProduct?.id === prod.id;
                        return (
                          <TouchableOpacity
                            key={prod.id}
                            style={[styles.productRowItem, isSelected && styles.productRowItemActive]}
                            onPress={() => setSelectedProduct(prod)}
                          >
                            <Image source={{ uri: prod.imageUrl }} style={styles.productThumb} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.productRowTitle, isSelected && { color: '#818cf8', fontWeight: '900' }]}>
                                {prod.name}
                              </Text>
                              <Text style={styles.productRowSub}>{prod.category} • {prod.minPrice} - {prod.maxPrice}</Text>
                            </View>
                            {isSelected && <Text style={{ color: '#818cf8', fontWeight: '900', fontSize: 14 }}>✓ Selected</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Quantity Stepper & Price Calculation */}
                    {selectedProduct && (
                      <View style={styles.pricingCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>Quantity:</Text>
                          <View style={styles.quantityStepper}>
                            <TouchableOpacity
                              style={styles.stepBtn}
                              onPress={() => setSelectedQuantity(q => Math.max(1, q - 1))}
                            >
                              <Text style={styles.stepBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepQtyText}>{selectedQuantity}</Text>
                            <TouchableOpacity
                              style={styles.stepBtn}
                              onPress={() => setSelectedQuantity(q => q + 1)}
                            >
                              <Text style={styles.stepBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Total Value:</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>
                            ₹{calculateProductPricing().totalPrice.toLocaleString('en-IN')}
                            {calculateProductPricing().discountPct > 0 && (
                              <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '800' }}>
                                {' '}({calculateProductPricing().discountPct}% off)
                              </Text>
                            )}
                          </Text>
                        </View>

                        {/* 📲 WHATSAPP PRODUCT SHARE SECTION */}
                        <View style={styles.waShareCard}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#22c55e' }}>
                              💬 Share on WhatsApp
                            </Text>
                            {isProductWaShared ? (
                              <View style={styles.sharedBadge}>
                                <Text style={styles.sharedBadgeText}>✓ Shared</Text>
                              </View>
                            ) : null}
                          </View>

                          <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>Target WhatsApp Phone:</Text>
                          <TextInput
                            style={styles.waPhoneInput}
                            placeholder="+91 98765 43210"
                            placeholderTextColor="#64748b"
                            keyboardType="phone-pad"
                            value={productWaTargetPhone}
                            onChangeText={setProductWaTargetPhone}
                          />

                          <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, marginBottom: 2 }}>Custom Remarks / Special Note (Optional):</Text>
                          <TextInput
                            style={styles.waNoteInput}
                            placeholder="e.g. Valid until Friday, Includes 1-yr warranty..."
                            placeholderTextColor="#64748b"
                            value={productWaCustomNote}
                            onChangeText={setProductWaCustomNote}
                          />

                          {/* Message Preview */}
                          <View style={styles.waPreviewBox}>
                            <Text style={{ fontSize: 8, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', marginBottom: 4 }}>
                              Live WhatsApp Preview:
                            </Text>
                            <Text style={styles.waPreviewText} numberOfLines={5}>
                              {generateProductWhatsAppMessage(productWaCustomNote)}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.waShareBtn}
                            onPress={handleShareProductViaWhatsApp}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.waShareBtnText}>📲 Send via WhatsApp Direct Now</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* 🗓️ 15-DAY CALLBACK SELECTOR FOR UNANSWERED / BUSY / SWITCHED OFF      */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            {outcome && outcome !== 'PICKED_UP' && outcome !== 'WHATSAPP_CHAT' && (
              <View style={styles.schedulerCard}>
                <Text style={styles.schedulerTitle}>📅 Schedule Follow-up Callback (Next 15 Days):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8, flexGrow: 0 }}>
                  {next15Days.map((dObj) => (
                    <TouchableOpacity
                      key={dObj.isoDate}
                      style={[styles.dateChip, selectedDate === dObj.formatted && styles.dateChipActive]}
                      onPress={() => setSelectedDate(dObj.formatted)}
                    >
                      <Text style={[styles.dateChipSub, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.offset === 0 ? 'TODAY' : dObj.dayOfWeek}
                      </Text>
                      <Text style={[styles.dateChipNum, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.dayNum}
                      </Text>
                      <Text style={[styles.dateChipMonth, selectedDate === dObj.formatted && { color: '#ffffff' }]}>
                        {dObj.monthName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* 📝 WRITE YOUR OWN NOTES BOX                                         */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            {outcome && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionLabel}>📝 Write Your Own Custom Notes Box:</Text>
                <TextInput
                  style={styles.notesBoxInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Client agreed to review demo with team tomorrow at 2 PM..."
                  placeholderTextColor="#64748b"
                  value={notes}
                  onChangeText={setNotes}
                />

                {/* SAVE BUTTON */}
                <TouchableOpacity
                  style={styles.saveOutcomeBtn}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveOutcomeBtnText}>💾 Save Lead Status &amp; Store with Lead →</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1e293b', padding: 16 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#818cf8', marginBottom: 8, marginTop: 4 },

  outcomeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  outcomeChip: { flex: 1, minWidth: '45%', backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  outcomeChipPicked: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  outcomeChipNotResp: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  outcomeChipBusy: { backgroundColor: '#fef3c7', borderColor: '#eab308' },
  outcomeChipOff: { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
  outcomeChipWa: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  outcomeChipText: { fontSize: 11, fontWeight: '800', color: '#cbd5e1' },

  subContainer: { marginTop: 6, backgroundColor: '#020617', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  subOptionsGrid: { gap: 6 },
  subBtn: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, alignItems: 'flex-start' },
  subBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  subBtnText: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },
  subBtnTextActive: { color: '#818cf8', fontWeight: '900' },

  schedulerCard: { marginTop: 10, backgroundColor: '#0f172a', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  schedulerTitle: { fontSize: 10, fontWeight: '800', color: '#38bdf8' },

  dateChip: { width: 54, height: 56, borderRadius: 12, backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  dateChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  dateChipSub: { fontSize: 8, color: '#94a3b8', fontWeight: '800' },
  dateChipNum: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  dateChipMonth: { fontSize: 8, color: '#64748b' },

  timeSlotChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  timeSlotChipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  timeSlotText: { fontSize: 10, color: '#cbd5e1' },

  productSearchCard: { marginTop: 10, backgroundColor: '#0f172a', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  searchInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, color: '#ffffff', fontSize: 11, marginTop: 6, marginBottom: 8 },
  productListContainer: { gap: 6, maxHeight: 160 },
  productRowItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#020617', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  productRowItemActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  productThumb: { width: 32, height: 32, borderRadius: 6 },
  productRowTitle: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  productRowSub: { fontSize: 9, color: '#94a3b8', marginTop: 1 },

  pricingCard: { marginTop: 10, backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#334155' },
  quantityStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  stepBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  stepQtyText: { color: '#ffffff', fontSize: 12, fontWeight: '900', paddingHorizontal: 10 },

  waShareCard: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  sharedBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderColor: '#22c55e', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sharedBadgeText: { color: '#22c55e', fontSize: 9, fontWeight: '800' },
  waPhoneInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, color: '#22c55e', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  waNoteInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, color: '#ffffff', fontSize: 11 },
  waPreviewBox: { backgroundColor: '#0f172a', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#1e293b', marginTop: 8 },
  waPreviewText: { fontSize: 9, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 13 },
  waShareBtn: { backgroundColor: '#16a34a', paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  waShareBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },

  notesBoxInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 10, color: '#ffffff', fontSize: 11, textAlignVertical: 'top', minHeight: 70 },
  saveOutcomeBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveOutcomeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
