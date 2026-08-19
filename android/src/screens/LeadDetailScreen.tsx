/**
 * LeadDetailScreen.tsx — DAS CRM Android
 * Features:
 *  1. Working 📞 Call Now & 💬 WhatsApp Intent Launchers
 *  2. Synced Call Telemetry & Follow-up History Audit Widget
 *  3. 1-Day Ephemeral Call Storage notice with Midnight (12:00 AM) Purge Timer
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LeadsStackParamList } from '../../App';
import { callSyncEngine, LeadCallSummary } from '../services/callSyncEngine';
import { useAuthStore } from '../store/authStore';
import {
  whatsappTemplateEngine,
  WhatsAppTemplate,
  DEFAULT_TEMPLATES,
  CATALOG_PRODUCTS,
  ProductItem,
} from '../services/whatsappTemplateEngine';

type LeadDetailRouteProp = RouteProp<LeadsStackParamList, 'LeadDetail'>;

interface LeadDetailScreenProps {
  lead?: any;
  onBack?: () => void;
}

export default function LeadDetailScreen({ lead: propLead, onBack }: LeadDetailScreenProps) {
  const navigation = useNavigation();
  const { currentUser } = useAuthStore();
  const userRole = currentUser?.role || 'SALES_EXEC';

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
  const leadPhone = lead?.phone || '+91 98765 43210';
  const leadCompany = lead?.company || 'Acme Partner';
  const leadValue = lead?.value || '$14,200';

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

  // 💬 WhatsApp Template 2-Step Wizard & Quantity State
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waStep, setWaStep] = useState<1 | 2>(1); // Step 1: Select Template | Step 2: Select Product, Quantity & Price Band
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(DEFAULT_TEMPLATES[0]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(CATALOG_PRODUCTS[0]);
  const [productQuantity, setProductQuantity] = useState<number>(10); // Default 10 units
  const [customMsgText, setCustomMsgText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplBody, setNewTplBody] = useState('');

  useEffect(() => {
    callSyncEngine.checkAndPurgeMidnightLogs();
    const secs = callSyncEngine.getSecondsUntilMidnight();
    setHoursToMidnight(Math.floor(secs / 3600));

    // Load Admin Custom WhatsApp Templates
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
    } else {
      navigation.goBack();
    }
  };

  // 📞 CALL NOW HANDLER (Role Guarded, HR Excluded)
  const handleCall = () => {
    if (!whatsappTemplateEngine.canRoleCommunicate(userRole)) {
      Alert.alert('Access Restricted', 'HR role does not have permission to initiate calls to sales leads.');
      return;
    }

    callSyncEngine.initiateCall(leadId, leadName, leadPhone, (updated) => {
      setTelemetry(updated);
    });
  };

  // 💬 WHATSAPP DIRECT HANDLER (Role Guarded, HR Excluded)
  const handleWhatsApp = () => {
    if (!whatsappTemplateEngine.canRoleCommunicate(userRole)) {
      Alert.alert('Access Restricted', 'HR role does not have permission to send WhatsApp messages to sales leads.');
      return;
    }

    setWaStep(1); // Start at Step 1: Select Template
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

  const statusColor =
    lead?.status === 'WON'
      ? '#34d399'
      : lead?.status === 'IN NEGOTIATION'
      ? '#818cf8'
      : lead?.status === 'QUALIFIED'
      ? '#38bdf8'
      : lead?.status === 'CONTACTED'
      ? '#fbbf24'
      : '#94a3b8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
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
              <Text style={styles.company}>{lead?.company || 'Acme Partner'}</Text>
            </View>
            <View style={styles.valueBadge}>
              <Text style={styles.valueText}>{lead?.value || '$14,200'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{lead?.status || 'NEW LEAD'}</Text>
          </View>
        </View>

        {/* Action Buttons: 📞 CALL NOW & 💬 WHATSAPP */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Text style={styles.callBtnText}>📞 Call Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
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

          <Text style={styles.metaLine}>
            ⏰ Last Called: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{telemetry.lastCalledAt}</Text>
          </Text>
          <Text style={styles.metaLine}>
            📅 Last Follow-up: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{telemetry.lastFollowupAt}</Text>
          </Text>

          {/* 1-Day Ephemeral Storage & Midnight Purge Notice */}
          <View style={styles.purgeNoticeBox}>
            <Text style={styles.purgeNoticeText}>
              ⌛ 1-Day Local Storage: Raw call logs auto-purge at Midnight 12:00 AM ({hoursToMidnight}h remaining). Cumulative lead telemetry is permanently saved.
            </Text>
          </View>
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.detailCard}>
          {[
            ['📞 Phone', leadPhone],
            ['✉️ Email', lead?.email || 'vikram@acme.com'],
            ['🏢 Company', lead?.company || 'Acme Corp'],
            ['🌐 Source', lead?.source || 'Google Sheets Sync'],
          ].map(([label, value], i) => (
            <View key={label} style={[styles.row, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
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

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              
              {/* ───────────────────────────────────────────────────────────────── */}
              {/* STEP 1: SELECT WHATSAPP TEMPLATE (OR CONTINUE WITHOUT TEMPLATE)   */}
              {/* ───────────────────────────────────────────────────────────────── */}
              {waStep === 1 && (
                <View style={{ gap: 10 }}>
                  <Text style={styles.waSectionTitle}>Select Admin WhatsApp Template (Or Continue Without):</Text>
                  
                  {/* Option to Continue Without Template */}
                  <TouchableOpacity
                    style={[styles.tplCard, !selectedTemplate && styles.tplCardSelected]}
                    onPress={() => handleSelectTemplate(null)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.tplTitleText, !selectedTemplate && { color: '#38bdf8' }]}>
                        ✨ Custom Message (No Template)
                      </Text>
                      {!selectedTemplate && <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>✓ SELECTED</Text>}
                    </View>
                    <Text style={styles.tplPreviewText}>Type a freeform custom text message without applying any template.</Text>
                  </TouchableOpacity>

                  {templates.map(tpl => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <TouchableOpacity
                        key={tpl.id}
                        style={[styles.tplCard, isSelected && styles.tplCardSelected]}
                        onPress={() => handleSelectTemplate(tpl)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.tplTitleText, isSelected && { color: '#38bdf8' }]}>{tpl.title}</Text>
                          {isSelected && <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>✓ SELECTED</Text>}
                        </View>
                        <Text style={styles.tplPreviewText} numberOfLines={2}>{tpl.text}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* ADMIN TEMPLATE CUSTOMIZER TOOL (FOR ADMIN / SUPER ADMIN) */}
                  {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                    <TouchableOpacity
                      style={styles.addTplBannerBtn}
                      onPress={() => setEditingTemplate(!editingTemplate)}
                    >
                      <Text style={styles.addTplBannerText}>
                        {editingTemplate ? '▲ Close Admin Template Editor' : '⚙️ Custom Admin Template Editor (+ Add New)'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {editingTemplate && (
                    <View style={styles.newTplBox}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', marginBottom: 4 }}>Template Title</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. 🎁 Festive Offer Template"
                        placeholderTextColor="#64748b"
                        value={newTplTitle}
                        onChangeText={setNewTplTitle}
                      />

                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', marginTop: 8, marginBottom: 4 }}>
                        Message Body (Use {'{name}'}, {'{company}'}, {'{value}'})
                      </Text>
                      <TextInput
                        style={[styles.inputField, { height: 70 }]}
                        multiline
                        placeholder="Hi {name}, inquiring about {company}..."
                        placeholderTextColor="#64748b"
                        value={newTplBody}
                        onChangeText={setNewTplBody}
                      />

                      <TouchableOpacity style={styles.saveTplBtn} onPress={handleSaveNewTemplate}>
                        <Text style={styles.saveTplBtnText}>💾 Save Admin Template for All Users</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.proceedStepBtn}
                    onPress={() => setWaStep(2)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.proceedStepBtnText}>Proceed Next to Product &amp; Requirements ➔</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ───────────────────────────────────────────────────────────────── */}
              {/* STEP 2: PRODUCT SELECTION, QUANTITY & MIN/MAX PRICE BANDING      */}
              {/* ───────────────────────────────────────────────────────────────── */}
              {waStep === 2 && (
                <View style={{ gap: 10 }}>
                  <Text style={styles.waSectionTitle}>📦 Select Product Requirement (Or Send Without Product):</Text>
                  
                  {/* Product Selector Chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <TouchableOpacity
                      style={[styles.productChip, !selectedProduct && styles.productChipActive]}
                      onPress={() => handleSelectProduct(null)}
                    >
                      <Text style={[styles.productChipText, !selectedProduct && { color: '#ffffff', fontWeight: '900' }]}>🚫 Without Product</Text>
                    </TouchableOpacity>

                    {CATALOG_PRODUCTS.map(prod => {
                      const isSelected = selectedProduct?.id === prod.id;
                      return (
                        <TouchableOpacity
                          key={prod.id}
                          style={[styles.productChip, isSelected && styles.productChipActive]}
                          onPress={() => handleSelectProduct(prod)}
                        >
                          <Image source={{ uri: prod.imageUrl }} style={styles.prodThumb} />
                          <View>
                            <Text style={[styles.productChipText, isSelected && { color: '#38bdf8', fontWeight: '900' }]}>{prod.name}</Text>
                            <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>
                              {prod.minPrice} - {prod.maxPrice}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Quantity & Dynamic Tiered Pricing Control (If Product Selected) */}
                  {selectedProduct && (() => {
                    const tiered = whatsappTemplateEngine.getTieredPrice(selectedProduct, productQuantity);
                    return (
                      <View style={styles.qtyCardContainer}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                          🔢 Select Order Quantity &amp; Price Banding:
                        </Text>

                        {/* Quantity Counter Row */}
                        <View style={styles.qtyRow}>
                          <Text style={{ fontSize: 12, color: '#cbd5e1', fontWeight: '700' }}>Units / Licenses:</Text>
                          <View style={styles.qtyCounterBox}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleChangeQuantity(productQuantity - 1)}
                            >
                              <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyValText}>{productQuantity}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleChangeQuantity(productQuantity + 1)}
                            >
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Quick Preset Quantity Buttons */}
                        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                          {[1, 5, 10, 25, 50, 100].map(q => (
                            <TouchableOpacity
                              key={q}
                              onPress={() => handleChangeQuantity(q)}
                              style={[styles.qtyChipPreset, productQuantity === q && styles.qtyChipPresetActive]}
                            >
                              <Text style={[styles.qtyChipPresetText, productQuantity === q && { color: '#ffffff', fontWeight: '900' }]}>
                                {q} {q === 1 ? 'Unit' : 'Units'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Dynamic Tiered Price Band Box */}
                        <View style={styles.tierInfoBox}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Standard Price Band:</Text>
                            <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800' }}>
                              {selectedProduct.minPrice} - {selectedProduct.maxPrice} / unit
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Applied Tier:</Text>
                            <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>{tiered.tierLabel}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Effective Unit Price:</Text>
                            <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>₹{tiered.unitPrice.toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={{ height: 1, backgroundColor: '#1e293b', marginVertical: 4 }} />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '800' }}>Total Investment:</Text>
                            <Text style={{ fontSize: 12, color: '#34d399', fontWeight: '900' }}>₹{tiered.totalPrice.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                  {/* LIVE INTERPOLATED MESSAGE PREVIEW */}
                  <Text style={styles.waSectionTitle}>Live Compiled WhatsApp Message Preview:</Text>
                  <TextInput
                    style={styles.previewTextInput}
                    multiline
                    value={customMsgText}
                    onChangeText={setCustomMsgText}
                  />
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                    * Auto-interpolates Lead Name "{leadName}", Quantity ({productQuantity}), Tier Pricing, and Product Brochure URL.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity style={styles.backStepBtn} onPress={() => setWaStep(1)}>
                      <Text style={styles.backStepBtnText}>← Back to Step 1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sendWaDirectBtn, { flex: 1, marginTop: 0 }]}
                      onPress={handleSendDirectWhatsApp}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sendWaDirectBtnText}>🚀 Send WhatsApp Message Now →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>

            {/* SEND ACTION BUTTON */}
            <TouchableOpacity
              style={styles.sendWaDirectBtn}
              onPress={handleSendDirectWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={styles.sendWaDirectBtnText}>💬 Launch Direct WhatsApp App →</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },

  backButton: { marginBottom: 14 },
  backText: { color: '#818cf8', fontSize: 14, fontWeight: '700' },

  headerCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  valueBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueText: { fontSize: 12, fontWeight: '900', color: '#34d399' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  callBtn: {
    flex: 1,
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
  callBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },

  whatsappBtn: {
    flex: 1,
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
  whatsappBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', marginBottom: 8, marginTop: 4 },

  telemetryCard: {
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

  purgeNoticeBox: { backgroundColor: '#020617', borderRadius: 10, padding: 8, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' },
  purgeNoticeText: { fontSize: 10, color: '#a5b4fc', fontStyle: 'italic' },

  detailCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
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

  // Product Attachment Styles
  productChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  productChipActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)' },
  productChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  prodThumb: { width: 22, height: 22, borderRadius: 6, resizeMode: 'cover' },

  attachedProductCard: { flexDirection: 'row', gap: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 12, padding: 10, marginBottom: 10 },
  attachedProductImg: { width: 50, height: 50, borderRadius: 10, resizeMode: 'cover' },
  attachedProdName: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  attachedProdPrice: { fontSize: 10, fontWeight: '800', color: '#34d399' },
  attachedProdDesc: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  addTplBannerBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingVertical: 6, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  addTplBannerText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },

  newTplBox: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10, marginBottom: 10 },
  inputField: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: '#ffffff', fontSize: 11 },
  saveTplBtn: { backgroundColor: '#16a34a', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveTplBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  // Wizard & Quantity Styles
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
  qtyChipPreset: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  qtyChipPresetActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  qtyChipPresetText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  tierInfoBox: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 10, marginTop: 6 },

  previewTextInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', borderRadius: 12, padding: 10, color: '#34d399', fontSize: 11, height: 90 },

  sendWaDirectBtn: { backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  sendWaDirectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
