/**
 * AIHubScreen.tsx — DAS CRM Android
 * AI Customization Hub with subsections:
 * - Lead Scoring
 * - Chat & Instructions
 * - Response Templates
 * - Auto-Automation
 * - Analytics & Learning
 *
 * Features: Humanize button, Language selector (English/Hindi/Hinglish)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AIScoreCustomizationCard } from '../components/AIScoreComponents';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

type Subsection = 'hub' | 'lead-scoring' | 'chat-instructions' | 'templates' | 'automation' | 'analytics';
type Language = 'en' | 'hi' | 'hinglish';

// Labels for all languages
const LABELS = {
  en: {
    title: 'AI Customization',
    subtitle: 'Configure your AI assistant behavior and automation',
    leadScoring: 'Lead Scoring',
    leadScoringDesc: 'Configure AI lead scoring weights, tiers & thresholds',
    chatInstructions: 'Chat & Instructions',
    chatInstructionsDesc: 'System prompts, persona & response behavior rules',
    templates: 'Response Templates',
    templatesDesc: 'Pre-built templates for common lead queries',
    automation: 'Auto-Automation',
    automationDesc: 'AI nudges, auto-replies & follow-up triggers',
    analytics: 'Analytics & Learning',
    analyticsDesc: 'AI performance metrics & learning preferences',
    english: 'English',
    hindi: 'Hindi',
    hinglish: 'Hinglish',
    back: '← Back to AI Hub',
    save: '💾 Save',
    saving: 'Saving...',
    saved: '✓ Saved!',
    salesPersona: 'AI Sales Persona',
    consultative: 'Consultative',
    consultativeDesc: 'Professional & helpful approach',
    aggressive: 'Aggressive',
    aggressiveDesc: 'Bold, persuasive sales style',
    support: 'Support',
    supportDesc: 'Helpful & patient assistance',
    custom: 'Custom',
    customDesc: 'Use your own instructions',
    systemInstructions: 'System Instructions',
    responseSettings: 'Response Settings',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
    precise: 'Precise',
    creative: 'Creative',
    includeCatalog: 'Include Product Catalog',
    autoGst: 'Auto-Calculate 18% GST',
    humanize: 'Humanize Responses',
    humanizeDesc: 'More natural conversation style',
    pricingQuery: 'Pricing Query',
    demoRequest: 'Demo Request',
    followUp: 'Follow-up',
    supportTemplate: 'Support',
    edit: 'Edit',
    cancel: 'Cancel',
    autoNudge: 'Auto-Nudge',
    autoNudgeDesc: 'Nudge after inactivity',
    nudgeDelay: 'Nudge Delay (minutes)',
    autoReply: 'Auto-Reply',
    autoReplyDesc: 'Send welcome message on first contact',
    hotLeadAlert: 'Hot Lead Alerts',
    hotLeadAlertDesc: 'Alert on HOT tier leads',
    followUpSchedule: 'Auto Follow-up Schedule',
    everyDay: 'Every day',
    every3Days: 'Every 3 days',
    everyWeek: 'Every week',
    every2Weeks: 'Every 2 weeks',
    totalInteractions: 'Total Interactions',
    accuracyRate: 'Accuracy Rate',
    avgResponse: 'Avg Response Time',
    conversionRate: 'Conversion Rate',
    weeklyPerformance: 'Weekly Performance',
    learningMode: 'AI Learning Mode',
    learningModeDesc: 'Improve over time',
    feedbackTracking: 'Track Feedback',
    feedbackTrackingDesc: 'Thumbs up/down',
    mostUsedTemplate: 'Most Used Template',
  },
  hi: {
    title: 'AI कस्टमाइज़ेशन',
    subtitle: 'AI असिस्टेंट का व्यवहार और ऑटोमेशन सेटअप करें',
    leadScoring: 'लीड स्कोरिंग',
    leadScoringDesc: 'AI लीड स्कोरिंग वेट, टायर और थ्रेशोल्ड',
    chatInstructions: 'चैट और निर्देश',
    chatInstructionsDesc: 'सिस्टम प्रॉम्प्ट, पर्सोना और रिस्पॉन्स व्यवहार',
    templates: 'रिस्पॉन्स टेम्पलेट्स',
    templatesDesc: 'सामान्य लीड प्रश्नों के लिए टेम्पलेट्स',
    automation: 'ऑटो-ऑटोमेशन',
    automationDesc: 'AI नज़र, ऑटो-रिप्लाई और फॉलो-अप',
    analytics: 'एनालिटिक्स और लर्निंग',
    analyticsDesc: 'AI परफॉर्मेंस मेट्रिक्स',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    hinglish: 'हिंग्लिश',
    back: '← AI हब पर वापस',
    save: '💾 सेव करें',
    saving: 'सेव हो रहा है...',
    saved: '✓ सेव हो गया!',
    salesPersona: 'AI सेल्स पर्सोना',
    consultative: 'सलाहकार',
    consultativeDesc: 'पेशेवर और मददगार',
    aggressive: 'आक्रामक',
    aggressiveDesc: 'बोल्ड, प्रेरक शैली',
    support: 'सहायता',
    supportDesc: 'मददगार और धैर्यवान',
    custom: 'कस्टम',
    customDesc: 'अपने निर्देश उपयोग करें',
    systemInstructions: 'सिस्टम निर्देश',
    responseSettings: 'रिस्पॉन्स सेटिंग्स',
    temperature: 'टेम्परेचर',
    maxTokens: 'मैक्स टोकन',
    precise: 'सटीक',
    creative: 'क्रिएटिव',
    includeCatalog: 'प्रोडक्ट कैटलॉग शामिल करें',
    autoGst: '18% GST ऑटो-कैलकुलेट',
    humanize: 'ह्यूमनाइज़ रिस्पॉन्स',
    humanizeDesc: 'अधिक प्राकृतिक बातचीत',
    pricingQuery: 'मूल्य पूछताछ',
    demoRequest: 'डेमो अनुरोध',
    followUp: 'फॉलो-अप',
    supportTemplate: 'सहायता',
    edit: 'संपादित करें',
    cancel: 'रद्द करें',
    autoNudge: 'ऑटो-नज़र',
    autoNudgeDesc: 'निष्क्रियता के बाद नज़र',
    nudgeDelay: 'नज़र विलंब (मिनट)',
    autoReply: 'ऑटो-रिप्लाई',
    autoReplyDesc: 'पहले संपर्क पर स्वागत संदेश',
    hotLeadAlert: 'हॉट लीड अलर्ट',
    hotLeadAlertDesc: 'हॉट टायर पर अलर्ट',
    followUpSchedule: 'ऑटो फॉलो-अप शेड्यूल',
    everyDay: 'हर दिन',
    every3Days: 'हर 3 दिन',
    everyWeek: 'हर हफ्ते',
    every2Weeks: 'हर 2 हफ्ते',
    totalInteractions: 'कुल इंटरैक्शन',
    accuracyRate: 'सटीकता दर',
    avgResponse: 'औसत रिस्पॉन्स',
    conversionRate: 'रूपांतरण दर',
    weeklyPerformance: 'साप्ताहिक प्रदर्शन',
    learningMode: 'AI लर्निंग मोड',
    learningModeDesc: 'समय के साथ सुधारें',
    feedbackTracking: 'फीडबैक ट्रैक करें',
    feedbackTrackingDesc: 'थंब्स अप/डाउन',
    mostUsedTemplate: 'सबसे अधिक उपयोग',
  },
  hinglish: {
    title: 'AI Customization',
    subtitle: 'AI assistant ka behavior aur automation setup karo',
    leadScoring: 'Lead Scoring',
    leadScoringDesc: 'AI lead scoring weights, tiers aur thresholds',
    chatInstructions: 'Chat Instructions',
    chatInstructionsDesc: 'System prompts, persona aur response behavior',
    templates: 'Response Templates',
    templatesDesc: 'Common lead queries ke liye templates',
    automation: 'Auto-Automation',
    automationDesc: 'AI nudges, auto-replies aur follow-up',
    analytics: 'Analytics & Learning',
    analyticsDesc: 'AI performance metrics',
    english: 'English',
    hindi: 'Hindi',
    hinglish: 'Hinglish',
    back: '← AI Hub pe wapas',
    save: '💾 Save karo',
    saving: 'Saving...',
    saved: '✓ Ho gaya!',
    salesPersona: 'AI Sales Persona',
    consultative: 'Consultative',
    consultativeDesc: 'Professional & helpful',
    aggressive: 'Aggressive',
    aggressiveDesc: 'Bold, persuasive style',
    support: 'Support',
    supportDesc: 'Helpful & patient',
    custom: 'Custom',
    customDesc: 'Apne instructions use karo',
    systemInstructions: 'System Instructions',
    responseSettings: 'Response Settings',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
    precise: 'Precise',
    creative: 'Creative',
    includeCatalog: 'Product Catalog include karo',
    autoGst: '18% GST Auto-Calculate',
    humanize: 'Humanize Responses',
    humanizeDesc: 'Natural conversation style',
    pricingQuery: 'Pricing Query',
    demoRequest: 'Demo Request',
    followUp: 'Follow-up',
    supportTemplate: 'Support',
    edit: 'Edit karo',
    cancel: 'Cancel',
    autoNudge: 'Auto-Nudge',
    autoNudgeDesc: 'Inactivity ke baad nudge',
    nudgeDelay: 'Nudge Delay (minutes)',
    autoReply: 'Auto-Reply',
    autoReplyDesc: 'First contact pe welcome message',
    hotLeadAlert: 'Hot Lead Alerts',
    hotLeadAlertDesc: 'HOT tier pe alert',
    followUpSchedule: 'Auto Follow-up Schedule',
    everyDay: 'Har din',
    every3Days: 'Har 3 din',
    everyWeek: 'Har hafte',
    every2Weeks: 'Har 2 hafte',
    totalInteractions: 'Total Interactions',
    accuracyRate: 'Accuracy Rate',
    avgResponse: 'Avg Response',
    conversionRate: 'Conversion Rate',
    weeklyPerformance: 'Weekly Performance',
    learningMode: 'AI Learning Mode',
    learningModeDesc: 'Time ke saath improve karo',
    feedbackTracking: 'Feedback Track karo',
    feedbackTrackingDesc: 'Thumbs up/down',
    mostUsedTemplate: 'Most Used Template',
  },
};

export function AIHubScreen() {
  const [activeSubsection, setActiveSubsection] = useState<Subsection>('hub');
  const [language, setLanguage] = useState<Language>('en');
  const { token } = useAuthStore();
  const [tokenStr, setTokenStr] = useState<string>('');

  useEffect(() => {
    if (token) setTokenStr(token);
  }, [token]);

  const t = LABELS[language];

  const menuItems = [
    { id: 'lead-scoring' as Subsection, icon: '⚖️', color: '#8b5cf6', label: t.leadScoring, description: t.leadScoringDesc },
    { id: 'chat-instructions' as Subsection, icon: '💬', color: '#ec4899', label: t.chatInstructions, description: t.chatInstructionsDesc },
    { id: 'templates' as Subsection, icon: '📋', color: '#f59e0b', label: t.templates, description: t.templatesDesc },
    { id: 'automation' as Subsection, icon: '⚡', color: '#22c55e', label: t.automation, description: t.automationDesc },
    { id: 'analytics' as Subsection, icon: '📊', color: '#3b82f6', label: t.analytics, description: t.analyticsDesc },
  ];

  const renderHub = () => (
    <View style={styles.hubContainer}>
      {/* Header with Language Selector */}
      <View style={styles.hubHeader}>
        <View style={styles.hubTitleRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🤖</Text>
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.hubTitle}>{t.title}</Text>
            <Text style={styles.hubSubtitle}>{t.subtitle}</Text>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          <Text style={styles.langLabel}>🌐</Text>
          {(['en', 'hi', 'hinglish'] as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langBtn, language === lang && styles.langBtnActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                {t[lang === 'en' ? 'english' : lang === 'hi' ? 'hindi' : 'hinglish']}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuCard, { borderColor: `${item.color}40` }]}
            onPress={() => setActiveSubsection(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: `${item.color}20`, borderColor: `${item.color}50` }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity style={styles.backBtn} onPress={() => setActiveSubsection('hub')}>
      <Text style={styles.backBtnText}>{t.back}</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeSubsection) {
      case 'hub':
        return renderHub();
      case 'lead-scoring':
        return <LeadScoringSubsection t={t} tokenStr={tokenStr} />;
      case 'chat-instructions':
        return <ChatInstructionsSubsection t={t} />;
      case 'templates':
        return <TemplatesSubsection t={t} />;
      case 'automation':
        return <AutomationSubsection t={t} />;
      case 'analytics':
        return <AnalyticsSubsection t={t} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {activeSubsection !== 'hub' && renderBackButton()}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// LEAD SCORING SUBSECTION
// ─────────────────────────────────────────────────────────────
function LeadScoringSubsection({ t, tokenStr }: { t: typeof LABELS.en; tokenStr: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scoreDistribution, setScoreDistribution] = useState({ hot: 0, warm: 0, cold: 0, low: 0, total: 0 });

  const DEFAULT_CONFIG = {
    budgetWeight: 20,
    intentWeight: 25,
    engagementWeight: 20,
    productFitWeight: 20,
    responseWeight: 15,
    hotThresholdMin: 9,
    warmThresholdMin: 7,
    coldThresholdMin: 4,
    showOnLeadsTable: true,
    showBreakdownDetail: true,
    autoRecalculate: true,
  };

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!tokenStr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [configData, summaryData] = await Promise.all([
        apiService.getAIScoreConfig(tokenStr),
        apiService.getAIScoreSummary(tokenStr),
      ]);
      if (configData) setConfig(configData);
      if (summaryData?.distribution) setScoreDistribution(summaryData.distribution);
    } catch (err) {
      console.error('Failed to load AI score data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateAIScoreConfig(tokenStr, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to save AI score settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818cf8" />
        <Text style={styles.loadingText}>Loading AI Score Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.subsectionContainer}>
      {/* Header */}
      <View style={styles.subsectionHeader}>
        <View style={[styles.subsectionIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <Text style={styles.subsectionIcon}>⚖️</Text>
        </View>
        <View>
          <Text style={styles.subsectionTitle}>{t.leadScoring}</Text>
          <Text style={styles.subsectionDesc}>{t.leadScoringDesc}</Text>
        </View>
      </View>

      {/* Score Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Lead Score Distribution</Text>
        <Text style={styles.cardSub}>{scoreDistribution.total} total leads scored</Text>

        {[
          { key: 'hot' as const, label: '🔥 Hot', color: '#ef4444', count: scoreDistribution.hot },
          { key: 'warm' as const, label: '🟢 Warm', color: '#22c55e', count: scoreDistribution.warm },
          { key: 'cold' as const, label: '🟡 Cold', color: '#eab308', count: scoreDistribution.cold },
          { key: 'low' as const, label: '⚪ Low', color: '#94a3b8', count: scoreDistribution.low },
        ].map(({ key, label, color, count }) => {
          const percentage = scoreDistribution.total > 0 ? (count / scoreDistribution.total) * 100 : 0;
          return (
            <View key={key} style={styles.distRow}>
              <Text style={[styles.distLabel, { color }]}>{label}</Text>
              <View style={styles.distBar}>
                <View style={[styles.distBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.distCount, { color }]}>{count} ({percentage.toFixed(0)}%)</Text>
            </View>
          );
        })}
      </View>

      <AIScoreCustomizationCard
        config={config}
        onConfigChange={handleConfigChange}
        onSave={handleSave}
        saving={saving}
        saved={saved}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT INSTRUCTIONS SUBSECTION
// ─────────────────────────────────────────────────────────────
function ChatInstructionsSubsection({ t }: { t: typeof LABELS.en }) {
  const [persona, setPersona] = useState<'CONSULTATIVE' | 'AGGRESSIVE' | 'SUPPORT' | 'CUSTOM'>('CONSULTATIVE');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Antigravity AI, a top 1% consultative sales executive for DAS CRM Enterprise Suite. Speak politely, highlight 18% GST tax breakdown, and answer questions accurately.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [includeCatalog, setIncludeCatalog] = useState(true);
  const [gstCalc, setGstCalc] = useState(true);
  const [humanize, setHumanize] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const personas = [
    { key: 'CONSULTATIVE' as const, label: t.consultative, desc: t.consultativeDesc },
    { key: 'AGGRESSIVE' as const, label: t.aggressive, desc: t.aggressiveDesc },
    { key: 'SUPPORT' as const, label: t.support, desc: t.supportDesc },
    { key: 'CUSTOM' as const, label: t.custom, desc: t.customDesc },
  ];

  return (
    <View style={styles.subsectionContainer}>
      {/* Header */}
      <View style={styles.subsectionHeader}>
        <View style={[styles.subsectionIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
          <Text style={styles.subsectionIcon}>💬</Text>
        </View>
        <View>
          <Text style={styles.subsectionTitle}>{t.chatInstructions}</Text>
          <Text style={styles.subsectionDesc}>{t.chatInstructionsDesc}</Text>
        </View>
      </View>

      {/* Persona Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.salesPersona}</Text>
        <View style={styles.personaGrid}>
          {personas.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.personaBtn, persona === p.key && styles.personaBtnActive]}
              onPress={() => setPersona(p.key)}
            >
              <Text style={[styles.personaLabel, persona === p.key && styles.personaLabelActive]}>{p.label}</Text>
              <Text style={styles.personaDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* System Prompt */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.systemInstructions}</Text>
        <TextInput
          style={styles.promptInput}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline
          placeholder="Enter custom AI instructions..."
          placeholderTextColor="#64748b"
        />
        <Text style={styles.charCount}>{systemPrompt.length} / 2000 characters</Text>
      </View>

      {/* Response Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.responseSettings}</Text>

        {/* Temperature Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>{t.temperature}: {temperature.toFixed(1)}</Text>
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>{t.precise}</Text>
              <Text style={styles.sliderRangeText}>{t.creative}</Text>
            </View>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${temperature * 100}%` }]} />
          </View>
        </View>

        {/* Max Tokens Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>{t.maxTokens}: {maxTokens}</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(maxTokens / 2048) * 100}%`, backgroundColor: '#ec4899' }]} />
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t.includeCatalog}</Text>
          <Switch
            value={includeCatalog}
            onValueChange={setIncludeCatalog}
            trackColor={{ false: '#334155', true: '#4f46e5' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t.autoGst}</Text>
          <Switch
            value={gstCalc}
            onValueChange={setGstCalc}
            trackColor={{ false: '#334155', true: '#4f46e5' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Humanize Toggle */}
        <View style={[styles.toggleRow, styles.humanizeRow]}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.humanize}</Text>
            <Text style={styles.toggleDesc}>{t.humanizeDesc}</Text>
          </View>
          <TouchableOpacity
            style={[styles.humanizeBtn, humanize && styles.humanizeBtnActive]}
            onPress={() => setHumanize(!humanize)}
          >
            <Text style={[styles.humanizeBtnText, humanize && styles.humanizeBtnTextActive]}>
              {humanize ? '🧑‍💻 Human' : '🤖 Bot'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saved ? '✓ ' + t.saved : saving ? t.saving : t.save}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES SUBSECTION
// ─────────────────────────────────────────────────────────────
function TemplatesSubsection({ t }: { t: typeof LABELS.en }) {
  const [templates, setTemplates] = useState([
    { id: 1, category: 'pricing', label: t.pricingQuery, content: 'Thank you for your interest! For {product_name}, the pricing starts at ₹{price} + 18% GST. Would you like a detailed proposal?' },
    { id: 2, category: 'demo', label: t.demoRequest, content: 'I\'d be happy to schedule a personalized demo for you. Our team will reach out within 24 hours.' },
    { id: 3, category: 'followup', label: t.followUp, content: 'Just checking in! Have you had a chance to review the proposal I shared? I\'m here to answer any questions.' },
    { id: 4, category: 'support', label: t.supportTemplate, content: 'Thank you for reaching out! Our support team is here to help. Please share more details.' },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const categoryColors: Record<string, string> = {
    pricing: '#8b5cf6',
    demo: '#3b82f6',
    followup: '#22c55e',
    support: '#f59e0b',
  };

  return (
    <View style={styles.subsectionContainer}>
      {/* Header */}
      <View style={styles.subsectionHeader}>
        <View style={[styles.subsectionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
          <Text style={styles.subsectionIcon}>📋</Text>
        </View>
        <View>
          <Text style={styles.subsectionTitle}>{t.templates}</Text>
          <Text style={styles.subsectionDesc}>{t.templatesDesc}</Text>
        </View>
      </View>

      {/* Templates List */}
      {templates.map((template) => (
        <View key={template.id} style={styles.card}>
          <View style={styles.templateHeader}>
            <View style={[styles.templateDot, { backgroundColor: categoryColors[template.category] }]} />
            <Text style={styles.templateLabel}>{template.label}</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditingId(template.id);
                setEditContent(template.content);
              }}
            >
              <Text style={styles.editBtnText}>{t.edit}</Text>
            </TouchableOpacity>
          </View>

          {editingId === template.id ? (
            <>
              <TextInput
                style={styles.templateInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
              />
              <View style={styles.templateActions}>
                <TouchableOpacity onPress={() => setEditingId(null)}>
                  <Text style={styles.cancelBtn}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.templateSaveBtn}
                  onPress={() => {
                    setTemplates(templates.map(tmpl => tmpl.id === template.id ? { ...tmpl, content: editContent } : tmpl));
                    setEditingId(null);
                  }}
                >
                  <Text style={styles.templateSaveBtnText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.templateContent}>{template.content}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTOMATION SUBSECTION
// ─────────────────────────────────────────────────────────────
function AutomationSubsection({ t }: { t: typeof LABELS.en }) {
  const [autoNudge, setAutoNudge] = useState(true);
  const [nudgeDelay, setNudgeDelay] = useState(15);
  const [autoReply, setAutoReply] = useState(true);
  const [hotLeadAlert, setHotLeadAlert] = useState(true);
  const [followUpSchedule, setFollowUpSchedule] = useState('3days');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('✅', 'Automation rules saved!');
    }, 800);
  };

  return (
    <View style={styles.subsectionContainer}>
      {/* Header */}
      <View style={styles.subsectionHeader}>
        <View style={[styles.subsectionIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
          <Text style={styles.subsectionIcon}>⚡</Text>
        </View>
        <View>
          <Text style={styles.subsectionTitle}>{t.automation}</Text>
          <Text style={styles.subsectionDesc}>{t.automationDesc}</Text>
        </View>
      </View>

      {/* Auto-Nudge */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.autoNudge}</Text>
            <Text style={styles.toggleDesc}>{t.autoNudgeDesc}</Text>
          </View>
          <Switch
            value={autoNudge}
            onValueChange={setAutoNudge}
            trackColor={{ false: '#334155', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
        {autoNudge && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>{t.nudgeDelay}: {nudgeDelay}</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(nudgeDelay / 60) * 100}%`, backgroundColor: '#22c55e' }]} />
            </View>
          </View>
        )}
      </View>

      {/* Auto-Reply */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.autoReply}</Text>
            <Text style={styles.toggleDesc}>{t.autoReplyDesc}</Text>
          </View>
          <Switch
            value={autoReply}
            onValueChange={setAutoReply}
            trackColor={{ false: '#334155', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Hot Lead Alert */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.hotLeadAlert}</Text>
            <Text style={styles.toggleDesc}>{t.hotLeadAlertDesc}</Text>
          </View>
          <Switch
            value={hotLeadAlert}
            onValueChange={setHotLeadAlert}
            trackColor={{ false: '#334155', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Follow-up Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.followUpSchedule}</Text>
        <View style={styles.scheduleOptions}>
          {[
            { key: '1day', label: t.everyDay },
            { key: '3days', label: t.every3Days },
            { key: '7days', label: t.everyWeek },
            { key: '14days', label: t.every2Weeks },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.scheduleBtn, followUpSchedule === option.key && styles.scheduleBtnActive]}
              onPress={() => setFollowUpSchedule(option.key)}
            >
              <Text style={[styles.scheduleBtnText, followUpSchedule === option.key && styles.scheduleBtnTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? t.saving : '💾 ' + t.save}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS SUBSECTION
// ─────────────────────────────────────────────────────────────
function AnalyticsSubsection({ t }: { t: typeof LABELS.en }) {
  const [learningMode, setLearningMode] = useState(true);
  const [feedbackTracking, setFeedbackTracking] = useState(true);

  const stats = {
    totalInteractions: 1247,
    successfulResponses: 1089,
    accuracyRate: 87,
    avgResponseTime: '1.2s',
    topTemplate: t.pricingQuery,
    conversionRate: 23,
  };

  return (
    <View style={styles.subsectionContainer}>
      {/* Header */}
      <View style={styles.subsectionHeader}>
        <View style={[styles.subsectionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <Text style={styles.subsectionIcon}>📊</Text>
        </View>
        <View>
          <Text style={styles.subsectionTitle}>{t.analytics}</Text>
          <Text style={styles.subsectionDesc}>{t.analyticsDesc}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: t.totalInteractions, value: stats.totalInteractions.toLocaleString(), color: '#3b82f6' },
          { label: t.accuracyRate, value: `${stats.accuracyRate}%`, color: '#22c55e' },
          { label: t.avgResponse, value: stats.avgResponseTime, color: '#f59e0b' },
          { label: t.conversionRate, value: `${stats.conversionRate}%`, color: '#ec4899' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, { borderColor: `${stat.color}40` }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Weekly Performance Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.weeklyPerformance}</Text>
        <View style={styles.chartContainer}>
          {[65, 78, 82, 75, 88, 92, 85].map((value, i) => (
            <View key={i} style={styles.chartBar}>
              <View style={[styles.chartBarFill, { height: `${value}%`, backgroundColor: '#3b82f6' }]} />
              <Text style={styles.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Learning Settings */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.learningMode}</Text>
            <Text style={styles.toggleDesc}>{t.learningModeDesc}</Text>
          </View>
          <Switch
            value={learningMode}
            onValueChange={setLearningMode}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelContainer}>
            <Text style={styles.toggleLabel}>{t.feedbackTracking}</Text>
            <Text style={styles.toggleDesc}>{t.feedbackTrackingDesc}</Text>
          </View>
          <Switch
            value={feedbackTracking}
            onValueChange={setFeedbackTracking}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Most Used Template */}
      <View style={[styles.card, styles.templateHighlightCard]}>
        <Text style={styles.cardTitle}>{t.mostUsedTemplate}</Text>
        <View style={styles.templateHighlight}>
          <Text style={styles.templateHighlightIcon}>📋</Text>
          <View>
            <Text style={styles.templateHighlightLabel}>{stats.topTemplate}</Text>
            <Text style={styles.templateHighlightCount}>Used 423 times this month</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignSelf: 'flex-start', marginBottom: 16 },
  backBtnText: { color: '#818cf8', fontWeight: '900', fontSize: 12 },

  // Hub Styles
  hubContainer: { flex: 1 },
  hubHeader: { marginBottom: 20 },
  hubTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(99, 102, 241, 0.2)', borderWidth: 2, borderColor: 'rgba(99, 102, 241, 0.4)', justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 24 },
  titleTextContainer: { marginLeft: 12 },
  hubTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  hubSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  languageSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  langLabel: { fontSize: 14, marginRight: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 4 },
  langBtnActive: { backgroundColor: '#4f46e5' },
  langBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  langBtnTextActive: { color: '#ffffff' },

  menuGrid: { gap: 12 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 16, borderWidth: 1 },
  menuIconBox: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIcon: { fontSize: 22 },
  menuTextContainer: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  menuDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  menuArrow: { fontSize: 18, color: '#475569' },

  // Subsection Styles
  subsectionContainer: { flex: 1 },
  subsectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  subsectionIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subsectionIcon: { fontSize: 20 },
  subsectionTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  subsectionDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, marginTop: 12 },

  // Card Styles
  card: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff', marginBottom: 12 },
  cardSub: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },

  // Distribution
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distLabel: { width: 50, fontSize: 11, fontWeight: '700' },
  distBar: { flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginHorizontal: 8 },
  distBarFill: { height: '100%', borderRadius: 3 },
  distCount: { width: 55, fontSize: 10, fontWeight: '800', textAlign: 'right' },

  // Persona
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personaBtn: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  personaBtnActive: { backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: 'rgba(236, 72, 153, 0.5)' },
  personaLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8' },
  personaLabelActive: { color: '#ffffff' },
  personaDesc: { fontSize: 10, color: '#64748b', marginTop: 4 },

  // Prompt Input
  promptInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 12, fontSize: 12, color: '#ffffff', minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: '#64748b', textAlign: 'right', marginTop: 6 },

  // Sliders
  sliderContainer: { marginVertical: 12 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { fontSize: 12, color: '#e2e8f0', fontWeight: '600' },
  sliderRange: { flexDirection: 'row' },
  sliderRangeText: { fontSize: 10, color: '#64748b', marginLeft: 8 },
  sliderTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3 },
  sliderFill: { height: '100%', borderRadius: 3, backgroundColor: '#ec4899' },

  // Toggles
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  toggleLabelContainer: { flex: 1 },
  toggleLabel: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  toggleDesc: { fontSize: 10, color: '#64748b', marginTop: 2 },

  // Humanize Button
  humanizeRow: { borderBottomWidth: 0 },
  humanizeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
  humanizeBtnActive: { backgroundColor: '#22c55e', borderColor: '#4ade80' },
  humanizeBtnText: { fontSize: 12, fontWeight: '900', color: '#94a3b8' },
  humanizeBtnTextActive: { color: '#ffffff' },

  // Templates
  templateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  templateDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  templateLabel: { flex: 1, fontSize: 13, fontWeight: '900', color: '#ffffff' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(99, 102, 241, 0.2)' },
  editBtnText: { fontSize: 10, fontWeight: '700', color: '#818cf8' },
  templateInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10, fontSize: 11, color: '#ffffff', minHeight: 80, textAlignVertical: 'top' },
  templateContent: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  templateActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  templateSaveBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f59e0b' },
  templateSaveBtnText: { fontSize: 12, fontWeight: '900', color: '#000000' },

  // Schedule
  scheduleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scheduleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  scheduleBtnActive: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22c55e' },
  scheduleBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  scheduleBtnTextActive: { color: '#22c55e' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  // Chart
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 },
  chartBar: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBarFill: { width: '80%', borderRadius: 4 },
  chartLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },

  // Template Highlight
  templateHighlightCard: { borderColor: 'rgba(59, 130, 246, 0.3)' },
  templateHighlight: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  templateHighlightIcon: { fontSize: 24, marginRight: 12 },
  templateHighlightLabel: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  templateHighlightCount: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  // Save Button
  saveBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnSuccess: { backgroundColor: '#10b981' },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});

export default AIHubScreen;
