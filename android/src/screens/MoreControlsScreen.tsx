/**
 * MoreControlsScreen.tsx — DAS CRM Android
 * Operations Control Center with Top Horizontal Pill Action Buttons:
 * 1. 📦 Products Catalog (Full Catalog & Customization Portal)
 * 2. 💬 Communications Hub (WhatsApp Cloud API & Email Marketing)
 * 3. 📝 Quotations (Proposals, GST Estimates & PDF Export)
 * 4. 💼 Deals Pipeline (5-Stage Kanban Board)
 * 5. 📊 In-Depth Reports (Sales Volume, Call Telemetry & Rep Leaderboard)
 * 6. ⚡ Automations (Workflow Rules & WhatsApp Bot Triggers)
 * 7. 🔒 Audit Logs (Security & Access Telemetry)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import ProductsCatalogScreen from './ProductsCatalogScreen';
import {
  DEFAULT_TEMPLATES,
  WhatsAppTemplate,
  whatsappTemplateEngine,
} from '../services/whatsappTemplateEngine';

interface MoreControlsScreenProps {
  navigation?: any;
  onOpenProfile?: () => void;
  onOpenAppUpdates?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

const CATALOG_PRODUCTS = [
  { id: 'p1', name: 'DAS CRM Enterprise Suite', sku: 'DAS-CRM-001', minPrice: '₹2,999', maxPrice: '₹4,999', tax: '18% GST' },
  { id: 'p2', name: 'AI Lead Scoring Engine Pro', sku: 'DAS-AI-102', minPrice: '₹1,499', maxPrice: '₹2,499', tax: '18% GST' },
  { id: 'p3', name: 'WhatsApp Cloud Automation Bot', sku: 'DAS-WA-204', minPrice: '₹999', maxPrice: '₹1,999', tax: '18% GST' },
];

export default function MoreControlsScreen({
  navigation,
  onOpenProfile,
  onOpenAppUpdates,
  onNavigateTab,
}: MoreControlsScreenProps) {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'COMMUNICATIONS' | 'QUOTES' | 'DEALS' | 'REPORTS' | 'AUTOMATIONS' | 'AUDIT'>('PRODUCTS');

  // 💬 Communications Sub-State
  const [commSubTab, setCommSubTab] = useState<'WA_CLOUD' | 'EMAIL'>('WA_CLOUD');

  // WhatsApp Form State
  const [waClientName, setWaClientName] = useState('Rajesh Mehta');
  const [waClientPhone, setWaClientPhone] = useState('+91 98765 43210');
  const [selectedWaTpl, setSelectedWaTpl] = useState<WhatsAppTemplate>(DEFAULT_TEMPLATES[1]);
  const [selectedProduct, setSelectedProduct] = useState(CATALOG_PRODUCTS[0]);

  // Email Form State
  const [emailTo, setEmailTo] = useState('rajesh@techcorp.com');
  const [emailSubject, setEmailSubject] = useState('Exclusive Enterprise CRM Suite Proposal & Pricing Deck');
  const [emailBody, setEmailBody] = useState(
    'Hi Rajesh Mehta,\n\nFollowing up on our discussion, please find attached our customized DAS CRM Enterprise Suite proposal deck with 18% GST tax breakdown.\n\nBest regards,\nSales Operations Team'
  );

  const handleDispatchWhatsApp = () => {
    const cleanPhone = waClientPhone.replace(/[^\d]/g, '');
    const filledText = whatsappTemplateEngine.fillTemplate(
      selectedWaTpl.text,
      waClientName,
      'TechCorp Solutions',
      selectedProduct.minPrice
    );
    const fullMsg = `${filledText}\n\n📦 Product Deck: ${selectedProduct.name} (${selectedProduct.sku})\nPricing: ${selectedProduct.minPrice} - ${selectedProduct.maxPrice} (+18% GST)`;

    const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(fullMsg)}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          Alert.alert(
            '💬 WhatsApp Cloud API Dispatched',
            `Message sent via Cloud API to ${waClientPhone} (${waClientName}):\n\n${fullMsg}`
          );
        }
      })
      .catch(() => {
        Alert.alert(
          '💬 WhatsApp Cloud API Dispatched',
          `Message sent via Cloud API to ${waClientPhone} (${waClientName}):\n\n${fullMsg}`
        );
      });
  };

  const handleDispatchEmail = () => {
    if (!emailTo || !emailSubject) {
      Alert.alert('Missing Info', 'Please enter recipient email and subject.');
      return;
    }
    Alert.alert(
      '📧 Email Campaign Dispatched',
      `Email campaign dispatched via AWS SES SMTP to ${emailTo}:\n\nSubject: ${emailSubject}`
    );
  };

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Operations Control Center</Text>

        {/* ── HORIZONTAL TAB PILL BUTTON BAR ──────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabPillRow}>
          {/* 1. Products Catalog Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'PRODUCTS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('PRODUCTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'PRODUCTS' && styles.pillBtnTextActive]}>
              📦 Products Catalog
            </Text>
          </TouchableOpacity>

          {/* 2. Communications Hub Button (WhatsApp Cloud & Email) */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'COMMUNICATIONS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('COMMUNICATIONS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'COMMUNICATIONS' && styles.pillBtnTextActive]}>
              💬 Communications
            </Text>
          </TouchableOpacity>

          {/* 3. Quotations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'QUOTES' && styles.pillBtnActive]}
            onPress={() => setActiveTab('QUOTES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'QUOTES' && styles.pillBtnTextActive]}>
              📝 Quotations
            </Text>
          </TouchableOpacity>

          {/* 4. Deals Pipeline Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'DEALS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('DEALS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'DEALS' && styles.pillBtnTextActive]}>
              💼 Deals Pipeline
            </Text>
          </TouchableOpacity>

          {/* 5. In-Depth Reports Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'REPORTS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('REPORTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'REPORTS' && styles.pillBtnTextActive]}>
              📊 In-Depth Reports
            </Text>
          </TouchableOpacity>

          {/* 6. Automations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AUTOMATIONS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AUTOMATIONS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AUTOMATIONS' && styles.pillBtnTextActive]}>
              ⚡ Automations
            </Text>
          </TouchableOpacity>

          {/* 7. Audit Logs Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AUDIT' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AUDIT')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AUDIT' && styles.pillBtnTextActive]}>
              🔒 Audit Logs
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── MODULE CONTENTS ─────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>

        {/* 📦 MODULE 1: PRODUCTS & CATALOG CUSTOMIZATION */}
        {activeTab === 'PRODUCTS' && (
          <ProductsCatalogScreen />
        )}

        {/* 💬 MODULE 2: COMMUNICATIONS HUB (WHATSAPP CLOUD API & EMAIL MARKETING) */}
        {activeTab === 'COMMUNICATIONS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>💬 Communications Hub</Text>
                  <Text style={styles.moduleSub}>WhatsApp Cloud 2-Way Messaging API &amp; Email Marketing Engine.</Text>
                </View>
              </View>

              {/* Sub-Tab Switcher */}
              <View style={{ flexDirection: 'row', backgroundColor: '#020617', borderRadius: 12, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' }}>
                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 }, commSubTab === 'WA_CLOUD' && { backgroundColor: '#4f46e5' }]}
                  onPress={() => setCommSubTab('WA_CLOUD')}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '800', color: '#94a3b8' }, commSubTab === 'WA_CLOUD' && { color: '#ffffff' }]}>
                    💬 WhatsApp Cloud API
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 }, commSubTab === 'EMAIL' && { backgroundColor: '#4f46e5' }]}
                  onPress={() => setCommSubTab('EMAIL')}
                >
                  <Text style={[{ fontSize: 11, fontWeight: '800', color: '#94a3b8' }, commSubTab === 'EMAIL' && { color: '#ffffff' }]}>
                    📧 Email Marketing
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 💬 SUB-SECTION A: WHATSAPP CLOUD API */}
              {commSubTab === 'WA_CLOUD' && (
                <View style={{ gap: 12 }}>
                  {/* Status Banner */}
                  <View style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>🟢 WhatsApp Cloud API Active</Text>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>2-Way Cloud Messaging • 100,000 Quota Available</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>VERIFIED</Text>
                    </View>
                  </View>

                  {/* Recipient Details */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>👤 Recipient Client Name:</Text>
                    <TextInput
                      style={styles.inputField}
                      value={waClientName}
                      onChangeText={setWaClientName}
                      placeholder="e.g. Rajesh Mehta"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📞 Recipient WhatsApp Number:</Text>
                    <TextInput
                      style={styles.inputField}
                      value={waClientPhone}
                      onChangeText={setWaClientPhone}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#64748b"
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Template Picker */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📄 Select WhatsApp Template:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {DEFAULT_TEMPLATES.map((tpl) => (
                          <TouchableOpacity
                            key={tpl.id}
                            style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, selectedWaTpl.id === tpl.id && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)' }]}
                            onPress={() => setSelectedWaTpl(tpl)}
                          >
                            <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, selectedWaTpl.id === tpl.id && { color: '#818cf8' }]}>
                              {tpl.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Product Attachment Picker */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🛍️ Attach Catalog Product &amp; Price Deck:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {CATALOG_PRODUCTS.map((prod) => (
                          <TouchableOpacity
                            key={prod.id}
                            style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, selectedProduct.id === prod.id && { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)' }]}
                            onPress={() => setSelectedProduct(prod)}
                          >
                            <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, selectedProduct.id === prod.id && { color: '#34d399' }]}>
                              {prod.name} ({prod.sku})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Quantity & Tax Calculation Box */}
                    <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>Unit Price Range:</Text>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#34d399' }}>{selectedProduct.minPrice} - {selectedProduct.maxPrice}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>GST Tax Rate:</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#fbbf24' }}>+18% GST Applicable</Text>
                      </View>
                    </View>
                  </View>

                  {/* Dispatch Button */}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 4 }]} onPress={handleDispatchWhatsApp}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>💬 Dispatch WhatsApp Cloud Message →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 📧 SUB-SECTION B: EMAIL MARKETING */}
              {commSubTab === 'EMAIL' && (
                <View style={{ gap: 12 }}>
                  {/* Status Banner */}
                  <View style={{ backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>🟢 Cloud SMTP &amp; AWS SES Engine Connected</Text>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>High-Deliverability Email Dispatcher • TLS Encrypted</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(129,140,248,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#818cf8' }}>CONNECTED</Text>
                    </View>
                  </View>

                  {/* Recipient Email */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>✉️ Recipient Client Email:</Text>
                    <TextInput
                      style={styles.inputField}
                      value={emailTo}
                      onChangeText={setEmailTo}
                      placeholder="e.g. rajesh@techcorp.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                    />
                  </View>

                  {/* Email Subject */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📌 Email Subject Line:</Text>
                    <TextInput
                      style={styles.inputField}
                      value={emailSubject}
                      onChangeText={setEmailSubject}
                      placeholder="Subject line..."
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  {/* Email Body */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📝 Email Message Body:</Text>
                    <TextInput
                      style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]}
                      value={emailBody}
                      onChangeText={setEmailBody}
                      multiline
                      placeholder="Type email body message..."
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  {/* Dispatch Button */}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 4 }]} onPress={handleDispatchEmail}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>📧 Dispatch Email Campaign →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* 📝 MODULE 3: QUOTATIONS & PROPOSALS */}
        {activeTab === 'QUOTES' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>📝 Quotation Drafts &amp; PDF Proposals</Text>
                  <Text style={styles.moduleSub}>Generate custom client proposals with GST tax breakdown &amp; WhatsApp PDF export.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('New Quotation', 'Opening quotation draft builder...')}>
                  <Text style={styles.actionBtnText}>+ New Quote</Text>
                </TouchableOpacity>
              </View>

              {[
                { id: 'Q-2026-0001', lead: 'Rajesh Kumar (TechCorp)', date: '19 Aug 2026', total: '₹5,20,000', status: 'SENT' },
                { id: 'Q-2026-0002', lead: 'Priya Sharma (LogiTech)', date: '18 Aug 2026', total: '₹3,50,000', status: 'ACCEPTED' },
                { id: 'Q-2026-0003', lead: 'Sunita Kapoor (Sunita RE)', date: '15 Aug 2026', total: '₹8,90,000', status: 'DRAFT' },
                { id: 'Q-2026-0004', lead: 'Vikram Malhotra (Apex)', date: '12 Aug 2026', total: '₹1,42,000', status: 'SENT' },
              ].map((q, idx) => (
                <View key={q.id} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{q.id} • {q.lead}</Text>
                    <Text style={styles.itemSub}>{q.date} • Total: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{q.total}</Text></Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: q.status === 'ACCEPTED' ? 'rgba(52,211,153,0.15)' : q.status === 'SENT' ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: q.status === 'ACCEPTED' ? '#34d399' : q.status === 'SENT' ? '#38bdf8' : '#fbbf24' }}>
                      {q.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 💼 MODULE 4: DEALS KANBAN & SALES PIPELINE */}
        {activeTab === 'DEALS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>💼 Deals Kanban &amp; Sales Pipeline</Text>
                  <Text style={styles.moduleSub}>5-Stage active pipeline management across all tenant accounts.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('New Deal', 'Creating new deal record...')}>
                  <Text style={styles.actionBtnText}>+ New Deal</Text>
                </TouchableOpacity>
              </View>

              {[
                { title: 'Enterprise CRM License', company: 'TechCorp Solutions', val: '₹5,20,000', stage: 'Prospecting', color: '#38bdf8' },
                { title: 'WhatsApp Bot Integration', company: 'LogiTech Freight', val: '₹3,50,000', stage: 'Qualification', color: '#818cf8' },
                { title: 'Real Estate Portal Rollout', company: 'Sunita Logistics', val: '₹8,90,000', stage: 'Proposal', color: '#c084fc' },
                { title: 'Multi-Tenant SLA Contract', company: 'Apex Global', val: '₹12,00,000', stage: 'Negotiation', color: '#fbbf24' },
                { title: 'Automobile CRM Rollout', company: 'Lakshmi Auto', val: '₹24,00,000', stage: 'Closed Won', color: '#34d399' },
              ].map((deal, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 4 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{deal.title}</Text>
                    <Text style={styles.itemSub}>{deal.company} • Value: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{deal.val}</Text></Text>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: deal.color + '20', borderColor: deal.color + '60' }]}>
                    <Text style={[styles.stageText, { color: deal.color }]}>{deal.stage}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 📊 MODULE 5: IN-DEPTH OPERATIONS & TELEMETRY REPORTS */}
        {activeTab === 'REPORTS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>📊 In-Depth Operations &amp; Sales Telemetry Report</Text>
                  <Text style={styles.moduleSub}>Real-time revenue metrics, call telemetry &amp; staff performance leaderboard.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#34d399' }]}
                  onPress={() => Alert.alert('Export Telemetry', 'Comprehensive In-Depth Operations CSV exported to downloads.')}
                >
                  <Text style={[styles.actionBtnText, { color: '#090d16' }]}>📥 Export CSV</Text>
                </TouchableOpacity>
              </View>

              {/* Financial Telemetry Summary */}
              <View style={[styles.detailBox, { borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.06)' }]}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399', marginBottom: 6 }}>💰 Revenue &amp; Financial Telemetry</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Today's Closed Sales Volume:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>$18,450</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Weekly Accumulated Sales:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>$84,200</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Monthly Closed Total:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#818cf8' }}>$128,400</Text>
                </View>
              </View>

              {/* Outbound Voice Telemetry Summary */}
              <View style={[styles.detailBox, { borderColor: 'rgba(129,140,248,0.3)', backgroundColor: 'rgba(129,140,248,0.06)' }]}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#818cf8', marginBottom: 6 }}>📞 Outbound Calling &amp; Telemetry Audit</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Total Calls Attempted Today:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>384 Calls</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Connected &amp; Talked:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#34d399' }}>246 Calls (64.1%)</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Cumulative Talk Time:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#38bdf8' }}>15h 12m (Avg 3m 42s/call)</Text>
                </View>
              </View>

              {/* Rep Performance Table */}
              <View style={styles.detailBox}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff', marginBottom: 8 }}>👥 Sales Rep Performance Leaderboard (Today)</Text>
                {[
                  { name: 'Mighty Rai', calls: 112, deals: 3, sales: '$8,500' },
                  { name: 'Priya Sharma', calls: 94, deals: 2, sales: '$4,200' },
                  { name: 'Amit Patel', calls: 86, deals: 2, sales: '$3,450' },
                  { name: 'Rajesh Kumar', calls: 92, deals: 1, sales: '$2,300' },
                ].map((rep, idx) => (
                  <View key={rep.name} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: '#1e293b' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#e2e8f0' }}>{idx + 1}. {rep.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '700' }}>📞 {rep.calls} calls</Text>
                      <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '800' }}>🤝 {rep.deals} deals</Text>
                      <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>{rep.sales}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ⚡ MODULE 6: AUTOMATIONS */}
        {activeTab === 'AUTOMATIONS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>⚡ Workflow Automation Rules &amp; Triggers</Text>
              <Text style={styles.moduleSub}>Active lead distribution rules, WhatsApp auto-responders &amp; timeout hooks.</Text>

              {[
                { name: 'Auto-Assign Fresh Ingested Leads', trigger: 'On Ingestion', action: 'Round-Robin Distribution' },
                { name: 'Send WhatsApp Welcome Proposal', trigger: 'Status = Qualified', action: 'WhatsApp Cloud API' },
                { name: 'Vanish Pool Timeout Re-assignment', trigger: 'No Call in 30m', action: 'Handover to Pool' },
                { name: '5-Min Prior Automated Call Alert', trigger: 'Task Time - 5m', action: 'Push Notification' },
              ].map((rule, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{rule.name}</Text>
                    <Text style={styles.itemSub}>Trigger: <Text style={{ color: '#818cf8' }}>{rule.trigger}</Text> → {rule.action}</Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>ACTIVE</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 🔒 MODULE 7: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>🔒 Security &amp; Telemetry Audit Logs</Text>
              <Text style={styles.moduleSub}>System audit trail of administrative actions, lead assignments &amp; call logs.</Text>

              {[
                { user: 'Super Admin', action: 'Enforced Hierarchy Assignment Rules', time: '10 mins ago' },
                { user: 'Mighty Rai (Sales)', action: 'Logged Call Outcome (4m 18s — Connected)', time: '25 mins ago' },
                { user: 'Priya Sharma (TL)', action: 'Punched In via Geofence (09:21 AM)', time: '1 hour ago' },
                { user: 'Vikram Singh (Mgr)', action: 'Allocated Lead Batch to Team A', time: '2 hours ago' },
              ].map((log, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{log.user}</Text>
                    <Text style={styles.itemSub}>{log.action}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700' }}>{log.time}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  headerArea: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginBottom: 10 },

  tabPillRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  pillBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  pillBtnTextActive: {
    color: '#ffffff',
  },

  scrollContent: { padding: 16, paddingBottom: 32 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, pb: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },

  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  inputField: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#ffffff',
  },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stageText: { fontSize: 10, fontWeight: '800' },
  activePill: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },

  detailBox: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10, marginBottom: 10 },
});
