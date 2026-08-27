'use client';

import { useState, useRef } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  FileText, Upload, Search, Download, Share2,
  Mail, MessageSquare, Eye, Trash2, Plus,
  X, FolderOpen, Star, Clock, TrendingUp,
  Activity, ChevronDown, ChevronRight, Users, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────
type PdfCategory = 'PRODUCT' | 'PRICING' | 'SPECIFICATION' | 'PROPOSAL';
type ShareChannel = 'WHATSAPP' | 'EMAIL' | 'LINK';

interface ShareEvent {
  id: string;
  sharedBy: string;       // employee name
  sharedTo: string;       // lead name
  leadPhone?: string;
  leadEmail?: string;
  channel: ShareChannel;
  timestamp: string;      // human-readable
  note?: string;
}

interface PdfItem {
  id: string;
  title: string;
  size: string;
  updated: string;
  category: PdfCategory;
  downloadsCount: number;
  pages?: number;
  author?: string;
  waShares: number;
  emailShares: number;
  linkShares: number;
  shareLog: ShareEvent[];
}

// ── Seed Share Logs ──────────────────────────────────────
const makeLog = (
  id: string, sharedBy: string, sharedTo: string,
  channel: ShareChannel, timestamp: string,
  extra: Partial<ShareEvent> = {}
): ShareEvent => ({ id, sharedBy, sharedTo, channel, timestamp, ...extra });

