/**
 * PostCallOutcomeModal.tsx — DAS CRM Android
 * Lead Outcome & Status Update Modal.
 * Supports:
 * 1. Primary Outcomes: Picked Up, Not Responding, Busy, Switched Off, WhatsApp Chat.
 * 2. Detailed Actions for BOTH Picked Up Call and WhatsApp Chat:
 *    - 🗣️ Talked / Chat Completed Smoothly
 *    - ⏰ Will Call / Chat Later (15-Day Date Selector + Time Slot Selector: 09:30 AM, 11:00 AM, 02:00 PM, 04:30 PM, 06:00 PM)
 *    - 🤝 Talked & Said He Will Visit / Come (15-Day Expected Visit Date Selector)
 *    - 📄 Catalogue & Brochure Shared on WhatsApp / Email
 *    - 💡 Interested (Live Product Search Box: DAS CRM Enterprise Suite, AI Lead Scoring Engine Pro, WhatsApp Automation Bot Engine, Cloud Telemetry License)
 *    - 💬 Message Sent / Active Chat Discussion
 * 3. Write Your Own Custom Notes Box.
 * 4. Save & Store directly to Lead Activity Telemetry.
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { CATALOG_PRODUCTS, ProductItem } from '../services/whatsappTemplateEngine';

export interface CallOutcomeData {
  leadId: string;
  leadName: string;
  phone: string;
  outcome: 'PICKED_UP' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCHED_OFF' | 'WHATSAPP_CHAT';
  subOption?: 'TALKED' | 'CALL_LATER' | 'WILL_VISIT' | 'CATALOGUE_SHARED' | 'INTERESTED' | 'WA_SENT' | 'WA_RESPONDED';
  scheduledDate?: string;
  scheduledTime?: string;
  selectedProduct?: ProductItem | null;
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

  // Custom Notes Input Box
  const [notes, setNotes] = useState('');

  const filteredProducts = CATALOG_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const resetState = () => {
    setOutcome('PICKED_UP');
    setSubOption('TALKED');
    setSelectedDate(next15Days[1]?.formatted || next15Days[0].formatted);
    setSelectedTime('02:00 PM');
    setProductSearch('');
    setSelectedProduct(null);
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

    const data: CallOutcomeData = {
      leadId,
      leadName,
      phone,
      outcome,
      subOption: subOption || undefined,
      scheduledDate: (subOption === 'CALL_LATER' || subOption === 'WILL_VISIT' || outcome === 'NOT_RESPONDING' || outcome === 'BUSY' || outcome === 'SWITCHED_OFF') ? selectedDate : undefined,
      scheduledTime: subOption === 'CALL_LATER' ? selectedTime : undefined,
      selectedProduct,
      notes: notes.trim() || 'Lead status updated.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveOutcome(data);
    resetState();
    onClose();

    Alert.alert(
      '✅ Lead Status & Activity Saved',
      `Outcome stored for ${leadName}:\n• Status: ${outcome.replace('_', ' ')}\n• Action: ${subOption ? subOption.replace('_', ' ') : 'Updated'}${selectedProduct ? '\n• Product Interested: ' + selectedProduct.name : ''}${selectedDate ? '\n• Scheduled Date: ' + selectedDate : ''}`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
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
                    style={[styles.subBtn, subOption === 'CATALOGUE_SHARED' && styles.subBtnActive]}
                    onPress={() => setSubOption('CATALOGUE_SHARED')}
                  >
                    <Text style={[styles.subBtnText, subOption === 'CATALOGUE_SHARED' && styles.subBtnTextActive]}>
                      📄 Catalogue Shared (WhatsApp / Email)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subBtn, subOption === 'INTERESTED' && styles.subBtnActive]}
                    onPress={() => setSubOption('INTERESTED')}
                  >
                    <Text style={[styles.subBtnText, subOption === 'INTERESTED' && styles.subBtnTextActive]}>
                      💡 Interested (Product Search &amp; Selection)
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

                {/* 🛍️ PRODUCT SEARCH & SELECTION FOR "INTERESTED" */}
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
                            {isSelected && <Text style={{ color: '#818cf8', fontWeight: '900', fontSize: 16 }}>✓ Selected</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
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
  productListContainer: { gap: 6, maxHeight: 180 },
  productRowItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#020617', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  productRowItemActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  productThumb: { width: 32, height: 32, borderRadius: 6 },
  productRowTitle: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  productRowSub: { fontSize: 9, color: '#94a3b8', marginTop: 1 },

  notesBoxInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 10, color: '#ffffff', fontSize: 11, textAlignVertical: 'top', minHeight: 70 },
  saveOutcomeBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveOutcomeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
