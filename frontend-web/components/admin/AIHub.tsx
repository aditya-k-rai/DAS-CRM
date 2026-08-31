'use client';

import React, { useState } from 'react';
import {
  Brain,
  MessageSquare,
  FileText,
  Zap,
  BarChart3,
  Sliders,
  ChevronRight,
  Globe,
  Languages,
} from 'lucide-react';

type Subsection = 'hub' | 'lead-scoring' | 'chat-instructions' | 'templates' | 'automation' | 'analytics';
type Language = 'en' | 'hi' | 'hinglish';

interface AIHubProps {
  initialSubsection?: Subsection;
}

const LABELS = {
  en: {
    title: 'AI Customization',
    subtitle: 'Configure your AI assistant behavior and automation rules',
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
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    hinglish: 'Hinglish',
  },
  hi: {
    title: 'AI कस्टमाइज़ेशन',
    subtitle: 'अपने AI असिस्टेंट का व्यवहार और ऑटोमेशन नियम कॉन्फ़िगर करें',
    leadScoring: 'लीड स्कोरिंग',
    leadScoringDesc: 'AI लीड स्कोरिंग वेट, टायर और थ्रेशोल्ड कॉन्फ़िगर करें',
    chatInstructions: 'चैट और निर्देश',
    chatInstructionsDesc: 'सिस्टम प्रॉम्प्ट, पर्सोना और रिस्पॉन्स व्यवहार नियम',
    templates: 'रिस्पॉन्स टेम्पलेट्स',
    templatesDesc: 'सामान्य लीड प्रश्नों के लिए पूर्व-निर्मित टेम्पलेट्स',
    automation: 'ऑटो-ऑटोमेशन',
    automationDesc: 'AI नज़र, ऑटो-रिप्लाई और फॉलो-अप ट्रिगर',
    analytics: 'एनालिटिक्स और लर्निंग',
    analyticsDesc: 'AI परफॉर्मेंस मेट्रिक्स और लर्निंग प्राथमिकताएं',
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    hinglish: 'हिंग्लिश',
  },
  hinglish: {
    title: 'AI Customization',
    subtitle: 'Apne AI assistant ka behavior aur automation rules setup karo',
    leadScoring: 'Lead Scoring',
    leadScoringDesc: 'AI lead scoring weights, tiers aur thresholds configure karo',
    chatInstructions: 'Chat Instructions',
    chatInstructionsDesc: 'System prompts, persona aur response behavior rules',
    templates: 'Response Templates',
    templatesDesc: 'Common lead queries ke liye pre-built templates',
    automation: 'Auto-Automation',
    automationDesc: 'AI nudges, auto-replies aur follow-up triggers',
    analytics: 'Analytics & Learning',
    analyticsDesc: 'AI performance metrics aur learning preferences',
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    hinglish: 'Hinglish',
  },
};

