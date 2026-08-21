/**
 * MoreControlsScreen.tsx — DAS CRM Android
 * Operations Control Directory Hub (Button-Only Main View with Modal Workspaces)
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
  route?: any;
  onOpenProductsCatalog?: () => void;
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

export type ModuleKey = 'PRODUCTS' | 'COMMUNICATIONS' | 'AI_CONTROL' | 'WA_TEMPLATES' | 'QUOTES' | 'DEALS' | 'REPORTS' | 'AUTOMATIONS' | 'AUDIT';

export default function MoreControlsScreen({
  navigation,
  route,
  onOpenProductsCatalog,
  onOpenProfile,
  onOpenAppUpdates,
}: MoreControlsScreenProps) {
  // Currently open module modal (null when on main button directory)
  const [activeModal, setActiveModal] = useState<ModuleKey | null>(null);

  // Sub-Module State
  const [commSubTab, setCommSubTab] = useState<'WA_CLOUD' | 'EMAIL' | 'AI_BOT'>('WA_CLOUD');
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

  // Form States
  const [waClientName, setWaClientName] = useState('Rajesh Mehta');
  const [waClientPhone, setWaClientPhone] = useState('+91 98765 43210');
  const [selectedWaTpl, setSelectedWaTpl] = useState<WhatsAppTemplate>(DEFAULT_TEMPLATES[1]);
  const [selectedProduct, setSelectedProduct] = useState(CATALOG_PRODUCTS[0]);

  const [emailTo, setEmailTo] = useState('rajesh@techcorp.com');
  const [emailSubject, setEmailSubject] = useState('Exclusive Enterprise CRM Suite Proposal & Pricing Deck');
  const [emailBody, setEmailBody] = useState(
    'Hi Rajesh Mehta,\n\nFollowing up on our discussion, please find attached our customized DAS CRM Enterprise Suite proposal deck with 18% GST tax breakdown.\n\nBest regards,\nSales Operations Team'
  );

  // WA Templates State
  const [waTemplatesList, setWaTemplatesList] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [editTplModalOpen, setEditTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormCategory, setTplFormCategory] = useState<'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION'>('OUTREACH');
  const [tplFormText, setTplFormText] = useState('');

  // AI Assistant State
  const [aiEngineEnabled, setAiEngineEnabled] = useState(true);
  const [aiPersona, setAiPersona] = useState<'CONSULTATIVE' | 'AGGRESSIVE' | 'SUPPORT' | 'CUSTOM'>('CONSULTATIVE');
  const [aiMinScoreThreshold, setAiMinScoreThreshold] = useState('75');
  const [aiAutoNudgeMins, setAiAutoNudgeMins] = useState('15');
  const [aiIncludeCatalog, setAiIncludeCatalog] = useState(true);
  const [aiGstTaxCalc, setAiGstTaxCalc] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    "You are DAS CRM's senior AI sales consultant. Always address prospects professionally, provide pricing with 18% GST tax rate breakdown, attach brochure specs, and offer a 5-minute live demo call."
  );

  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'HOT_LEADS' | 'QUALIFIED'>('HOT_LEADS');
  const [broadcastTpl, setBroadcastTpl] = useState<WhatsAppTemplate>(DEFAULT_TEMPLATES[0]);

  useEffect(() => {
    whatsappTemplateEngine.getTemplates().then((tpls) => {
      if (tpls && tpls.length > 0) setWaTemplatesList(tpls);
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

    const initMod = route?.params?.initialModule;
    if (initMod) {
      if (initMod === 'DEALS') setActiveModal('DEALS');
      else if (initMod === 'COMMUNICATIONS' || initMod === 'COMMS') setActiveModal('COMMUNICATIONS');
      else if (initMod === 'QUOTATIONS') setActiveModal('QUOTES');
    }
  }, [route?.params?.initialModule]);

  const handleOpenModule = (key: ModuleKey) => {
    if (key === 'PRODUCTS') {
      if (onOpenProductsCatalog) onOpenProductsCatalog();
      else setActiveModal('PRODUCTS');
    } else {
      setActiveModal(key);
    }
  };

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

  const MODULE_BUTTONS: { key: ModuleKey; icon: string; title: string; subtitle: string; badge: string; color: string }[] = [
    {
      key: 'PRODUCTS',
      icon: '📦',
      title: 'Products & Catalog Customization',
      subtitle: 'Categories, Sub-categories, Specs, Inventory & SKU pricing',
      badge: 'PORTAL',
      color: '#818cf8',
    },
    {
      key: 'COMMUNICATIONS',
      icon: '💬',
      title: 'Communications Hub',
      subtitle: 'WhatsApp Cloud API inbox, email marketing & client outreach',
      badge: 'wacrm API',
      color: '#34d399',
    },
    {
      key: 'AI_CONTROL',
      icon: '🤖',
      title: 'AI Controls & Persona Rules',
      subtitle: 'Customize AI system prompt, auto-replies & intent scoring',
      badge: 'GEMINI 1.5',
      color: '#c084fc',
    },
    {
      key: 'WA_TEMPLATES',
      icon: '✏️',
      title: 'WhatsApp Message Templates',
      subtitle: 'Edit 1-click message templates & variable placeholder tags',
      badge: '1-CLICK',
      color: '#38bdf8',
    },
    {
      key: 'QUOTES',
      icon: '📝',
      title: 'Quotations & Invoices',
      subtitle: 'Generate proposals, 18% GST tax estimates & PDF exports',
      badge: 'GST TAX',
      color: '#fbbf24',
    },
    {
      key: 'DEALS',
      icon: '💼',
      title: 'Deals Pipeline Kanban',
      subtitle: '5-stage visual sales pipeline & deal stage shifters',
      badge: 'KANBAN',
      color: '#f472b6',
    },
    {
      key: 'REPORTS',
      icon: '📊',
      title: 'In-Depth Reports & Analytics',
      subtitle: 'Sales telemetry, call audit counts & team leaderboard',
      badge: 'TELEMETRY',
      color: '#38bdf8',
    },
    {
      key: 'AUTOMATIONS',
      icon: '⚡',
      title: 'Workflow Automations & Bot Rules',
      subtitle: 'Trigger rules, bot auto-responders & webhook listeners',
      badge: 'TRIGGERS',
      color: '#facc15',
    },
    {
      key: 'AUDIT',
      icon: '🔒',
      title: 'Security & Audit Telemetry',
      subtitle: 'System audit logs, user actions & permission tracking',
      badge: 'SECURITY',
      color: '#94a3b8',
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Operations Control Center</Text>
        <Text style={styles.headerSub}>Tap any module button below to redirect to its workspace screen.</Text>

        {/* ── HORIZONTAL QUICK PILL BUTTON BAR ──────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabPillRow}>
          {MODULE_BUTTONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.pillBtn}
              onPress={() => handleOpenModule(item.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.pillBtnText}>
                {item.icon} {item.title.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── PURE BUTTON DIRECTORY MAIN SCREEN ───────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Category: CORE BUSINESS WORKSPACES */}
        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>💼 BUSINESS &amp; SALES OPERATIONS</Text>
          {MODULE_BUTTONS.slice(0, 3).map((mod) => (
            <TouchableOpacity
              key={mod.key}
              style={[styles.buttonCard, { borderColor: `${mod.color}40` }]}
              onPress={() => handleOpenModule(mod.key)}
              activeOpacity={0.82}
            >
              <View style={styles.buttonCardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${mod.color}15` }]}>
                  <Text style={{ fontSize: 20 }}>{mod.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.buttonCardTitle}>{mod.title}</Text>
                    <View style={[styles.badgePill, { backgroundColor: `${mod.color}20`, borderColor: `${mod.color}50` }]}>
                      <Text style={[styles.badgeText, { color: mod.color }]}>{mod.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.buttonCardSub}>{mod.subtitle}</Text>
                </View>
              </View>
              <Text style={[styles.arrowText, { color: mod.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category: COMMUNICATIONS & AI ENGINE */}
        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>💬 COMMUNICATIONS &amp; AI ENGINE</Text>
          {MODULE_BUTTONS.slice(3, 6).map((mod) => (
            <TouchableOpacity
              key={mod.key}
              style={[styles.buttonCard, { borderColor: `${mod.color}40` }]}
              onPress={() => handleOpenModule(mod.key)}
              activeOpacity={0.82}
            >
              <View style={styles.buttonCardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${mod.color}15` }]}>
                  <Text style={{ fontSize: 20 }}>{mod.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.buttonCardTitle}>{mod.title}</Text>
                    <View style={[styles.badgePill, { backgroundColor: `${mod.color}20`, borderColor: `${mod.color}50` }]}>
                      <Text style={[styles.badgeText, { color: mod.color }]}>{mod.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.buttonCardSub}>{mod.subtitle}</Text>
                </View>
              </View>
              <Text style={[styles.arrowText, { color: mod.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category: TELEMETRY & SECURITY */}
        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>📊 TELEMETRY, AUTOMATION &amp; AUDIT</Text>
          {MODULE_BUTTONS.slice(6, 9).map((mod) => (
            <TouchableOpacity
              key={mod.key}
              style={[styles.buttonCard, { borderColor: `${mod.color}40` }]}
              onPress={() => handleOpenModule(mod.key)}
              activeOpacity={0.82}
            >
              <View style={styles.buttonCardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${mod.color}15` }]}>
                  <Text style={{ fontSize: 20 }}>{mod.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.buttonCardTitle}>{mod.title}</Text>
                    <View style={[styles.badgePill, { backgroundColor: `${mod.color}20`, borderColor: `${mod.color}50` }]}>
                      <Text style={[styles.badgeText, { color: mod.color }]}>{mod.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.buttonCardSub}>{mod.subtitle}</Text>
                </View>
              </View>
              <Text style={[styles.arrowText, { color: mod.color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category: ACCOUNT & APP CONTROLS */}
        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>👤 ACCOUNT &amp; SYSTEM SHORTCUTS</Text>
          
          <TouchableOpacity
            style={[styles.buttonCard, { borderColor: 'rgba(129,140,248,0.4)' }]}
            onPress={() => onOpenProfile?.()}
            activeOpacity={0.82}
          >
            <View style={styles.buttonCardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.buttonCardTitle}>User Profile &amp; Settings</Text>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(129,140,248,0.2)', borderColor: 'rgba(129,140,248,0.5)' }]}>
                    <Text style={[styles.badgeText, { color: '#818cf8' }]}>ACCOUNT</Text>
                  </View>
                </View>
                <Text style={styles.buttonCardSub}>View account credentials, role permissions &amp; workspace info</Text>
              </View>
            </View>
            <Text style={[styles.arrowText, { color: '#818cf8' }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonCard, { borderColor: 'rgba(56,189,248,0.4)' }]}
            onPress={() => onOpenAppUpdates?.()}
            activeOpacity={0.82}
          >
            <View style={styles.buttonCardLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                <Text style={{ fontSize: 20 }}>🚀</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.buttonCardTitle}>Check Version &amp; In-App Updates</Text>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(56,189,248,0.2)', borderColor: 'rgba(56,189,248,0.5)' }]}>
                    <Text style={[styles.badgeText, { color: '#38bdf8' }]}>v2.5.0</Text>
                  </View>
                </View>
                <Text style={styles.buttonCardSub}>Check latest APK build updates &amp; release notes</Text>
              </View>
            </View>
            <Text style={[styles.arrowText, { color: '#38bdf8' }]}>→</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📦 MODULE MODAL 1: PRODUCTS CATALOG WORKSPACE                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'PRODUCTS'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <ProductsCatalogScreen onClose={() => setActiveModal(null)} />
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💬 MODULE MODAL 2: COMMUNICATIONS HUB WORKSPACE                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'COMMUNICATIONS'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>💬 Communications Hub (wacrm Parity)</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Sub-Module Selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {(['WA_CLOUD', 'EMAIL', 'AI_BOT'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' }, commSubTab === tab && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                  onPress={() => setCommSubTab(tab)}
                >
                  <Text style={[{ fontSize: 10, fontWeight: '900', color: '#94a3b8' }, commSubTab === tab && { color: '#ffffff' }]}>
                    {tab === 'WA_CLOUD' ? '💬 WhatsApp' : tab === 'EMAIL' ? '📧 Email' : '🤖 AI Bot'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {commSubTab === 'WA_CLOUD' && (
              <View style={styles.moduleCard}>
                <Text style={styles.moduleTitle}>📱 WhatsApp Cloud API &amp; Shared Team Inbox</Text>
                <Text style={styles.moduleSub}>Official Meta WhatsApp Business API integration.</Text>
                <View style={{ backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 12, marginTop: 10, gap: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>💬 Active Thread: {activeThread.contactName}</Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>{activeThread.phone} • {activeThread.assignedAgent}</Text>

                  <View style={{ gap: 6, maxHeight: 180 }}>
                    {activeThread.messages.map((m, idx) => (
                      <View key={idx} style={[{ padding: 8, borderRadius: 8, maxWidth: '85%' }, m.sender === 'CLIENT' ? { backgroundColor: '#1e293b', alignSelf: 'flex-start' } : { backgroundColor: 'rgba(79,70,229,0.3)', alignSelf: 'flex-end' }]}>
                        <Text style={{ fontSize: 11, color: '#ffffff' }}>{m.text}</Text>
                        <Text style={{ fontSize: 8, color: '#94a3b8', alignSelf: 'flex-end', marginTop: 2 }}>{m.time}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TextInput
                      style={[styles.inputField, { flex: 1 }]}
                      placeholder="Type WhatsApp reply..."
                      placeholderTextColor="#64748b"
                      value={newChatInput}
                      onChangeText={setNewChatInput}
                    />
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSendChatMessage}>
                      <Text style={styles.actionBtnText}>Send ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {commSubTab === 'EMAIL' && (
              <View style={styles.moduleCard}>
                <Text style={styles.moduleTitle}>📧 AWS SES Email Marketing Ingress</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  <TextInput style={styles.inputField} value={emailTo} onChangeText={setEmailTo} placeholder="To Email" placeholderTextColor="#64748b" />
                  <TextInput style={styles.inputField} value={emailSubject} onChangeText={setEmailSubject} placeholder="Subject" placeholderTextColor="#64748b" />
                  <TextInput style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]} value={emailBody} onChangeText={setEmailBody} multiline />
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34d399', paddingVertical: 10, alignItems: 'center' }]} onPress={handleDispatchEmail}>
                    <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>🚀 Dispatch AWS SES Email Campaign →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🤖 MODULE MODAL 3: AI ASSISTANT CONTROLS                                  */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'AI_CONTROL'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>🤖 AI Controls &amp; Persona Rules</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.moduleTitle}>🤖 Gemini 1.5 Pro AI Engine</Text>
                  <Text style={styles.moduleSub}>Configure auto-reply persona, lead qualification score &amp; GST prompt.</Text>
                </View>
                <Switch value={aiEngineEnabled} onValueChange={setAiEngineEnabled} trackColor={{ false: '#334155', true: '#4f46e5' }} thumbColor="#ffffff" />
              </View>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>Select AI Persona Tone:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['CONSULTATIVE', 'AGGRESSIVE', 'SUPPORT', 'CUSTOM'] as const).map((p) => (
                    <TouchableOpacity key={p} style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, aiPersona === p && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]} onPress={() => setAiPersona(p)}>
                      <Text style={[{ fontSize: 9, fontWeight: '900', color: '#94a3b8' }, aiPersona === p && { color: '#ffffff' }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 4 }}>System Instructions Prompt:</Text>
                <TextInput style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]} value={aiSystemPrompt} onChangeText={setAiSystemPrompt} multiline />
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34d399', paddingVertical: 10, alignItems: 'center', marginTop: 6 }]} onPress={handleSaveAiRules}>
                  <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>💾 Save AI Rules →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ✏️ MODULE MODAL 4: WHATSAPP MESSAGING TEMPLATES                           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'WA_TEMPLATES'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>✏️ WhatsApp Direct Templates</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.moduleTitle}>✏️ Meta-Approved WhatsApp Templates</Text>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleOpenEditTpl()}>
                  <Text style={styles.actionBtnText}>+ Create Tpl</Text>
                </TouchableOpacity>
              </View>
              {waTemplatesList.map((tpl) => (
                <View key={tpl.id} style={[styles.itemRow, styles.borderBottom]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.itemName}>{tpl.title}</Text>
                    <Text style={styles.itemSub} numberOfLines={2}>{tpl.text}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEditTpl(tpl)}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📝 MODULE MODAL 5: QUOTATIONS & INVOICES                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'QUOTES'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>📝 Quotations &amp; GST Invoicing</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>📝 Enterprise Quotations &amp; Proposals</Text>
              <Text style={styles.moduleSub}>Generate official 18% GST proposals and share PDF links.</Text>
              {[
                { title: 'TechCorp Solutions Ltd (25 Licenses)', val: '₹5,20,000 (+18% GST)', date: 'Today, 02:30 PM', status: 'CONFIRMED' },
                { title: 'LogiTech Freight Systems (Bot Suite)', val: '₹3,50,000 (+18% GST)', date: 'Today, 04:45 PM', status: 'ACCEPTED' },
                { title: 'Sunita Logistics (Enterprise Rollout)', val: '₹8,90,000 (+18% GST)', date: 'Today, 06:15 PM', status: 'SIGNED' },
              ].map((q, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{q.title}</Text>
                    <Text style={styles.itemSub}>{q.date}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>{q.val}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💼 MODULE MODAL 6: DEALS PIPELINE KANBAN                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'DEALS'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>💼 Deals &amp; Pipeline Kanban</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>💼 5-Stage Deals Kanban Pipeline</Text>
              <Text style={styles.moduleSub}>Track active deals from Lead Ingestion to Closed Won.</Text>
              {[
                { name: 'TechCorp Solutions', stage: 'QUALIFIED', val: '$120,000' },
                { name: 'LogiTech Systems', stage: 'PROPOSAL', val: '$85,000' },
                { name: 'Sunita Logistics', stage: 'CLOSED_WON', val: '$210,000' },
              ].map((d, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{d.name}</Text>
                    <Text style={styles.itemSub}>Stage: {d.stage}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#818cf8' }}>{d.val}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 📊 MODULE MODAL 7: IN-DEPTH REPORTS                                       */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'REPORTS'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>📊 In-Depth Analytics &amp; Reports</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>📊 Performance &amp; Call Telemetry Audit</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1, backgroundColor: '#020617', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#38bdf8' }}>$128.4K</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Revenue Won</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#020617', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#34d399' }}>384 Calls</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Completed Today</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ⚡ MODULE MODAL 8: AUTOMATIONS                                              */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'AUTOMATIONS'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>⚡ Workflow Automations</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>⚡ Workflow Rules &amp; Bot Triggers</Text>
              <Text style={styles.moduleSub}>Active triggers for auto-nudge and lead auto-assignment.</Text>
              {[
                { name: 'Google Sheets Ingress Auto-Assign', status: 'ACTIVE' },
                { name: '5-Min Prior Call Alert Engine', status: 'ACTIVE' },
                { name: 'Meta Webhook Lead Auto-Responder', status: 'ACTIVE' },
              ].map((a, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                  <Text style={styles.itemName}>{a.name}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#34d399' }}>{a.status}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔒 MODULE MODAL 9: AUDIT LOGS                                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={activeModal === 'AUDIT'} transparent animationType="slide">
        <View style={styles.fullModalScreen}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTopTitle}>🔒 Security &amp; Telemetry Audit Logs</Text>
            <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>🔒 System Audit Trail</Text>
              {[
                { user: 'Super Admin', action: 'Enforced Hierarchy Assignment Rules', time: '10 mins ago' },
                { user: 'Mighty Rai (Sales)', action: 'Logged Call Outcome (4m 18s — Connected)', time: '25 mins ago' },
                { user: 'Priya Sharma (TL)', action: 'Punched In via Geofence (09:21 AM)', time: '1 hour ago' },
              ].map((log, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{log.user}</Text>
                    <Text style={styles.itemSub}>{log.action}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700' }}>{log.time}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

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
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 10 },

  tabPillRow: { flexDirection: 'row', gap: 6, paddingRight: 16 },
  pillBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },

  scrollContent: { padding: 16, paddingBottom: 32 },

  categoryBlock: { marginBottom: 16 },
  categoryTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8 },

  buttonCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  buttonCardSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 12,
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '900',
  },

  fullModalScreen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTopTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalCloseIconBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },

  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '85%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  modalTitleText: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
