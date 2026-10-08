'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Phone,
  PhoneCall,
  PhoneForwarded,
  MessageCircle,
  Package,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Video,
  ArrowRight,
  TrendingUp,
  Tag,
  DollarSign,
} from 'lucide-react';
import { PerformanceRecord, DrilldownActivityItem } from '@/lib/goalMetricsEngine';

interface RepDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  rep: PerformanceRecord | null;
  selectedDate: string; // YYYY-MM-DD
  selectedMonth: string; // YYYY-MM
  isMonthView: boolean;
  onToggleTimeframe?: (isMonth: boolean) => void;
}

export function RepDrilldownModal({
  isOpen,
  onClose,
  rep,
  selectedDate,
  selectedMonth,
  isMonthView: initialMonthView,
  onToggleTimeframe,
}: RepDrilldownModalProps) {
  const router = useRouter();

  // Active Category: 'CALLS' | 'WHATSAPP' | 'PRODUCTS' | 'QUOTES'
  const [activeCategory, setActiveCategory] = useState<'CALLS' | 'WHATSAPP' | 'PRODUCTS' | 'QUOTES'>('CALLS');
  
  // Call Subtype Filter: 'ALL' | 'FRESH' | 'FOLLOWUP'
  const [callSubtype, setCallSubtype] = useState<'ALL' | 'FRESH' | 'FOLLOWUP'>('ALL');

  // Internal Timeframe Toggle (Today / Month)
  const [isMonth, setIsMonth] = useState<boolean>(initialMonthView);

  // Search keyword
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Copied phone tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter activities for this rep based on timeframe (Date vs Month)
  const allActivities = useMemo(() => rep?.activitiesList || [], [rep]);
  
  const timeframeActivities = useMemo(() => {
    return allActivities.filter(item => {
      if (isMonth) {
        return item.dateKey.startsWith(selectedMonth);
      } else {
        return item.dateKey === selectedDate;
      }
    });
  }, [allActivities, isMonth, selectedMonth, selectedDate]);

  // Counts for the 4 Category Buttons
  const callsList = useMemo(() => timeframeActivities.filter(a => a.category === 'CALL'), [timeframeActivities]);
  const freshCallsList = useMemo(() => callsList.filter(a => a.callSubtype === 'FRESH'), [callsList]);
  const followupCallsList = useMemo(() => callsList.filter(a => a.callSubtype === 'FOLLOWUP'), [callsList]);

  const waList = useMemo(() => timeframeActivities.filter(a => a.category === 'WHATSAPP'), [timeframeActivities]);
  const prodsList = useMemo(() => timeframeActivities.filter(a => a.category === 'PRODUCT'), [timeframeActivities]);
  const quotesList = useMemo(() => timeframeActivities.filter(a => a.category === 'QUOTE'), [timeframeActivities]);

  const totalQuotesAmount = useMemo(() => quotesList.reduce((sum, q) => sum + (q.quoteAmount || 0), 0), [quotesList]);

  // Filter by active category & sub-filter & search
  const displayedActivities = useMemo(() => {
    let list: DrilldownActivityItem[] = [];

    if (activeCategory === 'CALLS') {
      if (callSubtype === 'FRESH') {
        list = freshCallsList;
      } else if (callSubtype === 'FOLLOWUP') {
        list = followupCallsList;
      } else {
        list = callsList;
      }
    } else if (activeCategory === 'WHATSAPP') {
      list = waList;
    } else if (activeCategory === 'PRODUCTS') {
      list = prodsList;
    } else if (activeCategory === 'QUOTES') {
      list = quotesList;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      return (
        item.leadName.toLowerCase().includes(q) ||
        item.leadPhone.toLowerCase().includes(q) ||
        item.leadCompany.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.quoteNo && item.quoteNo.toLowerCase().includes(q)) ||
        (item.products && item.products.some(p => p.toLowerCase().includes(q)))
      );
    });
  }, [activeCategory, callSubtype, freshCallsList, followupCallsList, callsList, waList, prodsList, quotesList, searchQuery]);

  if (!isOpen || !rep) return null;

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenLead = (leadId: string) => {
    window.open(`/leads/${leadId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ─── MODAL HEADER ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-md"
              style={{ background: `${rep.avatarColor}25`, color: rep.avatarColor }}
            >
              {rep.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{rep.userName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {rep.userRole}
                </span>
                {rep.teamLeaderName && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    Squad: {rep.teamLeaderName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {rep.userEmail} · Real-time contact attempts, outreach, product shares, and quotations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => {
                  setIsMonth(false);
                  if (onToggleTimeframe) onToggleTimeframe(false);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !isMonth ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Today ({selectedDate})
              </button>
              <button
                onClick={() => {
                  setIsMonth(true);
                  if (onToggleTimeframe) onToggleTimeframe(true);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isMonth ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Month ({selectedMonth})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── 4 MAIN INTERACTIVE CATEGORY BUTTONS ───────────────────────── */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* BUTTON 1: CALLS */}
            <button
              onClick={() => setActiveCategory('CALLS')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeCategory === 'CALLS'
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone size={14} className={activeCategory === 'CALLS' ? 'text-emerald-400' : 'text-slate-400'} />
                  Calls
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    activeCategory === 'CALLS'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {callsList.length} Done
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">{callsList.length}</span>
                <span className="text-xs text-slate-400 ml-1.5">
                  / {isMonth ? rep.dailyCallsTarget * 22 : rep.dailyCallsTarget}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                  Fresh: {freshCallsList.length}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/20">
                  FO: {followupCallsList.length}
                </span>
              </div>
            </button>

            {/* BUTTON 2: WHATSAPP MSG */}
            <button
              onClick={() => setActiveCategory('WHATSAPP')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeCategory === 'WHATSAPP'
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageCircle size={14} className={activeCategory === 'WHATSAPP' ? 'text-indigo-400' : 'text-slate-400'} />
                  WhatsApp Msg
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    activeCategory === 'WHATSAPP'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {waList.length} Sent
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">{waList.length}</span>
                <span className="text-xs text-slate-400 ml-1.5">
                  {rep.dailyWhatsappTarget > 0
                    ? `/ ${isMonth ? rep.dailyWhatsappTarget * 22 : rep.dailyWhatsappTarget}`
                    : '(Optional)'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Direct Outreach Sent
              </div>
            </button>

            {/* BUTTON 3: PRODUCTS */}
            <button
              onClick={() => setActiveCategory('PRODUCTS')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeCategory === 'PRODUCTS'
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Package size={14} className={activeCategory === 'PRODUCTS' ? 'text-amber-400' : 'text-slate-400'} />
                  Products
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    activeCategory === 'PRODUCTS'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {prodsList.length} Shared
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">{prodsList.length}</span>
                <span className="text-xs text-slate-400 ml-1.5">Pitches</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Catalogues Pitched
              </div>
            </button>

            {/* BUTTON 4: QUOTE */}
            <button
              onClick={() => setActiveCategory('QUOTES')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeCategory === 'QUOTES'
                  ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText size={14} className={activeCategory === 'QUOTES' ? 'text-purple-400' : 'text-slate-400'} />
                  Quote
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    activeCategory === 'QUOTES'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {quotesList.length} Quotes
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">{quotesList.length}</span>
                <span className="text-xs text-purple-300 ml-1.5 font-bold">
                  (₹{(totalQuotesAmount / 1000).toFixed(0)}k)
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Commercial Quotations
              </div>
            </button>
          </div>

          {/* ─── CALLS SUB-FILTER (SHOWS WHEN CALLS ACTIVE) ────────────────── */}
          {activeCategory === 'CALLS' && (
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800/70 animate-fadeIn">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Call Type:
              </span>
              <button
                onClick={() => setCallSubtype('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  callSubtype === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Calls ({callsList.length})
              </button>
              <button
                onClick={() => setCallSubtype('FRESH')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  callSubtype === 'FRESH'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                }`}
              >
                🌱 Fresh Calls ({freshCallsList.length})
              </button>
              <button
                onClick={() => setCallSubtype('FOLLOWUP')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  callSubtype === 'FOLLOWUP'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'
                }`}
              >
                🔄 Follow-up Calls ({followupCallsList.length})
              </button>
            </div>
          )}
        </div>

        {/* ─── SEARCH & FILTER TOOLBAR ────────────────────────────────────── */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by lead name, phone, party company, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{displayedActivities.length}</strong> {activeCategory.toLowerCase()} records for{' '}
            <strong className="text-indigo-400">{isMonth ? selectedMonth : selectedDate}</strong>
          </div>
        </div>

        {/* ─── DRILLDOWN ACTIVITIES LIST ─────────────────────────────────── */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {displayedActivities.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
                <AlertCircle size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No {activeCategory.toLowerCase()} activities found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'No matching leads or entries match your search query.'
                  : `No ${activeCategory.toLowerCase()} actions recorded for ${isMonth ? selectedMonth : selectedDate}. Switch timeframe to view monthly activities.`}
              </p>
              {!isMonth && (
                <button
                  onClick={() => setIsMonth(true)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Switch to Monthly View
                </button>
              )}
            </div>
          ) : (
            displayedActivities.map((item, idx) => (
              <div
                key={item.id || idx}
                className="crm-card p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-3 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Lead Info & Party */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {item.leadName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Clickable Lead Name */}
                        <button
                          onClick={() => handleOpenLead(item.leadId)}
                          className="font-bold text-sm text-white hover:text-indigo-400 transition-all flex items-center gap-1 truncate text-left cursor-pointer group-hover:text-indigo-300"
                          title="Click to open Lead Operations Hub"
                        >
                          {item.leadName}
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {item.leadStatus && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                            {item.leadStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        {/* Phone Number with Action Links */}
                        <div className="flex items-center gap-1 font-mono text-slate-300">
                          <Phone size={11} className="text-slate-400" />
                          <span>{item.leadPhone}</span>
                          <button
                            onClick={() => handleCopyPhone(item.leadPhone, item.id)}
                            className="p-0.5 hover:text-white transition-colors cursor-pointer"
                            title="Copy Phone Number"
                          >
                            {copiedId === item.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          </button>
                          <a
                            href={`tel:${item.leadPhone}`}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors ml-0.5"
                            title="Direct Call"
                          >
                            <PhoneCall size={11} />
                          </a>
                          <a
                            href={`https://wa.me/${item.leadPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle size={11} />
                          </a>
                        </div>

                        {/* Company / Buyer Party */}
                        {item.leadCompany && item.leadCompany !== '—' && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Building2 size={11} />
                            <span className="truncate">{item.leadCompany}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Open Lead Button */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenLead(item.leadId)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      title="Open Lead Communications & Operations Hub (Single Source of Truth)"
                    >
                      <ExternalLink size={13} />
                      Open Lead Hub
                    </button>
                  </div>
                </div>

                {/* Specific Action Highlights */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Subtype Badge */}
                      {item.category === 'CALL' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            item.callSubtype === 'FRESH'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {item.callSubtype === 'FRESH' ? '🌱 Fresh Call (Lead 1st Contact)' : '🔄 Follow-up Call'}
                        </span>
                      )}

                      {item.category === 'WHATSAPP' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          💬 Direct WhatsApp Outreach
                        </span>
                      )}

                      {item.category === 'PRODUCT' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          📦 Product Pitch ({item.productCount || (item.products ? item.products.length : 1)})
                        </span>
                      )}

                      {item.category === 'QUOTE' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          📄 Quotation No: {item.quoteNo || 'QT-2026-0042'}
                        </span>
                      )}

                      {item.outcome && (
                        <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                          {item.outcome}
                        </span>
                      )}

                      {item.quoteAmount && (
                        <span className="text-xs font-black text-purple-400">
                          ₹{item.quoteAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Clock size={11} />
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.dateKey}</span>
                    </div>
                  </div>

                  {/* Notes / Message content */}
                  {item.notes && (
                    <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                      {item.notes}
                    </p>
                  )}

                  {/* Products list if available */}
                  {item.products && item.products.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-400 font-semibold">Shared Items:</span>
                      {item.products.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── MODAL FOOTER ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Clicking <strong className="text-white">Open Lead Hub</strong> opens the full Employee Lead Communications & Operations Workspace.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
}