export function AIHub({ initialSubsection = 'hub' }: AIHubProps) {
  const [activeSubsection, setActiveSubsection] = useState<Subsection>(initialSubsection);
  const [language, setLanguage] = useState<Language>('en');

  const t = LABELS[language];

  const menuItems = [
    {
      id: 'lead-scoring' as Subsection,
      icon: Sliders,
      color: '#8b5cf6',
      gradient: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30',
      label: t.leadScoring,
      description: t.leadScoringDesc,
      badge: null,
    },
    {
      id: 'chat-instructions' as Subsection,
      icon: MessageSquare,
      color: '#ec4899',
      gradient: 'from-pink-500/20 to-pink-600/20',
      borderColor: 'border-pink-500/30',
      label: t.chatInstructions,
      description: t.chatInstructionsDesc,
      badge: null,
    },
    {
      id: 'templates' as Subsection,
      icon: FileText,
      color: '#f59e0b',
      gradient: 'from-amber-500/20 to-amber-600/20',
      borderColor: 'border-amber-500/30',
      label: t.templates,
      description: t.templatesDesc,
      badge: null,
    },
    {
      id: 'automation' as Subsection,
      icon: Zap,
      color: '#22c55e',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      borderColor: 'border-emerald-500/30',
      label: t.automation,
      description: t.automationDesc,
      badge: null,
    },
    {
      id: 'analytics' as Subsection,
      icon: BarChart3,
      color: '#3b82f6',
      gradient: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/30',
      label: t.analytics,
      description: t.analyticsDesc,
      badge: null,
    },
  ];

  // Dynamic import for subsection components
  const renderSubsection = () => {
    switch (activeSubsection) {
      case 'hub':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  {t.title}
                </h1>
                <p className="text-sm text-muted mt-1">{t.subtitle}</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700">
                <Languages size={16} className="text-slate-400 ml-2" />
                <div className="flex gap-1">
                  {(['en', 'hi', 'hinglish'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        language === lang
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {t[lang === 'en' ? 'english' : lang === 'hi' ? 'hindi' : 'hinglish']}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubsection(item.id)}
                    className={`group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${item.gradient} border ${item.borderColor} hover:scale-[1.02] transition-all duration-200 text-left`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}40` }}
                      >
                        <Icon size={24} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          {item.label}
                          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'lead-scoring':
        return <LeadScoringSection onBack={() => setActiveSubsection('hub')} language={language} t={t} />;
      case 'chat-instructions':
        return <ChatInstructionsSection onBack={() => setActiveSubsection('hub')} language={language} t={t} />;
      case 'templates':
        return <TemplatesSection onBack={() => setActiveSubsection('hub')} language={language} t={t} />;
      case 'automation':
        return <AutomationSection onBack={() => setActiveSubsection('hub')} language={language} t={t} />;
      case 'analytics':
        return <AnalyticsSection onBack={() => setActiveSubsection('hub')} language={language} t={t} />;

      default:
        return null;
    }
  };

  return <div>{renderSubsection()}</div>;
}

// Lead Scoring Section
function LeadScoringSection({ onBack, language, t }: { onBack: () => void; language: Language; t: typeof LABELS.en }) {
  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 transition-colors">
        ← Back to AI Hub
      </button>
      {/* @ts-expect-error dynamic import */}
      <AIScoreCustomization />
    </div>
  );
}

// Chat Instructions Section
function ChatInstructionsSection({ onBack, language, t }: { onBack: () => void; language: Language; t: typeof LABELS.en }) {
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

  const personas = {
    CONSULTATIVE: { label: language === 'en' ? 'Consultative' : language === 'hi' ? 'सलाहकार' : 'Consultative', desc: language === 'en' ? 'Professional & helpful approach' : language === 'hi' ? 'पेशेवर और मददगार दृष्टिकोण' : 'Professional & helpful approach' },
    AGGRESSIVE: { label: language === 'en' ? 'Aggressive' : language === 'hi' ? 'आक्रामक' : 'Aggressive', desc: language === 'en' ? 'Bold, persuasive sales style' : language === 'hi' ? 'बोल्ड, �说服性 बिक्री शैली' : 'Bold, persuasive sales style' },
    SUPPORT: { label: language === 'en' ? 'Support' : language === 'hi' ? 'सहायता' : 'Support', desc: language === 'en' ? 'Helpful & patient assistance' : language === 'hi' ? 'मददगार और धैर्यवान सहायता' : 'Helpful & patient assistance' },
    CUSTOM: { label: language === 'en' ? 'Custom' : language === 'hi' ? 'कस्टम' : 'Custom', desc: language === 'en' ? 'Use your own instructions below' : language === 'hi' ? 'नीचे अपने निर्देश उपयोग करें' : 'Use your own instructions below' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-2 transition-colors">
        ← Back to AI Hub
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">{t.chatInstructions}</h2>
          <p className="text-xs text-muted">{t.chatInstructionsDesc}</p>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'AI Sales Persona' : language === 'hi' ? 'AI सेल्स पर्सोना' : 'AI Sales Persona'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(personas) as Array<keyof typeof personas>).map((key) => (
            <button
              key={key}
              onClick={() => setPersona(key)}
              className={`p-4 rounded-xl border transition-all ${
                persona === key
                  ? 'bg-pink-500/20 border-pink-500/50 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm">{personas[key].label}</div>
              <div className="text-xs mt-1 opacity-70">{personas[key].desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'System Instructions' : language === 'hi' ? 'सिस्टम निर्देश' : 'System Instructions'}</h3>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full h-32 p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-pink-500"
          placeholder={language === 'en' ? 'Enter custom AI instructions...' : 'कस्टम AI निर्देश दर्ज करें...'}
        />
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>{systemPrompt.length} / 2000 characters</span>
          <span>Use {'{lead_name}'}, {'{product_name}'}, {'{price}'} for dynamic content</span>
        </div>
      </div>

      {/* AI Settings */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Response Settings' : language === 'hi' ? 'रिस्पॉन्स सेटिंग्स' : 'Response Settings'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature */}
          <div>
            <label className="text-sm text-slate-300 font-medium">Temperature: {temperature.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 mt-2 rounded-full appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, #ec4899 ${temperature * 100}%, #334155 ${temperature * 100}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{language === 'en' ? 'Precise' : language === 'hi' ? 'सटीक' : 'Precise'}</span>
              <span>{language === 'en' ? 'Creative' : language === 'hi' ? 'क्रिएटिव' : 'Creative'}</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-sm text-slate-300 font-medium">Max Tokens: {maxTokens}</label>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 mt-2 rounded-full appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, #ec4899 ${(maxTokens / 2048) * 100}%, #334155 ${(maxTokens / 2048) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>128</span>
              <span>2048</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 mt-6">
          <ToggleSwitch
            label={language === 'en' ? 'Include Product Catalog in Responses' : language === 'hi' ? 'रिस्पॉन्स में प्रोडक्ट कैटलॉग शामिल करें' : 'Include Product Catalog in Responses'}
            enabled={includeCatalog}
            onChange={setIncludeCatalog}
          />
          <ToggleSwitch
            label={language === 'en' ? 'Auto-Calculate 18% GST Tax' : language === 'hi' ? '18% GST टैक्स ऑटो-कैलकुलेट करें' : 'Auto-Calculate 18% GST Tax'}
            enabled={gstCalc}
            onChange={setGstCalc}
          />
          <ToggleSwitch
            label={language === 'en' ? 'Humanize Responses (More Natural)' : language === 'hi' ? 'ह्यूमनाइज़ रिस्पॉन्स (अधिक प्राकृतिक)' : 'Humanize Responses (More Natural)'}
            enabled={humanize}
            onChange={setHumanize}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:shadow-lg hover:shadow-pink-500/25'
          }`}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save Instructions'}
        </button>
      </div>
    </div>
  );
}

// Templates Section
function TemplatesSection({ onBack, language, t }: { onBack: () => void; language: Language; t: typeof LABELS.en }) {
  const [templates, setTemplates] = useState([
    { id: 1, category: 'pricing', label: language === 'en' ? 'Pricing Query' : language === 'hi' ? 'मूल्य पूछताछ' : 'Pricing Query', content: 'Thank you for your interest! For {product_name}, the pricing starts at ₹{price} + 18% GST. Would you like a detailed proposal?' },
    { id: 2, category: 'demo', label: language === 'en' ? 'Demo Request' : language === 'hi' ? 'डेमो अनुरोध' : 'Demo Request', content: 'I\'d be happy to schedule a personalized demo for you. Our team will reach out within 24 hours to find a time that works for you.' },
    { id: 3, category: 'followup', label: language === 'en' ? 'Follow-up' : language === 'hi' ? 'फॉलो-अप' : 'Follow-up', content: 'Just checking in! Have you had a chance to review the proposal I shared? I\'m here to answer any questions.' },
    { id: 4, category: 'support', label: language === 'en' ? 'Support' : language === 'hi' ? 'सहायता' : 'Support', content: 'Thank you for reaching out! Our support team is here to help. Please share more details about your concern.' },
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
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-2 transition-colors">
        ← Back to AI Hub
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">{t.templates}</h2>
          <p className="text-xs text-muted">{t.templatesDesc}</p>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="crm-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[template.category] }}
                />
                <span className="text-white font-bold">{template.label}</span>
              </div>
              <button
                onClick={() => {
                  setEditingId(template.id);
                  setEditContent(template.content);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-lg bg-indigo-500/20"
              >
                {language === 'en' ? 'Edit' : language === 'hi' ? 'संपादित करें' : 'Edit'}
              </button>
            </div>

            {editingId === template.id ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-24 p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setTemplates(templates.map(t => t.id === template.id ? { ...t, content: editContent } : t));
                      setEditingId(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{template.content}</p>
            )}

            <div className="text-xs text-slate-600 mt-2">
              Variables: {'{product_name}'}, {'{price}'}, {'{lead_name}'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Automation Section
function AutomationSection({ onBack, language, t }: { onBack: () => void; language: Language; t: typeof LABELS.en }) {
  const [autoNudge, setAutoNudge] = useState(true);
  const [nudgeDelay, setNudgeDelay] = useState(15);
  const [autoReply, setAutoReply] = useState(true);
  const [hotLeadAlert, setHotLeadAlert] = useState(true);
  const [followUpSchedule, setFollowUpSchedule] = useState('3days');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-2 transition-colors">
        ← Back to AI Hub
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">{t.automation}</h2>
          <p className="text-xs text-muted">{t.automationDesc}</p>
        </div>
      </div>

      {/* Auto-Nudge Settings */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'AI Auto-Nudge' : language === 'hi' ? 'AI ऑटो-नज़र' : 'AI Auto-Nudge'}</h3>
        <ToggleSwitch
          label={language === 'en' ? 'Enable Auto-Nudge after inactivity' : language === 'hi' ? 'निष्क्रियता के बाद ऑटो-नज़र सक्षम करें' : 'Enable Auto-Nudge after inactivity'}
          enabled={autoNudge}
          onChange={setAutoNudge}
        />
        {autoNudge && (
          <div className="mt-4 ml-12">
            <label className="text-sm text-slate-300 font-medium">{language === 'en' ? 'Nudge Delay (minutes):' : language === 'hi' ? 'नज़र विलंब (मिनट):' : 'Nudge Delay (minutes):'} {nudgeDelay}</label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={nudgeDelay}
              onChange={(e) => setNudgeDelay(parseInt(e.target.value))}
              className="w-full h-2 mt-2 rounded-full appearance-none cursor-pointer bg-slate-700"
              style={{
                background: `linear-gradient(to right, #22c55e ${(nudgeDelay / 60) * 100}%, #334155 ${(nudgeDelay / 60) * 100}%)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Auto-Reply Settings */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Auto-Reply on First Contact' : language === 'hi' ? 'पहले संपर्क पर ऑटो-रिप्लाई' : 'Auto-Reply on First Contact'}</h3>
        <ToggleSwitch
          label={language === 'en' ? 'Send automatic welcome message' : language === 'hi' ? 'स्वचालित स्वागत संदेश भेजें' : 'Send automatic welcome message'}
          enabled={autoReply}
          onChange={setAutoReply}
        />
      </div>

      {/* Hot Lead Alerts */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Hot Lead Alerts' : language === 'hi' ? 'हॉट लीड अलर्ट' : 'Hot Lead Alerts'}</h3>
        <ToggleSwitch
          label={language === 'en' ? 'Alert on HOT tier leads' : language === 'hi' ? 'हॉट टायर लीड्स पर अलर्ट' : 'Alert on HOT tier leads'}
          enabled={hotLeadAlert}
          onChange={setHotLeadAlert}
        />
      </div>

      {/* Follow-up Schedule */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Auto Follow-up Schedule' : language === 'hi' ? 'ऑटो फॉलो-अप शेड्यूल' : 'Auto Follow-up Schedule'}</h3>
        <select
          value={followUpSchedule}
          onChange={(e) => setFollowUpSchedule(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="1day">{language === 'en' ? 'Every day' : language === 'hi' ? 'हर दिन' : 'Every day'}</option>
          <option value="3days">{language === 'en' ? 'Every 3 days' : language === 'hi' ? 'हर 3 दिन' : 'Every 3 days'}</option>
          <option value="7days">{language === 'en' ? 'Every week' : language === 'hi' ? 'हर हफ्ते' : 'Every week'}</option>
          <option value="14days">{language === 'en' ? 'Every 2 weeks' : language === 'hi' ? 'हर 2 हफ्ते' : 'Every 2 weeks'}</option>
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          {saving ? 'Saving...' : '💾 Save Automation Rules'}
        </button>
      </div>
    </div>
  );
}

// Analytics Section
function AnalyticsSection({ onBack, language, t }: { onBack: () => void; language: Language; t: typeof LABELS.en }) {
  const [learningMode, setLearningMode] = useState(true);
  const [feedbackTracking, setFeedbackTracking] = useState(true);

  // Mock analytics data
  const stats = {
    totalInteractions: 1247,
    successfulResponses: 1089,
    accuracyRate: 87,
    avgResponseTime: '1.2s',
    topTemplate: 'Pricing Query',
    conversionRate: 23,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-2 transition-colors">
        ← Back to AI Hub
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">{t.analytics}</h2>
          <p className="text-xs text-muted">{t.analyticsDesc}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: language === 'en' ? 'Total Interactions' : language === 'hi' ? 'कुल इंटरैक्शन' : 'Total Interactions', value: stats.totalInteractions.toLocaleString(), color: '#3b82f6' },
          { label: language === 'en' ? 'Accuracy Rate' : language === 'hi' ? 'सटीकता दर' : 'Accuracy Rate', value: `${stats.accuracyRate}%`, color: '#22c55e' },
          { label: language === 'en' ? 'Avg Response Time' : language === 'hi' ? 'औसत रिस्पॉन्स समय' : 'Avg Response Time', value: stats.avgResponseTime, color: '#f59e0b' },
          { label: language === 'en' ? 'Conversion Rate' : language === 'hi' ? 'रूपांतरण दर' : 'Conversion Rate', value: `${stats.conversionRate}%`, color: '#ec4899' },
        ].map((stat, i) => (
          <div key={i} className="crm-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Weekly Performance' : language === 'hi' ? 'साप्ताहिक प्रदर्शन' : 'Weekly Performance'}</h3>
        <div className="h-40 flex items-end gap-2">
          {[65, 78, 82, 75, 88, 92, 85].map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${value}%`,
                  background: `linear-gradient(to top, #3b82f6, #60a5fa)`,
                  minHeight: '8px',
                }}
              />
              <span className="text-xs text-slate-500">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Settings */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Learning & Feedback' : language === 'hi' ? 'लर्निंग और फीडबैक' : 'Learning & Feedback'}</h3>
        <div className="space-y-4">
          <ToggleSwitch
            label={language === 'en' ? 'AI Learning Mode (improve over time)' : language === 'hi' ? 'AI लर्निंग मोड (समय के साथ सुधारें)' : 'AI Learning Mode (improve over time)'}
            enabled={learningMode}
            onChange={setLearningMode}
          />
          <ToggleSwitch
            label={language === 'en' ? 'Track Thumbs Up/Down Feedback' : language === 'hi' ? 'थंब्स अप/डाउन फीडबैक ट्रैक करें' : 'Track Thumbs Up/Down Feedback'}
            enabled={feedbackTracking}
            onChange={setFeedbackTracking}
          />
        </div>
      </div>

      {/* Top Template */}
      <div className="crm-card p-6">
        <h3 className="text-white font-bold mb-4">{language === 'en' ? 'Most Used Template' : language === 'hi' ? 'सबसे अधिक उपयोग की गई टेम्पलेट' : 'Most Used Template'}</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <FileText size={24} className="text-blue-400" />
          <div>
            <div className="text-white font-bold">{stats.topTemplate}</div>
            <div className="text-xs text-slate-400">Used 423 times this month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <span className="text-sm text-slate-200">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-emerald-500' : 'bg-slate-600'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default AIHub;
