'use client';

import { useState, useEffect } from 'react';
import {
  Phone, MessageSquare, Mail, Sparkles, Send, RefreshCw, CheckCircle2,
  Clock, AlertCircle, User, Building2, MapPin, Tag, FileText, Bot,
  PhoneOff, Mic, Play, Pause, ChevronRight, Zap, Shield, HelpCircle, Layers, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LeadAllocationTrail } from './LeadAllocationTrail';
import { CallContactHistory } from './CallContactHistory';

export type DispositionOption =
  | 'Not Responding'
  | 'Switch Off'
  | 'Busy'
  | 'Not Interested'
  | 'Will Talk Later'
  | 'Talked & Enter Response'
  | 'Other Requirements';

export interface SyncedActivityLog {
  id: string;
  section: 'DIALLER' | 'WA_DIRECT' | 'WA_CLOUD' | 'EMAIL';
  title: string;
  disposition?: DispositionOption;
  notes?: string;
  timestamp: string;
  user: string;
}

interface LeadWorkspaceProps {
  leadId?: string;
  leadData?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    owner: string;
  };
}

export function EmployeeLeadWorkspace({ leadId = '1', leadData }: LeadWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<
    'lead_center' | 'dialler' | 'wa_direct' | 'wa_cloud' | 'email_marketing'
  >('lead_center');

  // Lead State
  const [lead, setLead] = useState({
    id: leadData?.id || leadId,
    name: leadData?.name || 'Rajesh Kumar',
    email: leadData?.email || 'rajesh.kumar@techcorp.in',
    phone: leadData?.phone || '+91 98765 43210',
    company: leadData?.company || 'TechCorp Solutions',
    status: leadData?.status || 'Contacted',
    owner: leadData?.owner || 'Mighty Rai (Sales Rep)',
    city: 'Mumbai',
    source: 'Facebook Ads',
  });

  // Synced Activity Stream (Real-Time Auto-Synced to Lead Center)
  const [syncedActivities, setSyncedActivities] = useState<SyncedActivityLog[]>([
    {
      id: '1',
      section: 'DIALLER',
      title: 'Outbound Call Completed (Duration: 2m 14s)',
      disposition: 'Talked & Enter Response',
      notes: 'Customer interested in Enterprise 50-seat plan. Requested pricing deck on WhatsApp.',
      timestamp: '10 mins ago',
      user: 'Mighty Rai',
    },
    {
      id: '2',
      section: 'WA_DIRECT',
      title: 'Direct WhatsApp Template Sent (Intro Proposal)',
      disposition: 'Will Talk Later',
      notes: 'Sent PDF proposal. Follow-up call scheduled for tomorrow 3 PM.',
      timestamp: '25 mins ago',
      user: 'Mighty Rai',
    },
    {
      id: '3',
      section: 'EMAIL',
      title: 'Email Sent: Product Demo Invitation',
      notes: 'Email delivered to rajesh.kumar@techcorp.in',
      timestamp: '1 hour ago',
      user: 'Mighty Rai',
    },
  ]);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Status State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [newStatusChoice, setNewStatusChoice] = useState('Qualified');
  const [statusNotes, setStatusNotes] = useState('');

  const showSyncNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ── SECTION 2: SMART DIALLER STATE ──────────────────────────────────────
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showCallCutModal, setShowCallCutModal] = useState(false);
  const [selectedCallDisposition, setSelectedCallDisposition] = useState<DispositionOption>('Talked & Enter Response');
  const [callResponseNotes, setCallResponseNotes] = useState('');

  useEffect(() => {
    let timer: any;
    if (isCalling) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  const handleStartCall = () => {
    setIsCalling(true);
    setCallDuration(0);
  };

  const handleHangupCall = () => {
    setIsCalling(false);
    setShowCallCutModal(true); // Pops up Post-Call Cut Disposition Modal automatically!
  };

  const handleSaveCallDisposition = () => {
    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'DIALLER',
      title: `Call Ended (Duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s)`,
      disposition: selectedCallDisposition,
      notes: callResponseNotes || `Disposition: ${selectedCallDisposition}`,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);

    // Update lead status if disposition specifies
    if (selectedCallDisposition === 'Not Interested') setLead((prev) => ({ ...prev, status: 'Lost' }));
    if (selectedCallDisposition === 'Talked & Enter Response') setLead((prev) => ({ ...prev, status: 'Qualified' }));

    setShowCallCutModal(false);
    setCallResponseNotes('');
    showSyncNotification(`✓ Call Disposition Synced to Lead Center! (${selectedCallDisposition})`);
  };

  // ── SECTION 3: WHATSAPP CHAT DIRECT STATE ──────────────────────────────
  const [waDirectTemplate, setWaDirectTemplate] = useState('Intro Proposal Template');
  const [waDirectDisposition, setWaDirectDisposition] = useState<DispositionOption>('Will Talk Later');
  const [waDirectNotes, setWaDirectNotes] = useState('');

  const handleSendWaDirect = () => {
    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'WA_DIRECT',
      title: `WhatsApp Direct Template Dispatched (${waDirectTemplate})`,
      disposition: waDirectDisposition,
      notes: waDirectNotes || `Template sent: ${waDirectTemplate}`,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    showSyncNotification(`✓ WhatsApp Direct Message & Disposition Synced to Lead Center!`);
    setWaDirectNotes('');
  };

  // ── SECTION 4: WHATSAPP CLOUD CHAT + AI HUMANIZE STATE ───────────────────
  const [waCloudMessages, setWaCloudMessages] = useState([
    { id: '1', from: 'lead', text: 'Hi, can you tell me more about your CRM pricing?', time: '10:15 AM' },
    { id: '2', from: 'rep', text: 'Hi Rajesh! Our plans start from ₹1,499/mo per seat with full AI automation.', time: '10:18 AM' },
  ]);
  const [waCloudInput, setWaCloudInput] = useState('');
  const [isAiHumanizing, setIsAiHumanizing] = useState(false);

  const handleAiHumanize = () => {
    if (!waCloudInput.trim()) return;
    setIsAiHumanizing(true);
    setTimeout(() => {
      setWaCloudInput(
        `Dear ${lead.name.split(' ')[0]}, thank you for reaching out! I would be delighted to share our comprehensive solution tailored specifically for ${lead.company}. When would be a convenient time for a brief 5-minute call?`
      );
      setIsAiHumanizing(false);
      showSyncNotification('✨ Message polished with AI Humanize Engine!');
    }, 600);
  };

  const handleSendWaCloud = () => {
    if (!waCloudInput.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      from: 'rep',
      text: waCloudInput,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setWaCloudMessages((prev) => [...prev, newMsg]);

    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'WA_CLOUD',
      title: 'WhatsApp Cloud 2-Way Message Sent',
      notes: waCloudInput,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    setWaCloudInput('');
    showSyncNotification('✓ WhatsApp Cloud Message Synced to Lead Center!');
  };

  // ── SECTION 5: EMAIL MARKETING STATE ──────────────────────────────────
  const [emailTemplate, setEmailTemplate] = useState('Product Demo Invitation');
  const [emailSubject, setEmailSubject] = useState(`Exclusive Product Demo for ${lead.company}`);
  const [emailBody, setEmailBody] = useState(
    `Hi ${lead.name},\n\nWe would love to show you how our CRM platform can double your team's lead conversion rates.\n\nBest regards,\n${lead.owner}`
  );

  const handleSendEmail = () => {
    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'EMAIL',
      title: `Email Dispatched: ${emailSubject}`,
      notes: `Template: ${emailTemplate}`,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    showSyncNotification('✓ Email Dispatched & Synced to Lead Center!');
  };

  return (
    <div className="space-y-6">
      {/* Sync Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Lead Banner */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card border border-border p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand/20 text-brand-400 font-extrabold text-xl flex items-center justify-center border border-brand/30">
              {lead.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{lead.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand/20 text-brand-300 border border-brand/30">
                  {lead.status}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Building2 size={13} className="text-indigo-400" /> {lead.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Phone size={13} className="text-emerald-400" /> {lead.phone}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Mail size={13} className="text-purple-400" /> {lead.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border">
              Assigned Rep: <strong className="text-white">{lead.owner}</strong>
            </span>
          </div>
        </div>

        {/* ── 6 ACTION BUTTONS TOOLBAR ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-border">
          <button
            onClick={() => { handleStartCall(); setActiveSection('dialler'); }}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
          >
            <Phone size={14} /> 📞 Call
          </button>

          <button
            onClick={() => setActiveSection('wa_direct')}
            className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Zap size={14} /> 💬 WhatsApp Direct
          </button>

          <button
            onClick={() => setActiveSection('wa_cloud')}
            className="px-3 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare size={14} /> ☁️ WA Cloud
          </button>

          <button
            onClick={() => {
              window.location.href = `mailto:${lead.email}?subject=Follow-up%20from%20DAS%20CRM`;
              if (lead.status === 'New Lead' || lead.status === 'NEW LEAD') {
                setLead(prev => ({ ...prev, status: 'Contacted' }));
                showSyncNotification('📞 Lead Status auto-updated to Contacted!');
              }
            }}
            className="px-3 py-2 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Mail size={14} /> ✉️ Direct Email
          </button>

          <button
            onClick={() => setActiveSection('email_marketing')}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Send size={14} /> 🚀 Email Marketing
          </button>

          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="px-3 py-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Tag size={14} /> 📝 Update Status
          </button>
        </div>

        {/* ── 5 SECTIONS NAVIGATION BAR ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-border">
          {/* Section 1 */}
          <button
            onClick={() => setActiveSection('lead_center')}
            className={`p-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeSection === 'lead_center'
                ? 'bg-brand text-white shadow-lg shadow-brand/25 border border-brand-400'
                : 'bg-background text-muted hover:text-white border border-border'
            }`}
          >
            <Layers size={14} /> 1. Lead Center (Main Hub)
          </button>

          {/* Section 2 */}
          <button
            onClick={() => setActiveSection('dialler')}
            className={`p-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeSection === 'dialler'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400'
                : 'bg-background text-muted hover:text-white border border-border'
            }`}
          >
            <Phone size={14} /> 2. Smart Dialler & Post-Call
          </button>

          {/* Section 3 */}
          <button
            onClick={() => setActiveSection('wa_direct')}
            className={`p-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeSection === 'wa_direct'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25 border border-amber-400'
                : 'bg-background text-muted hover:text-white border border-border'
            }`}
          >
            <Zap size={14} /> 3. WhatsApp Direct
          </button>

          {/* Section 4 */}
          <button
            onClick={() => setActiveSection('wa_cloud')}
            className={`p-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeSection === 'wa_cloud'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400'
                : 'bg-background text-muted hover:text-white border border-border'
            }`}
          >
            <MessageSquare size={14} /> 4. WA Cloud + AI
          </button>

          {/* Section 5 */}
          <button
            onClick={() => setActiveSection('email_marketing')}
            className={`p-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeSection === 'email_marketing'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                : 'bg-background text-muted hover:text-white border border-border'
            }`}
          >
            <Mail size={14} /> 5. Email Marketing
          </button>
        </div>
      </div>

      {/* ── SECTION 1: LEAD CENTER (MAIN HUB) ────────────────────────────────── */}
      {activeSection === 'lead_center' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Lead Info Card & Allocation Chain */}
          <div className="space-y-6">
            <div className="crm-card space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-border pb-3">
                <User size={16} className="text-brand-400" /> Single Source of Truth — Lead Profile
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Lead Name:</span>
                  <span className="font-bold text-white">{lead.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Company:</span>
                  <span className="font-bold text-white">{lead.company}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Phone:</span>
                  <span className="font-bold text-emerald-400">{lead.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Email:</span>
                  <span className="font-bold text-purple-400">{lead.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Ingestion Source:</span>
                  <span className="font-bold text-indigo-300">{lead.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Current Status:</span>
                  <span className="font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    {lead.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation Trail Component */}
            <LeadAllocationTrail
              currentAssignee={lead.owner}
              currentRole="SALES_EXEC"
              leadId={lead.id}
            />
          </div>

          {/* Right Column: Full Contact History & Call Timeline */}
          <div className="md:col-span-2 space-y-6">
            <CallContactHistory leadName={lead.name} />
          </div>
        </div>
      )}

      {/* ── SECTION 2: SMART DIALLER & POST-CALL CUT DISPOSITION ─────────────── */}
      {activeSection === 'dialler' && (
        <div className="crm-card max-w-xl mx-auto space-y-6 text-center">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30">
              SMART IN-APP DIALLER ENGINE
            </span>
            <h3 className="text-lg font-extrabold text-white mt-2">Dialler — {lead.name}</h3>
            <p className="text-xs text-muted">{lead.phone} • {lead.company}</p>
          </div>

          {/* Call Screen */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-background to-card border border-border space-y-4 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-500/30 animate-pulse">
              <Phone size={36} />
            </div>

            {isCalling ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                  ● CALL IN PROGRESS
                </span>
                <p className="font-mono text-3xl font-extrabold text-white">
                  {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                </p>

                <div className="pt-4">
                  <button
                    onClick={handleHangupCall}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
                  >
                    <PhoneOff size={18} /> End Call (Call Cut) & Enter Disposition →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted">Ready to place outbound call to lead</p>
                <button
                  onClick={handleStartCall}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Phone size={18} /> Start Call Now →
                </button>
              </div>
            )}
          </div>

          {/* ── POST-CALL CUT DISPOSITION MODAL ────────────────────────────────────── */}
          {showCallCutModal && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>📱 Post-Call Outcome &amp; Lead Status Update</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Select outcome status for {lead.name} ({lead.phone}):
                </p>

                {/* Outcome Options Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'Talked & Enter Response', label: '🗣️ Talked (Call Completed)' },
                    { key: 'Will Talk Later', label: '⏰ Will Call Later' },
                    { key: 'Said Will Visit', label: '🤝 Said He Will Visit' },
                    { key: 'Catalogue Shared', label: '📄 Catalogue Shared' },
                    { key: 'Interested Product', label: '💡 Interested in Product' },
                    { key: 'Not Responding', label: '📞 Not Responding' },
                    { key: 'Busy', label: '⏳ Busy' },
                    { key: 'Switch Off', label: '📴 Switched Off' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedCallDisposition(opt.key as any)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all text-left border ${
                        selectedCallDisposition === (opt.key as any)
                          ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label} {selectedCallDisposition === (opt.key as any) && '✓'}
                    </button>
                  ))}
                </div>

                {/* Conditional Sub-Selectors */}
                {/* ⏰ WILL CALL LATER: 15-Day Date Grid & Time Slots */}
                {selectedCallDisposition === ('Will Talk Later' as any) && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <label className="text-xs text-amber-400 font-bold block">📅 Select Callback Date (Next 15 Days):</label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Array.from({ length: 15 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const label = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                        return (
                          <button
                            key={i}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-amber-500 whitespace-nowrap"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <label className="text-xs text-amber-400 font-bold block pt-1">⏰ Select Callback Time Slot:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'].map((slot) => (
                        <span key={slot} className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold cursor-pointer">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🤝 SAID WILL VISIT: Expected Visit Date Grid */}
                {selectedCallDisposition === ('Said Will Visit' as any) && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-xs text-indigo-400 font-bold block">🏢 Expected Visit Date (Next 15 Days):</label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Array.from({ length: 15 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const label = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                        return (
                          <button
                            key={i}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-indigo-500 whitespace-nowrap"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 💡 INTERESTED: Live Product Selection Box */}
                {selectedCallDisposition === ('Interested Product' as any) && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-xs text-emerald-400 font-bold block">💡 Select Interested Catalog Product:</label>
                    <div className="space-y-1.5">
                      {[
                        { name: 'DAS CRM Enterprise Suite', tier: '₹49,999 / yr' },
                        { name: 'AI Lead Scoring Engine Pro', tier: '₹14,999 / mo' },
                        { name: 'WhatsApp Automation Bot Engine', tier: '₹8,999 / mo' },
                        { name: 'Cloud Telemetry License', tier: '₹4,999 / mo' },
                      ].map((prod) => (
                        <div key={prod.name} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-emerald-500">
                          <span className="text-xs font-bold text-white">{prod.name}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">{prod.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Response Notes Box */}
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">📝 Custom Response &amp; Follow-up Notes:</label>
                  <textarea
                    rows={3}
                    className="crm-input text-xs w-full"
                    placeholder="Enter custom notes e.g. Client agreed to review demo with team tomorrow..."
                    value={callResponseNotes}
                    onChange={(e) => setCallResponseNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleSaveCallDisposition}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25"
                  >
                    Save & Auto-Sync To Lead Center →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: WHATSAPP CHAT DIRECT ──────────────────────────────────── */}
      {activeSection === 'wa_direct' && (
        <div className="crm-card max-w-2xl mx-auto space-y-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">
              WHATSAPP CHAT DIRECT DISPATCHER
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">Direct WhatsApp Template & Quick Update</h3>
            <p className="text-xs text-muted">Select pre-approved templates and dispatch directly to {lead.phone}</p>
          </div>

          <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">Select WhatsApp Template *</label>
              <select
                className="crm-input text-xs font-bold"
                value={waDirectTemplate}
                onChange={(e) => setWaDirectTemplate(e.target.value)}
              >
                <option value="Intro Proposal Template">Intro Proposal & Pricing Deck Template</option>
                <option value="Follow-up Call Schedule">Follow-up Call Schedule Template</option>
                <option value="Product Demo Invitation">Product Demo Invitation Template</option>
                <option value="Special Discount Offer">Special Discount Offer Template</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Select Quick Disposition Update Option *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Not Responding',
                  'Switch Off',
                  'Busy',
                  'Not Interested',
                  'Will Talk Later',
                  'Talked & Enter Response',
                  'Other Requirements',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWaDirectDisposition(opt as DispositionOption)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                      waDirectDisposition === opt
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                        : 'bg-card border-border text-muted hover:text-white'
                    }`}
                  >
                    {opt} {waDirectDisposition === opt && '✓'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Additional Notes / Response Entry (Optional)</label>
              <input
                type="text"
                className="crm-input text-xs"
                placeholder="e.g. Sent pricing PDF via Direct WhatsApp..."
                value={waDirectNotes}
                onChange={(e) => setWaDirectNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendWaDirect}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              <Send size={15} /> Send WhatsApp Direct & Auto-Sync to Lead Center →
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 4: WHATSAPP CLOUD CHAT + AI HUMANIZE ─────────────────────── */}
      {activeSection === 'wa_cloud' && (
        <div className="crm-card max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/30">
                2-WAY WHATSAPP CLOUD CHAT API + AI HUMANIZE
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">Live WhatsApp Cloud Chat — {lead.name}</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ● Cloud API Connected
            </span>
          </div>

          {/* Chat Messages Window */}
          <div className="p-4 rounded-2xl bg-background border border-border h-64 overflow-y-auto space-y-3">
            {waCloudMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'rep' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                    msg.from === 'rep'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-card border border-border text-white rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-[9px] opacity-70 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer Box with AI Humanize Button */}
          <div className="space-y-3">
            <textarea
              rows={2}
              className="crm-input text-xs"
              placeholder="Type your WhatsApp message draft or rough reply..."
              value={waCloudInput}
              onChange={(e) => setWaCloudInput(e.target.value)}
            />

            <div className="flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={handleAiHumanize}
                disabled={isAiHumanizing || !waCloudInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-purple-300" />
                {isAiHumanizing ? 'Humanizing with AI...' : '✨ AI Humanize Response'}
              </button>

              <button
                onClick={handleSendWaCloud}
                disabled={!waCloudInput.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                <Send size={14} /> Send & Sync →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: EMAIL MARKETING ────────────────────────────────────────── */}
      {activeSection === 'email_marketing' && (
        <div className="crm-card max-w-2xl mx-auto space-y-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/30">
              EMAIL MARKETING & CAMPAIGNS
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">Direct Email Dispatcher — {lead.email}</h3>
          </div>

          <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">Select Email Template *</label>
              <select
                className="crm-input text-xs font-bold"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
              >
                <option value="Product Demo Invitation">Product Demo Invitation Template</option>
                <option value="Enterprise Price Sheet">Enterprise Price Sheet Template</option>
                <option value="Company Introduction Deck">Company Introduction Deck Template</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Email Subject Line *</label>
              <input
                type="text"
                className="crm-input text-xs font-bold"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Email Body Content *</label>
              <textarea
                rows={4}
                className="crm-input text-xs"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendEmail}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Mail size={15} /> Dispatch Email & Auto-Sync to Lead Center →
            </button>
          </div>
        </div>
      )}

      {/* ── UPDATE STATUS MODAL ─────────────────────────────────────────── */}
      {showUpdateStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">📝 Update Lead Status & Stage</h3>
              <button onClick={() => setShowUpdateStatusModal(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Select New Stage *</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value)}
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Contacted">Contacted (Call/Msg Feedback Logged)</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="In Negotiation">In Negotiation (Product/Invoice Shared)</option>
                  <option value="Won">Won (Payment Cleared)</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Status Notes / Remarks</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  placeholder="Enter status update notes..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowUpdateStatusModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setLead(prev => ({ ...prev, status: newStatusChoice }));
                    setShowUpdateStatusModal(false);
                    setStatusNotes('');
                    showSyncNotification(`✓ Lead status updated to ${newStatusChoice}!`);
                    if (newStatusChoice === 'In Negotiation') {
                      setShowPaymentModal(true);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Save Status →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT CONFIRMATION POPUP MODAL ─────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  💳 INVOICE & PAYMENT AUDIT
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">Invoice Payment Outcome</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              An Invoice has been generated for <strong className="text-white">{lead.name}</strong>. Please confirm the payment result:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'Won' }));
                  setShowPaymentModal(false);
                  showSyncNotification('🎉 Payment Cleared! Lead status auto-updated to WON!');
                }}
                className="w-full p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">🟢 Payment Done / Cleared</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Full payment received. Auto-transitions status to WON 🎉</p>
              </button>

              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'In Negotiation' }));
                  setShowPaymentModal(false);
                  showSyncNotification('📄 Payment Promised. Status set to In Negotiation.');
                }}
                className="w-full p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-amber-300 flex items-center gap-2">🟡 Payment Promised / Will Pay Later</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Invoice sent. Client promised payment later. Status: IN NEGOTIATION</p>
              </button>

              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'In Negotiation' }));
                  setShowPaymentModal(false);
                  showSyncNotification('⏳ Awaiting Client Approval. Status set to In Negotiation.');
                }}
                className="w-full p-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-indigo-300 flex items-center gap-2">⏳ Waiting / Client Reviewing</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Awaiting client review. Status: IN NEGOTIATION</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