// ── Seed Data ────────────────────────────────────────────
const INITIAL_PDFS: PdfItem[] = [
  {
    id: '1',
    title: 'DAS CRM Enterprise Suite 2026 Deck.pdf',
    size: '4.2 MB', updated: 'Updated 2 days ago',
    category: 'PRODUCT', downloadsCount: 142, pages: 28, author: 'Aditya Kumar Rai',
    waShares: 47, emailShares: 31, linkShares: 18,
    shareLog: [
      makeLog('sl1', 'Rajesh Kumar', 'TechCorp Ltd',   'WHATSAPP', 'Today 10:22 AM', { leadPhone: '+91 98765 43210', note: 'Sent product deck before demo call' }),
      makeLog('sl2', 'Priya Sharma', 'Amit Patel',     'EMAIL',    'Today 09:15 AM', { leadEmail: 'amit@example.com', note: 'Follow-up after initial meeting' }),
      makeLog('sl3', 'Rajesh Kumar', 'Sunita Verma',   'WHATSAPP', 'Yesterday 3:40 PM', { leadPhone: '+91 87654 32109' }),
      makeLog('sl4', 'Ravi Singh',   'GlobalTech Inc', 'EMAIL',    'Yesterday 11:05 AM', { leadEmail: 'info@globaltech.com' }),
      makeLog('sl5', 'Priya Sharma', 'Anjali Mehta',   'LINK',     '2 days ago',     { note: 'Shared public brochure link via chat' }),
    ],
  },
  {
    id: '2',
    title: 'AI Lead Scoring Engine Pro Specs.pdf',
    size: '2.8 MB', updated: 'Updated last week',
    category: 'SPECIFICATION', downloadsCount: 89, pages: 14, author: 'Product Team',
    waShares: 22, emailShares: 14, linkShares: 8,
    shareLog: [
      makeLog('sl6', 'Ravi Singh',  'Rahul Industries', 'EMAIL',    'Today 08:55 AM', { leadEmail: 'rahul@industries.com' }),
      makeLog('sl7', 'Aisha Khan',  'CloudBase Corp',   'WHATSAPP', 'Yesterday 2:10 PM', { leadPhone: '+91 99887 76655' }),
      makeLog('sl8', 'Ravi Singh',  'StartupXYZ',       'LINK',     '3 days ago', {}),
    ],
  },
  {
    id: '3',
    title: 'WhatsApp Cloud API Pricing Rate Card.pdf',
    size: '1.5 MB', updated: 'Updated 3 days ago',
    category: 'PRICING', downloadsCount: 215, pages: 6, author: 'Sales Team',
    waShares: 89, emailShares: 54, linkShares: 31,
    shareLog: [
      makeLog('sl9',  'Priya Sharma', 'Amit Patel',      'WHATSAPP', 'Today 11:30 AM', { leadPhone: '+91 87654 32109', note: 'Pricing clarification request' }),
      makeLog('sl10', 'Rajesh Kumar', 'TechCorp Ltd',    'EMAIL',    'Today 10:00 AM', { leadEmail: 'contact@techcorp.com' }),
      makeLog('sl11', 'Aisha Khan',   'Mehta Enterprises','WHATSAPP', 'Yesterday 4:50 PM', { leadPhone: '+91 78563 21098' }),
      makeLog('sl12', 'Ravi Singh',   'Infosys Partner', 'EMAIL',    'Yesterday 9:30 AM', { leadEmail: 'partner@infosys.com' }),
      makeLog('sl13', 'Priya Sharma', 'ZoomSales Ltd',   'LINK',     '2 days ago', {}),
    ],
  },
  {
    id: '4',
    title: 'GST 18% Commercial Proposal Template.pdf',
    size: '1.9 MB', updated: 'Updated yesterday',
    category: 'PROPOSAL', downloadsCount: 64, pages: 10, author: 'Finance Team',
    waShares: 19, emailShares: 28, linkShares: 6,
    shareLog: [
      makeLog('sl14', 'Rajesh Kumar', 'Reliance Ventures', 'EMAIL',    'Today 09:45 AM', { leadEmail: 'biz@reliance.com', note: 'Quarterly proposal submission' }),
      makeLog('sl15', 'Aisha Khan',   'QuickBuy Inc',      'WHATSAPP', 'Yesterday 1:20 PM', { leadPhone: '+91 99100 22334' }),
      makeLog('sl16', 'Priya Sharma', 'Arun Constructions','EMAIL',    '2 days ago', { leadEmail: 'arun@construction.com' }),
    ],
  },
  {
    id: '5',
    title: 'DAS CRM Mobile App Feature Guide.pdf',
    size: '3.1 MB', updated: 'Updated 5 days ago',
    category: 'PRODUCT', downloadsCount: 178, pages: 22, author: 'Aditya Kumar Rai',
    waShares: 61, emailShares: 38, linkShares: 24,
    shareLog: [
      makeLog('sl17', 'Ravi Singh',   'Softech Pvt Ltd', 'WHATSAPP', 'Today 08:10 AM', { leadPhone: '+91 88991 00223', note: 'Sent before product demo' }),
      makeLog('sl18', 'Rajesh Kumar', 'NovaBiz Corp',    'EMAIL',    'Yesterday 5:00 PM', { leadEmail: 'hello@novabiz.com' }),
      makeLog('sl19', 'Aisha Khan',   'DataDriven Co',   'LINK',     '3 days ago', {}),
    ],
  },
  {
    id: '6',
    title: 'Annual Subscription Pricing Tiers 2026.pdf',
    size: '0.9 MB', updated: 'Updated 1 week ago',
    category: 'PRICING', downloadsCount: 312, pages: 4, author: 'Sales Team',
    waShares: 104, emailShares: 79, linkShares: 45,
    shareLog: [
      makeLog('sl20', 'Priya Sharma', 'Apex Retail',      'WHATSAPP', 'Today 10:55 AM', { leadPhone: '+91 77889 99001', note: 'Annual contract discussion' }),
      makeLog('sl21', 'Ravi Singh',   'StartupNest',      'EMAIL',    'Today 09:30 AM', { leadEmail: 'team@startupnest.in' }),
      makeLog('sl22', 'Rajesh Kumar', 'FintechEdge',      'WHATSAPP', 'Yesterday 3:00 PM', { leadPhone: '+91 66778 88990' }),
      makeLog('sl23', 'Aisha Khan',   'Greenfield Corp',  'EMAIL',    'Yesterday 11:45 AM', { leadEmail: 'gf@greenfield.com' }),
      makeLog('sl24', 'Ravi Singh',   'SwiftLogistics',   'LINK',     '2 days ago', {}),
      makeLog('sl25', 'Priya Sharma', 'MegaStore Ltd',    'EMAIL',    '3 days ago', { leadEmail: 'contact@megastore.in' }),
    ],
  },
];

// ── Category badge styles ────────────────────────────────
const CATEGORY_STYLES: Record<PdfCategory, { bg: string; text: string; border: string; label: string }> = {
  PRODUCT:       { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  label: 'Product' },
  PRICING:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Pricing' },
  SPECIFICATION: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    label: 'Spec' },
  PROPOSAL:      { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   label: 'Proposal' },
};

const CHANNEL_STYLES: Record<ShareChannel, { icon: any; bg: string; text: string; label: string }> = {
  WHATSAPP: { icon: MessageSquare, bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'WhatsApp' },
  EMAIL:    { icon: Mail,          bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  label: 'Email' },
  LINK:     { icon: Link2,         bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    label: 'Link' },
};

