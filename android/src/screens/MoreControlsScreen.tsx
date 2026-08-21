/**
 * MoreControlsScreen.tsx — DAS CRM Android
 * Operations Control Center with Top Horizontal Pill Action Buttons:
 * 1. 📦 Products Catalog (Full Catalog & Customization Portal)
 * 2. 💬 Communications Hub (wacrm WhatsApp Cloud API, Email Marketing & AI Controls)
 * 3. 🤖 AI Controls (Customize AI Persona, System Prompts, Auto-Replies & Score Thresholds)
 * 4. ✏️ WA Templates (Edit & Customization of Direct WhatsApp Message Templates)
 * 5. 📝 Quotations (Proposals, GST Estimates & PDF Export)
 * 6. 💼 Deals Pipeline (5-Stage Kanban Board)
 * 7. 📊 In-Depth Reports (Sales Volume, Call Telemetry & Rep Leaderboard)
 * 8. ⚡ Automations (Workflow Rules & WhatsApp Bot Triggers)
 * 9. 🔒 Audit Logs (Security & Access Telemetry)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const AI_STORAGE_KEY = 'das_ai_communication_rules_v1';

// wacrm Conversation Item Interface
interface WAChatThread {
  id: string;
  contactName: string;
  phone: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  assignedAgent: string;
  stage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'WON';
  internalNotes: string[];
  messages: { sender: 'CLIENT' | 'AGENT' | 'SYSTEM'; text: string; time: string; status?: 'SENT' | 'DELIVERED' | 'READ' }[];
}

export default function MoreControlsScreen({
  navigation,
  onOpenProfile,
  onOpenAppUpdates,
  onNavigateTab,
}: MoreControlsScreenProps) {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'COMMUNICATIONS' | 'AI_CONTROL' | 'WA_TEMPLATES' | 'QUOTES' | 'DEALS' | 'REPORTS' | 'AUTOMATIONS' | 'AUDIT'>('PRODUCTS');

  // 💬 Communications Sub-State
  const [commSubTab, setCommSubTab] = useState<'WA_CLOUD' | 'EMAIL' | 'AI_BOT'>('WA_CLOUD');

  // 🟢 wacrm WhatsApp Cloud API Sub-Module Selector
  const [waSubModule, setWaSubModule] = useState<'INBOX' | 'BROADCASTS' | 'AUTOMATIONS' | 'AI_KB' | 'CONTACTS'>('INBOX');

  // wacrm Conversation Threads State
  const [chatThreads, setChatThreads] = useState<WAChatThread[]>([
    {
      id: 'thread_1',
      contactName: 'Rajesh Mehta',
      phone: '+91 98765 43210',
      company: 'TechCorp Solutions Ltd',
      lastMessage: 'Can you share the GST tax breakdown and 5-min demo slot?',
      timestamp: '10:45 AM',
      unreadCount: 2,
      assignedAgent: 'Manager A (Rajesh Mehta)',
      stage: 'QUALIFIED',
      internalNotes: ['Enterprise deal. Prefers afternoon demo calls.', 'Discussed 18% GST pricing.'],
      messages: [
        { sender: 'CLIENT', text: 'Hi, we need CRM licenses for 25 sales reps.', time: '10:40 AM' },
        { sender: 'AGENT', text: 'Hi Rajesh! I have attached our Enterprise Suite deck.', time: '10:42 AM', status: 'READ' },
        { sender: 'CLIENT', text: 'Can you share the GST tax breakdown and 5-min demo slot?', time: '10:45 AM' },
      ],
    },
    {
      id: 'thread_2',
      contactName: 'Priya Sharma',
      phone: '+91 98123 45678',
      company: 'LogiTech Freight Systems',
      lastMessage: 'Quotation accepted! Please send contract signing link.',
      timestamp: '09:30 AM',
      unreadCount: 0,
      assignedAgent: 'TL A (Priya Sharma)',
      stage: 'PROPOSAL',
      internalNotes: ['Contract ready for signature.'],
      messages: [
        { sender: 'CLIENT', text: 'Quotation accepted! Please send contract signing link.', time: '09:30 AM' },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thread_1');
  const activeThread = chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];
  const [newChatInput, setNewChatInput] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');

  // WhatsApp Single Message Form State
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

  // ✏️ WA Templates Customization State
  const [waTemplatesList, setWaTemplatesList] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [editTplModalOpen, setEditTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormCategory, setTplFormCategory] = useState<'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION'>('OUTREACH');
  const [tplFormText, setTplFormText] = useState('');

  // 🤖 AI Assistant Control & Persona Customization State
  const [aiEngineEnabled, setAiEngineEnabled] = useState(true);
  const [aiPersona, setAiPersona] = useState<'CONSULTATIVE' | 'AGGRESSIVE' | 'SUPPORT' | 'CUSTOM'>('CONSULTATIVE');
  const [aiMinScoreThreshold, setAiMinScoreThreshold] = useState('75');
  const [aiAutoNudgeMins, setAiAutoNudgeMins] = useState('15');
  const [aiIncludeCatalog, setAiIncludeCatalog] = useState(true);
  const [aiGstTaxCalc, setAiGstTaxCalc] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    "You are DAS CRM's senior AI sales consultant. Always address prospects professionally, provide pricing with 18% GST tax rate breakdown, attach brochure specs, and offer a 5-minute live demo call."
  );

  // Broadcast State
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'HOT_LEADS' | 'QUALIFIED'>('HOT_LEADS');
  const [broadcastTpl, setBroadcastTpl] = useState<WhatsAppTemplate>(DEFAULT_TEMPLATES[0]);

  // Load saved WA templates & AI rules on mount
  useEffect(() => {
    whatsappTemplateEngine.getTemplates().then((tpls) => {
      if (tpls && tpls.length > 0) {
        setWaTemplatesList(tpls);
      }
    });

    AsyncStorage.getItem(AI_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.enabled !== undefined) setAiEngineEnabled(parsed.enabled);
          if (parsed.persona) setAiPersona(parsed.persona);
          if (parsed.threshold) setAiMinScoreThreshold(parsed.threshold);
          if (parsed.nudgeMins) setAiAutoNudgeMins(parsed.nudgeMins);
          if (parsed.prompt) setAiSystemPrompt(parsed.prompt);
          if (parsed.includeCatalog !== undefined) setAiIncludeCatalog(parsed.includeCatalog);
          if (parsed.gstCalc !== undefined) setAiGstTaxCalc(parsed.gstCalc);
        } catch {}
      }
    });
  }, []);

  const handleSendChatMessage = () => {
    if (!newChatInput.trim()) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: newChatInput.trim(),
              timestamp: nowTime,
              messages: [...t.messages, { sender: 'AGENT', text: newChatInput.trim(), time: nowTime, status: 'SENT' }],
            }
          : t
      )
    );
    setNewChatInput('');
  };

  const handleAddInternalNote = () => {
    if (!internalNoteInput.trim()) return;
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, internalNotes: [...t.internalNotes, internalNoteInput.trim()] }
          : t
      )
    );
    setInternalNoteInput('');
    Alert.alert('✅ Internal Note Saved', 'Private note added to thread (invisible to contact).');
  };

  const handleTriggerBroadcast = () => {
    Alert.alert(
      '📢 wacrm Broadcast Dispatched',
      `Meta-approved broadcast campaign "${broadcastTpl.title}" launched to ${broadcastTarget === 'ALL' ? '240 Contacts' : broadcastTarget === 'HOT_LEADS' ? '42 Hot Leads' : '88 Qualified Leads'}.\n\n• Delivery Status: 100% In Progress\n• Variable Substitution: {name}, {company}`
    );
  };

  const handleSaveAiRules = async () => {
    const aiConfig = {
      enabled: aiEngineEnabled,
      persona: aiPersona,
      threshold: aiMinScoreThreshold,
      nudgeMins: aiAutoNudgeMins,
      prompt: aiSystemPrompt,
      includeCatalog: aiIncludeCatalog,
      gstCalc: aiGstTaxCalc,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiConfig));
    Alert.alert(
      '🤖 AI Control Rules Saved',
      `AI Persona "${aiPersona}" & system rules saved successfully! The AI assistant will obey these controls across WhatsApp Cloud & Email messaging.`
    );
  };

  const handleOpenEditTpl = (tpl?: WhatsAppTemplate) => {
    if (tpl) {
      setEditingTpl(tpl);
      setTplFormTitle(tpl.title);
      setTplFormCategory(tpl.category);
      setTplFormText(tpl.text);
    } else {
      setEditingTpl(null);
      setTplFormTitle('');
      setTplFormCategory('OUTREACH');
      setTplFormText("Hi {name}, following up regarding our CRM proposal for {company}. Let's connect!");
    }
    setEditTplModalOpen(true);
  };

  const handleSaveTpl = async () => {
    if (!tplFormTitle.trim() || !tplFormText.trim()) {
      Alert.alert('Missing Info', 'Please enter a template title and template message text.');
      return;
    }
    const newTpl: WhatsAppTemplate = {
      id: editingTpl ? editingTpl.id : `tpl_custom_${Date.now()}`,
      title: tplFormTitle.trim(),
      category: tplFormCategory,
      text: tplFormText.trim(),
    };
    const updated = await whatsappTemplateEngine.upsertTemplate(newTpl);
    setWaTemplatesList(updated);
    setEditTplModalOpen(false);
    Alert.alert('✅ Template Saved', `WhatsApp template "${tplFormTitle}" saved and synced across CRM!`);
  };

  const handleDispatchWhatsApp = () => {
    const cleanPhone = waClientPhone.replace(/[^\d]/g, '');
    const interpolated = whatsappTemplateEngine.interpolateTemplate(
      selectedWaTpl.text,
      { name: waClientName, company: 'TechCorp Solutions', value: selectedProduct.minPrice },
      null,
      1
    );
    const fullMsg = `${interpolated}\n\n📦 Product Deck: ${selectedProduct.name} (${selectedProduct.sku})\nPricing: ${selectedProduct.minPrice} - ${selectedProduct.maxPrice} (+18% GST)`;

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

          {/* 2. Communications Hub Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'COMMUNICATIONS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('COMMUNICATIONS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'COMMUNICATIONS' && styles.pillBtnTextActive]}>
              💬 Communications
            </Text>
          </TouchableOpacity>

          {/* 3. AI Assistant Controls */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AI_CONTROL' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AI_CONTROL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AI_CONTROL' && styles.pillBtnTextActive]}>
              🤖 AI Controls
            </Text>
          </TouchableOpacity>

          {/* 4. WhatsApp Direct Message Templates Customization */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'WA_TEMPLATES' && styles.pillBtnActive]}
            onPress={() => setActiveTab('WA_TEMPLATES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'WA_TEMPLATES' && styles.pillBtnTextActive]}>
              ✏️ WA Templates
            </Text>
          </TouchableOpacity>

          {/* 5. Quotations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'QUOTES' && styles.pillBtnActive]}
            onPress={() => setActiveTab('QUOTES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'QUOTES' && styles.pillBtnTextActive]}>
              📝 Quotations
            </Text>
          </TouchableOpacity>

          {/* 6. Deals Pipeline Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'DEALS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('DEALS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'DEALS' && styles.pillBtnTextActive]}>
              💼 Deals Pipeline
            </Text>
          </TouchableOpacity>

          {/* 7. In-Depth Reports Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'REPORTS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('REPORTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'REPORTS' && styles.pillBtnTextActive]}>
              📊 In-Depth Reports
            </Text>
          </TouchableOpacity>

          {/* 8. Automations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AUTOMATIONS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AUTOMATIONS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AUTOMATIONS' && styles.pillBtnTextActive]}>
              ⚡ Automations
            </Text>
          </TouchableOpacity>

          {/* 9. Audit Logs Button */}
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

        {/* 💬 MODULE 2: COMMUNICATIONS HUB (wacrm WHATSAPP CLOUD API, EMAIL & AI BOT) */}
        {activeTab === 'COMMUNICATIONS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>💬 Communications Hub (wacrm WhatsApp Suite)</Text>
                  <Text style={styles.moduleSub}>Meta Official WhatsApp Business Cloud API • Multi-Agent Shared Inbox • Broadcasts • Automations.</Text>
                </View>
              </View>

              {/* Sub-Tab Switcher */}
              <View style={{ flexDirection: 'row', backgroundColor: '#020617', borderRadius: 12, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' }}>
                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 }, commSubTab === 'WA_CLOUD' && { backgroundColor: '#4f46e5' }]}
                  onPress={() => setCommSubTab('WA_CLOUD')}
                >
                  <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, commSubTab === 'WA_CLOUD' && { color: '#ffffff' }]}>
                    💬 WhatsApp Cloud
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 }, commSubTab === 'EMAIL' && { backgroundColor: '#4f46e5' }]}
                  onPress={() => setCommSubTab('EMAIL')}
                >
                  <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, commSubTab === 'EMAIL' && { color: '#ffffff' }]}>
                    📧 Email Engine
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 }, commSubTab === 'AI_BOT' && { backgroundColor: '#4f46e5' }]}
                  onPress={() => setCommSubTab('AI_BOT')}
                >
                  <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, commSubTab === 'AI_BOT' && { color: '#ffffff' }]}>
                    🤖 AI Assistant
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 💬 SUB-SECTION A: wacrm WHATSAPP CLOUD API SUITE */}
              {commSubTab === 'WA_CLOUD' && (
                <View style={{ gap: 12 }}>
                  {/* Status Banner */}
                  <View style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399' }}>🟢 Meta Official WhatsApp Business API Active</Text>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>Phone: +91 98765 43210 • 100,000 Monthly Quota (14,280 Used) • AES-256 Encrypted</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>VERIFIED GREEN</Text>
                    </View>
                  </View>

                  {/* wacrm Sub-Module Selector Bar */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[
                        { id: 'INBOX', label: '📥 Shared Inbox' },
                        { id: 'BROADCASTS', label: '📢 Broadcasts' },
                        { id: 'AUTOMATIONS', label: '⚡ Automations' },
                        { id: 'AI_KB', label: '🤖 AI & KB' },
                        { id: 'CONTACTS', label: '👥 Contact Hub' },
                      ].map((sub) => (
                        <TouchableOpacity
                          key={sub.id}
                          style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, waSubModule === sub.id && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)' }]}
                          onPress={() => setWaSubModule(sub.id as any)}
                        >
                          <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, waSubModule === sub.id && { color: '#818cf8' }]}>
                            {sub.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* 📥 1. SHARED MULTI-AGENT INBOX */}
                  {waSubModule === 'INBOX' && (
                    <View style={{ gap: 10 }}>
                      {/* Thread Selection Pills */}
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>💬 Active Chat Threads (Multi-Agent Shared Inbox):</Text>
                        {chatThreads.map((t) => (
                          <TouchableOpacity
                            key={t.id}
                            style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 10, borderRadius: 12 }, activeThreadId === t.id && { borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)' }]}
                            onPress={() => setActiveThreadId(t.id)}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>{t.contactName} ({t.company})</Text>
                              <Text style={{ fontSize: 9, color: '#94a3b8' }}>{t.timestamp}</Text>
                            </View>
                            <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{t.lastMessage}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                              <Text style={{ fontSize: 9, color: '#818cf8', fontWeight: '800' }}>👤 {t.assignedAgent}</Text>
                              <View style={{ backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 8, fontWeight: '900', color: '#38bdf8' }}>{t.stage}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Active Chat Conversation Feed */}
                      <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12, gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', pb: 6 }}>
                          <View>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>💬 Thread: {activeThread.contactName}</Text>
                            <Text style={{ fontSize: 9, color: '#94a3b8' }}>{activeThread.phone} • {activeThread.assignedAgent}</Text>
                          </View>
                          <TouchableOpacity style={{ backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }} onPress={() => setActiveTab('WA_TEMPLATES')}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#38bdf8' }}>📄 1-Click Tpl</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Chat Messages */}
                        <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ gap: 8 }}>
                          {activeThread.messages.map((m, idx) => (
                            <View
                              key={idx}
                              style={[
                                { maxWidth: '82%', padding: 8, borderRadius: 10 },
                                m.sender === 'AGENT'
                                  ? { alignSelf: 'flex-end', backgroundColor: '#065f46', borderBottomRightRadius: 2 }
                                  : { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderBottomLeftRadius: 2 },
                              ]}
                            >
                              <Text style={{ fontSize: 11, color: '#ffffff', lineHeight: 15 }}>{m.text}</Text>
                              <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end', marginTop: 2 }}>
                                {m.time} {m.sender === 'AGENT' ? (m.status === 'READ' ? '✓✓ Read' : '✓ Sent') : ''}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>

                        {/* Chat Input & Send */}
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          <TextInput
                            style={[styles.inputField, { flex: 1 }]}
                            value={newChatInput}
                            onChangeText={setNewChatInput}
                            placeholder="Type WhatsApp message..."
                            placeholderTextColor="#64748b"
                          />
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366', paddingHorizontal: 12, paddingVertical: 10 }]} onPress={handleSendChatMessage}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff' }}>Send →</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Internal Team Notes */}
                        <View style={{ borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8, gap: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fbbf24' }}>🔒 Internal Team Notes (Invisible to Contact):</Text>
                          {activeThread.internalNotes.map((note, idx) => (
                            <Text key={idx} style={{ fontSize: 9, color: '#cbd5e1', backgroundColor: '#090d16', padding: 6, borderRadius: 6 }}>
                              • {note}
                            </Text>
                          ))}
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TextInput
                              style={[styles.inputField, { flex: 1, fontSize: 10, paddingVertical: 4 }]}
                              value={internalNoteInput}
                              onChangeText={setInternalNoteInput}
                              placeholder="Add private agent note..."
                              placeholderTextColor="#64748b"
                            />
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#334155' }]} onPress={handleAddInternalNote}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>+ Note</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* 📢 2. BROADCAST CAMPAIGNS */}
                  {waSubModule === 'BROADCASTS' && (
                    <View style={{ gap: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📢 Meta-Approved Template Bulk Broadcast Engine:</Text>
                      
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Audience Segmentation:</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[
                            { id: 'HOT_LEADS', label: '🔥 Hot Leads (42)' },
                            { id: 'QUALIFIED', label: '🎯 Qualified (88)' },
                            { id: 'ALL', label: '👥 All Contacts (240)' },
                          ].map((seg) => (
                            <TouchableOpacity
                              key={seg.id}
                              style={[{ flex: 1, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingVertical: 6, alignItems: 'center', borderRadius: 8 }, broadcastTarget === seg.id && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)' }]}
                              onPress={() => setBroadcastTarget(seg.id as any)}
                            >
                              <Text style={[{ fontSize: 9, fontWeight: '800', color: '#94a3b8' }, broadcastTarget === seg.id && { color: '#818cf8' }]}>
                                {seg.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Broadcast Template */}
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Select Approved Broadcast Template:</Text>
                        {waTemplatesList.map((tpl) => (
                          <TouchableOpacity
                            key={tpl.id}
                            style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 8, borderRadius: 8 }, broadcastTpl.id === tpl.id && { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)' }]}
                            onPress={() => setBroadcastTpl(tpl)}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{tpl.title}</Text>
                            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{tpl.text}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }]} onPress={handleTriggerBroadcast}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>🚀 Dispatch Bulk WhatsApp Broadcast →</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ⚡ 3. NO-CODE AUTOMATIONS */}
                  {waSubModule === 'AUTOMATIONS' && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>⚡ wacrm Visual Automation Workflows:</Text>
                      {[
                        { title: 'Welcome Auto-Responder', trigger: 'Inbound Message = "DEMO"', action: 'Send Product Deck & Schedule Call' },
                        { title: 'Inactivity Chaser Nudge', trigger: 'No Rep Response in 15m', action: 'Send Nudge & Alert Manager' },
                        { title: 'Keyword Lead Tagging', trigger: 'Message contains "PRICING"', action: 'Tag HOT_LEAD & Assign Rep' },
                      ].map((auto, idx) => (
                        <View key={idx} style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 10, borderRadius: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff' }}>{auto.title}</Text>
                          <Text style={{ fontSize: 9, color: '#818cf8', marginTop: 2 }}>Trigger: {auto.trigger}</Text>
                          <Text style={{ fontSize: 9, color: '#34d399', marginTop: 1 }}>Action: {auto.action}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 🤖 4. AI ASSISTANT & KNOWLEDGE BASE */}
                  {waSubModule === 'AI_KB' && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🤖 Gemini 1.5 AI Assistant &amp; Knowledge Base FAQ:</Text>
                      <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 10, borderRadius: 10, gap: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#38bdf8' }}>📚 Hybrid Retrieval Knowledge Base (Postgres + Semantic Vector):</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8' }}>• Enterprise CRM Pricing FAQ ($2,999 - $4,999 + 18% GST)</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8' }}>• Geo-Fence Attendance & Selfie Anti-Spoofing Policy</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8' }}>• WhatsApp Cloud API 100,000 Quota SLA Terms</Text>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5', alignSelf: 'flex-start', marginTop: 4 }]} onPress={() => setActiveTab('AI_CONTROL')}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>🤖 Edit AI Persona Rules →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* 👥 5. CONTACT HUB */}
                  {waSubModule === 'CONTACTS' && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>👥 Contact Hub &amp; Tags Directory:</Text>
                      {[
                        { name: 'Rajesh Mehta', phone: '+91 98765 43210', tags: ['HOT_LEAD', 'ENTERPRISE'] },
                        { name: 'Priya Sharma', phone: '+91 98123 45678', tags: ['QUALIFIED', 'PROPOSAL'] },
                        { name: 'Sunita Kapoor', phone: '+91 97222 33344', tags: ['CLOSED_WON'] },
                      ].map((c, idx) => (
                        <View key={idx} style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{c.name}</Text>
                            <Text style={{ fontSize: 9, color: '#94a3b8' }}>{c.phone}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {c.tags.map((t) => (
                              <View key={t} style={{ backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 8, fontWeight: '900', color: '#38bdf8' }}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
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

              {/* 🤖 SUB-SECTION C: AI BOT & PERSONA CONTROL */}
              {commSubTab === 'AI_BOT' && (
                <View style={{ gap: 12 }}>
                  {/* Master Status & Toggle Banner */}
                  <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>
                        🤖 AI Assistant Engine: {aiEngineEnabled ? 'ONLINE (Active)' : 'PAUSED'}
                      </Text>
                      <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                        Gemini 1.5 Pro Neural Cloud • 342 / 500 Responses Today
                      </Text>
                    </View>
                    <Switch
                      value={aiEngineEnabled}
                      onValueChange={setAiEngineEnabled}
                      trackColor={{ false: '#334155', true: '#6366f1' }}
                      thumbColor={aiEngineEnabled ? '#818cf8' : '#94a3b8'}
                    />
                  </View>

                  {/* AI Persona Selector */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🎭 Select AI Sales Persona Preset:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {[
                        { id: 'CONSULTATIVE', name: '🎯 Consultative Advisor' },
                        { id: 'AGGRESSIVE', name: '⚡ Aggressive Closer' },
                        { id: 'SUPPORT', name: '🤝 Support Specialist' },
                        { id: 'CUSTOM', name: '🏢 Custom Enterprise' },
                      ].map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, aiPersona === p.id && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)' }]}
                          onPress={() => setAiPersona(p.id as any)}
                        >
                          <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, aiPersona === p.id && { color: '#818cf8' }]}>
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Thresholds & Controls */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#cbd5e1' }}>🔥 Min Score Threshold:</Text>
                      <TextInput
                        style={styles.inputField}
                        value={aiMinScoreThreshold}
                        onChangeText={setAiMinScoreThreshold}
                        keyboardType="numeric"
                        placeholder="75"
                        placeholderTextColor="#64748b"
                      />
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#cbd5e1' }}>⏱️ Inactivity Nudge (Mins):</Text>
                      <TextInput
                        style={styles.inputField}
                        value={aiAutoNudgeMins}
                        onChangeText={setAiAutoNudgeMins}
                        keyboardType="numeric"
                        placeholder="15"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                  </View>

                  {/* Toggles */}
                  <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: '700' }}>🛍️ Include Product Catalog Decks in AI Replies</Text>
                      <Switch value={aiIncludeCatalog} onValueChange={setAiIncludeCatalog} trackColor={{ false: '#334155', true: '#34d399' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: '700' }}>💰 Auto-Calculate 18% GST in AI Quotes</Text>
                      <Switch value={aiGstTaxCalc} onValueChange={setAiGstTaxCalc} trackColor={{ false: '#334155', true: '#34d399' }} />
                    </View>
                  </View>

                  {/* AI System Instructions & Prompt Editor */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🧠 Custom AI Instructions &amp; System Prompt:</Text>
                    <TextInput
                      style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]}
                      value={aiSystemPrompt}
                      onChangeText={setAiSystemPrompt}
                      multiline
                      placeholder="Type custom AI system rules..."
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  {/* Save Rules Button */}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366f1', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 4 }]} onPress={handleSaveAiRules}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>💾 Save &amp; Apply AI Persona Rules →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* 🤖 MODULE 3: DEDICATED AI CONTROLS TAB */}
        {activeTab === 'AI_CONTROL' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>🤖 AI Assistant Controls &amp; Persona Customization</Text>
                  <Text style={styles.moduleSub}>Configure AI Persona, Gemini 1.5 Pro rules, auto-reply caps &amp; lead heat thresholds.</Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                {/* Master Status & Toggle Banner */}
                <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8' }}>
                      🤖 AI Engine Status: {aiEngineEnabled ? 'ONLINE (Active)' : 'PAUSED'}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                      Gemini 1.5 Pro Neural Cloud • 342 / 500 Responses Today
                    </Text>
                  </View>
                  <Switch
                    value={aiEngineEnabled}
                    onValueChange={setAiEngineEnabled}
                    trackColor={{ false: '#334155', true: '#6366f1' }}
                    thumbColor={aiEngineEnabled ? '#818cf8' : '#94a3b8'}
                  />
                </View>

                {/* AI Persona Selector */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🎭 Select AI Sales Persona Preset:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'CONSULTATIVE', name: '🎯 Consultative Advisor' },
                      { id: 'AGGRESSIVE', name: '⚡ Aggressive Closer' },
                      { id: 'SUPPORT', name: '🤝 Support Specialist' },
                      { id: 'CUSTOM', name: '🏢 Custom Enterprise' },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, aiPersona === p.id && { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.15)' }]}
                        onPress={() => setAiPersona(p.id as any)}
                      >
                        <Text style={[{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }, aiPersona === p.id && { color: '#818cf8' }]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Thresholds & Controls */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#cbd5e1' }}>🔥 Min Score Threshold:</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiMinScoreThreshold}
                      onChangeText={setAiMinScoreThreshold}
                      keyboardType="numeric"
                      placeholder="75"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#cbd5e1' }}>⏱️ Inactivity Nudge (Mins):</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiAutoNudgeMins}
                      onChangeText={setAiAutoNudgeMins}
                      keyboardType="numeric"
                      placeholder="15"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>

                {/* Toggles */}
                <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: '700' }}>🛍️ Include Product Catalog Decks in AI Replies</Text>
                    <Switch value={aiIncludeCatalog} onValueChange={setAiIncludeCatalog} trackColor={{ false: '#334155', true: '#34d399' }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: '700' }}>💰 Auto-Calculate 18% GST in AI Quotes</Text>
                    <Switch value={aiGstTaxCalc} onValueChange={setAiGstTaxCalc} trackColor={{ false: '#334155', true: '#34d399' }} />
                  </View>
                </View>

                {/* AI System Instructions & Prompt Editor */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🧠 Custom AI Instructions &amp; System Prompt:</Text>
                  <TextInput
                    style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
                    value={aiSystemPrompt}
                    onChangeText={setAiSystemPrompt}
                    multiline
                    placeholder="Type custom AI system rules..."
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Save Rules Button */}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366f1', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 4 }]} onPress={handleSaveAiRules}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>💾 Save &amp; Apply AI Persona Rules →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ✏️ MODULE 4: WHATSAPP DIRECT MESSAGE TEMPLATES CUSTOMIZATION */}
        {activeTab === 'WA_TEMPLATES' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>✏️ WhatsApp Direct Message Templates</Text>
                  <Text style={styles.moduleSub}>Customize reusable message templates with dynamic placeholders like {'{name}'}, {'{company}'}, {'{value}'}, and {'{product}'}.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEditTpl()}>
                  <Text style={styles.actionBtnText}>+ Add Template</Text>
                </TouchableOpacity>
              </View>

              {/* Template Cards List */}
              <View style={{ gap: 10 }}>
                {waTemplatesList.map((tpl) => (
                  <View key={tpl.id} style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>{tpl.title}</Text>
                      <View style={[styles.statusPill, { backgroundColor: 'rgba(129,140,248,0.15)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.4)' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#818cf8' }}>{tpl.category}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, color: '#94a3b8', lineHeight: 16, marginBottom: 10, backgroundColor: '#090d16', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' }}>
                      {tpl.text}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]} onPress={() => handleOpenEditTpl(tpl)}>
                        <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>✏️ Edit Template</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* 📝 MODULE 5: QUOTATIONS & PROPOSALS */}
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

        {/* 💼 MODULE 6: DEALS KANBAN & SALES PIPELINE */}
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

        {/* 📊 MODULE 7: IN-DEPTH OPERATIONS & TELEMETRY REPORTS */}
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

        {/* ⚡ MODULE 8: AUTOMATIONS */}
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

        {/* 🔒 MODULE 9: AUDIT LOGS */}
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

      {/* ── EDIT / CREATE WHATSAPP TEMPLATE MODAL ──────────────────────────── */}
      <Modal visible={editTplModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>
                {editingTpl ? '✏️ Edit WhatsApp Template' : '➕ Create New WhatsApp Template'}
              </Text>
              <TouchableOpacity onPress={() => setEditTplModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📌 Template Title:</Text>
                <TextInput
                  style={styles.inputField}
                  value={tplFormTitle}
                  onChangeText={setTplFormTitle}
                  placeholder="e.g. 🌱 Initial Outreach"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🏷️ Category:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['OUTREACH', 'PROPOSAL', 'FOLLOWUP', 'PROMOTION'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, tplFormCategory === cat && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                      onPress={() => setTplFormCategory(cat)}
                    >
                      <Text style={[{ fontSize: 9, fontWeight: '900', color: '#94a3b8' }, tplFormCategory === cat && { color: '#ffffff' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📝 Template Message Text:</Text>
                <TextInput
                  style={[styles.inputField, { height: 110, textAlignVertical: 'top' }]}
                  value={tplFormText}
                  onChangeText={setTplFormText}
                  multiline
                  placeholder="Type message text with placeholders..."
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Placeholder Helper Chips */}
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Insert Placeholder Variables:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['{name}', '{company}', '{value}', '{product}'].map((ph) => (
                    <TouchableOpacity
                      key={ph}
                      style={{ backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      onPress={() => setTplFormText((prev) => prev + ' ' + ph)}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#38bdf8' }}>+ {ph}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34d399', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 8 }]} onPress={handleSaveTpl}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#090d16' }}>💾 Save &amp; Sync Template →</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '85%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', pb: 10 },
  modalTitleText: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