// ── Share Activity Drawer ─────────────────────────────────
function ShareActivityDrawer({ pdf, onClose, onAddShare }: {
  pdf: PdfItem;
  onClose: () => void;
  onAddShare: (pdfId: string, event: ShareEvent) => void;
}) {
  const [tab, setTab] = useState<'log' | 'add'>('log');
  const [newSharedBy, setNewSharedBy] = useState('');
  const [newSharedTo, setNewSharedTo] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newChannel, setNewChannel] = useState<ShareChannel>('WHATSAPP');
  const [newNote, setNewNote] = useState('');
  const [filterChannel, setFilterChannel] = useState<ShareChannel | 'ALL'>('ALL');

  const totalShares = pdf.waShares + pdf.emailShares + pdf.linkShares;

  const filteredLog = pdf.shareLog.filter(
    (e) => filterChannel === 'ALL' || e.channel === filterChannel
  );

  const handleAddShare = () => {
    if (!newSharedBy.trim() || !newSharedTo.trim()) return;
    const event: ShareEvent = {
      id: `sl_${Date.now()}`,
      sharedBy: newSharedBy.trim(),
      sharedTo: newSharedTo.trim(),
      channel: newChannel,
      timestamp: 'Just now',
      note: newNote.trim() || undefined,
      ...(newChannel === 'EMAIL' ? { leadEmail: newContact.trim() } : {}),
      ...(newChannel === 'WHATSAPP' ? { leadPhone: newContact.trim() } : {}),
    };
    onAddShare(pdf.id, event);
    setNewSharedBy(''); setNewSharedTo(''); setNewContact(''); setNewNote('');
    setTab('log');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg flex flex-col animate-slide-in"
        style={{ background: 'rgb(var(--card))', borderLeft: '1px solid rgb(var(--border))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm">Share Activity Log</h3>
              <p className="text-muted text-xs truncate mt-0.5">{pdf.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Share Stats Strip */}
        <div className="grid grid-cols-4 gap-px border-b" style={{ background: 'rgb(var(--border))' }}>
          {[
            { label: 'Total Shares', value: totalShares, color: 'text-white' },
            { label: 'WhatsApp', value: pdf.waShares, color: 'text-emerald-400' },
            { label: 'Email', value: pdf.emailShares, color: 'text-indigo-400' },
            { label: 'Link', value: pdf.linkShares, color: 'text-cyan-400' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3 px-2" style={{ background: 'rgb(var(--card))' }}>
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-muted text-[10px] mt-0.5 text-center">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          {[{ id: 'log', label: `Activity Log (${pdf.shareLog.length})` }, { id: 'add', label: '+ Log Share' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'log' | 'add')}
              className={cn(
                'flex-1 py-3 text-xs font-semibold border-b-2 transition-all',
                tab === t.id ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-muted hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'log' ? (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Channel filter */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {(['ALL', 'WHATSAPP', 'EMAIL', 'LINK'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                    filterChannel === ch
                      ? ch === 'ALL' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : ch === 'WHATSAPP' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : ch === 'EMAIL' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'border-slate-800 text-muted hover:text-white hover:border-slate-600'
                  )}
                >
                  {ch === 'ALL' ? 'All' : CHANNEL_STYLES[ch].label}
                </button>
              ))}
            </div>

            {filteredLog.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={32} className="text-muted mx-auto mb-3" />
                <p className="text-white font-semibold text-sm">No share activity</p>
                <p className="text-muted text-xs mt-1">Switch to "Log Share" tab to record one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLog.map((event) => {
                  const ch = CHANNEL_STYLES[event.channel];
                  const ChIcon = ch.icon;
                  return (
                    <div
                      key={event.id}
                      className="rounded-xl border p-3.5 transition-all hover:border-slate-600"
                      style={{ background: 'rgb(var(--sidebar-bg))', borderColor: 'rgb(var(--border))' }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Channel icon */}
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', ch.bg)}>
                          <ChIcon size={14} className={ch.text} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Who → Whom */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white text-xs font-bold">{event.sharedBy}</span>
                            <ChevronRight size={11} className="text-muted flex-shrink-0" />
                            <span className="text-indigo-300 text-xs font-semibold">{event.sharedTo}</span>
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0', ch.bg, ch.text)}>
                              {ch.label}
                            </span>
                          </div>

                          {/* Contact detail */}
                          {(event.leadPhone || event.leadEmail) && (
                            <p className="text-muted text-[11px] mt-1">
                              {event.leadPhone || event.leadEmail}
                            </p>
                          )}

                          {/* Note */}
                          {event.note && (
                            <p className="text-muted text-[11px] mt-1 italic leading-relaxed">
                              "{event.note}"
                            </p>
                          )}

                          {/* Timestamp */}
                          <p className="text-muted text-[10px] mt-1.5 flex items-center gap-1">
                            <Clock size={10} /> {event.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Add share form */
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-muted text-xs mb-4 leading-relaxed">
              Manually log a share event for this PDF — track who sent it, to which lead, and via what channel.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-muted text-xs font-medium block mb-1">Shared by (Employee)</label>
                <input
                  value={newSharedBy}
                  onChange={(e) => setNewSharedBy(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="text-muted text-xs font-medium block mb-1">Shared to (Lead / Company)</label>
                <input
                  value={newSharedTo}
                  onChange={(e) => setNewSharedTo(e.target.value)}
                  placeholder="e.g. TechCorp Ltd"
                  className="crm-input w-full"
                />
              </div>

              {/* Channel selector */}
              <div>
                <label className="text-muted text-xs font-medium block mb-1">Channel</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['WHATSAPP', 'EMAIL', 'LINK'] as ShareChannel[]).map((ch) => {
                    const s = CHANNEL_STYLES[ch];
                    const ChIcon = s.icon;
                    return (
                      <button
                        key={ch}
                        onClick={() => setNewChannel(ch)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all',
                          newChannel === ch ? `${s.bg} ${s.text} border-current` : 'border-slate-800 text-muted hover:border-slate-600 hover:text-white'
                        )}
                      >
                        <ChIcon size={12} /> {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-muted text-xs font-medium block mb-1">
                  {newChannel === 'EMAIL' ? 'Lead Email' : newChannel === 'WHATSAPP' ? 'Lead Phone' : 'Share Link / Platform'}
                </label>
                <input
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder={newChannel === 'EMAIL' ? 'lead@email.com' : newChannel === 'WHATSAPP' ? '+91 98765 43210' : 'Platform or link description'}
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="text-muted text-xs font-medium block mb-1">Note (optional)</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Sent before demo call, client requested pricing breakdown..."
                  rows={3}
                  className="crm-input w-full resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setTab('log')} className="btn-secondary flex-1 text-xs py-2.5">
                  Cancel
                </button>
                <button
                  onClick={handleAddShare}
                  disabled={!newSharedBy.trim() || !newSharedTo.trim()}
                  className="btn-primary flex-1 text-xs py-2.5 gap-1.5 disabled:opacity-40"
                >
                  <Activity size={13} /> Log Share Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Email Modal ───────────────────────────────────────────
function EmailDispatchModal({ pdf, onClose, onShared }: { pdf: PdfItem; onClose: () => void; onShared: (event: ShareEvent) => void }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email.trim() || !email.includes('@')) return;
    onShared({
      id: `sl_${Date.now()}`,
      sharedBy: 'You',
      sharedTo: email.split('@')[0],
      leadEmail: email,
      channel: 'EMAIL',
      timestamp: 'Just now',
      note: note.trim() || undefined,
    });
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Mail size={18} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Email PDF Brochure</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <p className="text-muted text-xs mb-4 leading-relaxed">Dispatching: <span className="text-white font-semibold">{pdf.title}</span></p>
        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-emerald-400 font-bold text-sm">Brochure dispatched & share logged!</p>
            <p className="text-muted text-xs mt-1">{email}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Recipient email address..." className="crm-input w-full" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional — reason for sharing)" rows={2} className="crm-input w-full resize-none" />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
              <button onClick={handleSend} disabled={!email.trim() || !email.includes('@')} className="btn-primary flex-1 text-xs py-2 gap-1.5 disabled:opacity-40">
                <Mail size={13} /> Send & Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WhatsApp Modal ────────────────────────────────────────
function WhatsAppDispatchModal({ pdf, onClose, onShared }: { pdf: PdfItem; onClose: () => void; onShared: (event: ShareEvent) => void }) {
  const [phone, setPhone] = useState('');
  const [leadName, setLeadName] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const shareUrl = `https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`;
    const text = encodeURIComponent(`Hi! Here is the corporate PDF brochure:\n📄 ${pdf.title}\n📥 Download: ${shareUrl}`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    onShared({
      id: `sl_${Date.now()}`,
      sharedBy: 'You',
      sharedTo: leadName.trim() || phone,
      leadPhone: phone,
      channel: 'WHATSAPP',
      timestamp: 'Just now',
      note: note.trim() || undefined,
    });
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <MessageSquare size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Dispatch via WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <p className="text-muted text-xs mb-4 leading-relaxed">Dispatching: <span className="text-white font-semibold">{pdf.title}</span></p>
        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-emerald-400 font-bold text-sm">WhatsApp share opened & logged!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Lead / Company name" className="crm-input w-full" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone with country code (e.g. +91...)" className="crm-input w-full" autoFocus />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" rows={2} className="crm-input w-full resize-none" />
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
              <button onClick={handleSend} disabled={phone.replace(/\D/g, '').length < 7} className="btn-primary flex-1 text-xs py-2 gap-1.5 disabled:opacity-40" style={{ background: '#10b981' }}>
                <MessageSquare size={13} /> Send & Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────
function PreviewModal({ pdf, onClose }: { pdf: PdfItem; onClose: () => void }) {
  const cat = CATEGORY_STYLES[pdf.category];
  const totalShares = pdf.waShares + pdf.emailShares + pdf.linkShares;
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-2xl w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0"><FileText size={20} className="text-indigo-400" /></div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{pdf.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', cat.bg, cat.text, cat.border)}>{cat.label}</span>
                <span className="text-muted text-xs">{pdf.size}</span>
                {pdf.pages && <span className="text-muted text-xs">• {pdf.pages} pages</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors flex-shrink-0"><X size={16} /></button>
        </div>
        <div className="p-6">
          <div className="rounded-xl border flex flex-col items-center justify-center py-14 gap-4" style={{ background: 'rgb(9 11 20)', borderColor: 'rgb(var(--border))' }}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 flex items-center justify-center">
              <FileText size={36} className="text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{pdf.title}</p>
              <p className="text-cyan-400 text-sm mt-1">{pdf.category} • {pdf.size}{pdf.pages ? ` • ${pdf.pages} pages` : ''}</p>
              <p className="text-muted text-xs mt-3 max-w-xs leading-relaxed">Official DAS CRM Document Preview Renderer. 2-way sync enabled across mobile & web portals.</p>
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap justify-center">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><Download size={12} /> {pdf.downloadsCount} downloads</span>
              <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1"><Share2 size={12} /> {totalShares} shares</span>
              <span className="text-xs text-muted flex items-center gap-1"><MessageSquare size={12} /> {pdf.waShares} WA</span>
              <span className="text-xs text-muted flex items-center gap-1"><Mail size={12} /> {pdf.emailShares} Email</span>
              <span className="text-xs text-muted flex items-center gap-1"><Clock size={12} /> {pdf.updated}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs gap-1.5"><X size={13} /> Close</button>
            <button onClick={() => navigator.clipboard.writeText(`https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`).catch(() => {})} className="btn-secondary flex-1 text-xs gap-1.5"><Share2 size={13} /> Copy Link</button>
            <a href={`https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-xs gap-1.5 inline-flex items-center justify-center"><Download size={13} /> Download</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────
function UploadModal({ onClose, onPublish }: { onClose: () => void; onPublish: (pdf: PdfItem) => void }) {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('');
  const [category, setCategory] = useState<PdfCategory>('PRODUCT');
  const [pages, setPages] = useState('');
  const [author, setAuthor] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) setTitle(file.name.replace('.pdf', ''));
      setSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handlePublish = () => {
    if (!title.trim()) return;
    const filename = title.endsWith('.pdf') ? title.trim() : `${title.trim()}.pdf`;
    onPublish({ id: `pdf_${Date.now()}`, title: filename, size: size.trim() || '2.0 MB', updated: 'Just now', category, downloadsCount: 0, pages: pages ? parseInt(pages) : undefined, author: author.trim() || undefined, waShares: 0, emailShares: 0, linkShares: 0, shareLog: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Upload size={18} className="text-emerald-400" /></div>
            <h3 className="text-white font-bold text-sm">Upload Corporate PDF Brochure</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors" style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)' }}>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            <FileText size={28} className="text-indigo-400 mx-auto mb-2" />
            {fileName ? <p className="text-white text-xs font-semibold">{fileName}</p> : <><p className="text-white text-sm font-semibold">Drop PDF here or click to browse</p><p className="text-muted text-xs mt-1">Supports .pdf files up to 50 MB</p></>}
          </div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brochure title" className="crm-input w-full" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="File size (e.g. 4.5 MB)" className="crm-input" />
            <input type="number" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="No. of pages" className="crm-input" />
          </div>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / team name" className="crm-input w-full" />
          <div>
            <p className="text-muted text-xs mb-2 font-medium">Category</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CATEGORY_STYLES) as PdfCategory[]).map((cat) => {
                const s = CATEGORY_STYLES[cat];
                return <button key={cat} onClick={() => setCategory(cat)} className={cn('text-[10px] font-bold py-2 rounded-lg border transition-all', category === cat ? `${s.bg} ${s.text} ${s.border}` : 'border-slate-800 text-muted hover:border-slate-600')}>{s.label}</button>;
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2.5">Cancel</button>
            <button onClick={handlePublish} disabled={!title.trim()} className="btn-primary flex-1 text-xs py-2.5 gap-1.5 disabled:opacity-40" style={{ background: '#10b981' }}><Upload size={13} /> Publish PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function PdfCataloguePage() {
  const [pdfs, setPdfs] = useState<PdfItem[]>(INITIAL_PDFS);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PdfCategory | 'ALL'>('ALL');
  const [previewPdf, setPreviewPdf] = useState<PdfItem | null>(null);
  const [emailPdf, setEmailPdf] = useState<PdfItem | null>(null);
  const [waPdf, setWaPdf] = useState<PdfItem | null>(null);
  const [activityPdf, setActivityPdf] = useState<PdfItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = pdfs.filter((p) => {
    const matchSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const totalDownloads = pdfs.reduce((s, p) => s + p.downloadsCount, 0);
  const totalShares = pdfs.reduce((s, p) => s + p.waShares + p.emailShares + p.linkShares, 0);

  // Mutate a pdf share stats + log
  const handleShared = (pdfId: string, event: ShareEvent) => {
    setPdfs((prev) => prev.map((p) => {
      if (p.id !== pdfId) return p;
      return {
        ...p,
        waShares:    event.channel === 'WHATSAPP' ? p.waShares + 1 : p.waShares,
        emailShares: event.channel === 'EMAIL'    ? p.emailShares + 1 : p.emailShares,
        linkShares:  event.channel === 'LINK'     ? p.linkShares + 1 : p.linkShares,
        shareLog: [event, ...p.shareLog],
      };
    }));
    // refresh activity drawer if open
    if (activityPdf?.id === pdfId) {
      setActivityPdf((prev) => prev ? { ...prev, shareLog: [event, ...prev.shareLog] } : prev);
    }
  };

  const handleAddShare = (pdfId: string, event: ShareEvent) => {
    handleShared(pdfId, event);
    setActivityPdf((prev) => prev ? { ...prev, shareLog: [event, ...prev.shareLog], waShares: event.channel === 'WHATSAPP' ? prev.waShares + 1 : prev.waShares, emailShares: event.channel === 'EMAIL' ? prev.emailShares + 1 : prev.emailShares, linkShares: event.channel === 'LINK' ? prev.linkShares + 1 : prev.linkShares } : prev);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this PDF from the catalogue?')) return;
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <Topbar title="PDF Catalogue & Brochure Hub" actions={
        <button onClick={() => setShowUpload(true)} className="btn-primary text-xs gap-1.5 px-3 py-2"><Plus size={14} /> Upload PDF</button>
      } />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">
        {/* Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Documents', value: pdfs.length, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
            { label: 'Total Downloads', value: totalDownloads, icon: Download, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'Total Shares', value: totalShares, icon: Share2, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
            { label: 'Share Events', value: pdfs.reduce((s, p) => s + p.shareLog.length, 0), icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium">{stat.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon size={15} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="crm-card p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                Corporate PDF Catalogues & Decks
              </h2>
              <p className="text-muted text-xs mt-1">Download, preview, share or dispatch PDF brochures directly to leads via WhatsApp & Email. Every share is tracked.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalogues by title or keyword..." className="crm-input pl-9 w-full" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', ...Object.keys(CATEGORY_STYLES)] as (PdfCategory | 'ALL')[]).map((cat) => {
                const isActive = activeCategory === cat;
                const s = cat !== 'ALL' ? CATEGORY_STYLES[cat as PdfCategory] : null;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', isActive && cat !== 'ALL' && s ? `${s.bg} ${s.text} ${s.border}` : isActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'border-slate-800 text-muted hover:text-white hover:border-slate-600')}>
                    {cat === 'ALL' ? 'All' : CATEGORY_STYLES[cat as PdfCategory].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PDF List */}
        {filtered.length === 0 ? (
          <div className="crm-card p-12 text-center">
            <FileText size={40} className="text-muted mx-auto mb-3" />
            <p className="text-white font-semibold">No PDFs found</p>
            <p className="text-muted text-sm mt-1">Try adjusting your search or upload a new brochure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((pdf) => {
              const cat = CATEGORY_STYLES[pdf.category];
              const totalPdfShares = pdf.waShares + pdf.emailShares + pdf.linkShares;
              return (
                <div key={pdf.id} className="crm-card p-4 flex flex-col gap-4 group hover:border-indigo-500/30 transition-all">
                  {/* Top row: icon + meta + action buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* PDF icon + info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                        <FileText size={22} className="text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-bold text-sm truncate">{pdf.title}</p>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', cat.bg, cat.text, cat.border)}>{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-muted text-xs">{pdf.size}</span>
                          {pdf.pages && <span className="text-muted text-xs">{pdf.pages} pages</span>}
                          <span className="text-muted text-xs flex items-center gap-1"><Clock size={11} /> {pdf.updated}</span>
                          <span className="text-emerald-400 text-xs font-semibold"><Download size={11} className="inline mr-0.5" />{pdf.downloadsCount} dl</span>
                          {pdf.author && <span className="text-muted text-xs"><Star size={11} className="inline text-amber-400 mr-0.5" />{pdf.author}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button onClick={() => setPreviewPdf(pdf)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all"><Eye size={12} /> Preview</button>
                      <button onClick={() => setWaPdf(pdf)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all"><MessageSquare size={12} /> WA</button>
                      <button onClick={() => setEmailPdf(pdf)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/25 transition-all"><Mail size={12} /> Email</button>
                      <button onClick={() => setActivityPdf(pdf)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition-all"><Activity size={12} /> Activity</button>
                      <a href={`https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-muted border border-slate-700 text-xs font-semibold hover:text-white hover:border-slate-600 transition-all"><Download size={12} /> Download</a>
                      <button onClick={() => handleDelete(pdf.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all" title="Remove"><Trash2 size={12} /></button>
                    </div>
                  </div>

                  {/* Share Stat Strip */}
                  <div className="flex items-center gap-3 pt-3 border-t flex-wrap" style={{ borderColor: 'rgb(var(--border))' }}>
                    <span className="text-xs text-muted font-medium flex items-center gap-1"><Share2 size={11} /> Shared:</span>
                    <span className="text-xs font-bold text-white">{totalPdfShares} total</span>
                    <div className="w-px h-3 bg-slate-700" />
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><MessageSquare size={11} /> {pdf.waShares} WA</span>
                    <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1"><Mail size={11} /> {pdf.emailShares} Email</span>
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1"><Link2 size={11} /> {pdf.linkShares} Link</span>
                    <div className="w-px h-3 bg-slate-700" />
                    <span className="text-xs text-muted flex items-center gap-1"><Users size={11} /> {pdf.shareLog.length} logged events</span>
                    {pdf.shareLog.length > 0 && (
                      <button onClick={() => setActivityPdf(pdf)} className="text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1">
                        <Activity size={11} /> View log →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {previewPdf  && <PreviewModal pdf={previewPdf} onClose={() => setPreviewPdf(null)} />}
      {emailPdf    && <EmailDispatchModal pdf={emailPdf} onClose={() => setEmailPdf(null)} onShared={(e) => handleShared(emailPdf.id, e)} />}
      {waPdf       && <WhatsAppDispatchModal pdf={waPdf} onClose={() => setWaPdf(null)} onShared={(e) => handleShared(waPdf.id, e)} />}
      {activityPdf && <ShareActivityDrawer pdf={pdfs.find(p => p.id === activityPdf.id) ?? activityPdf} onClose={() => setActivityPdf(null)} onAddShare={handleAddShare} />}
      {showUpload  && <UploadModal onClose={() => setShowUpload(false)} onPublish={(pdf) => setPdfs((prev) => [pdf, ...prev])} />}
    </>
  );
}
