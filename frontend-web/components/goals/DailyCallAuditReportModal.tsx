'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  PhoneCall,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Sparkles,
  User,
} from 'lucide-react';
import { PerformanceRecord, toDateKey } from '@/lib/goalMetricsEngine';
import {
  buildDailyCallReportData,
  printOrDownloadDailyCallReport,
  DailyCallReportData,
} from '@/lib/callReportPdfGenerator';

interface DailyCallAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rep: PerformanceRecord | null;
  initialDate?: string;
  leads?: any[];
  tasks?: any[];
  allReps?: PerformanceRecord[];
  onSelectRep?: (r: PerformanceRecord) => void;
  onSelectDate?: (dateStr: string) => void;
}

export function DailyCallAuditReportModal({
  isOpen,
  onClose,
  rep,
  initialDate,
  leads = [],
  tasks = [],
  allReps = [],
  onSelectRep,
  onSelectDate,
}: DailyCallAuditReportModalProps) {
  const [currentDate, setCurrentDate] = useState<string>(() => initialDate || toDateKey(new Date()));
  const [selectedRep, setSelectedRep] = useState<PerformanceRecord | null>(rep);

  // Keep synced with props
  React.useEffect(() => {
    if (rep) setSelectedRep(rep);
  }, [rep]);

  React.useEffect(() => {
    if (initialDate) setCurrentDate(initialDate);
  }, [initialDate]);

  const reportData: DailyCallReportData | null = useMemo(() => {
    const targetRep = selectedRep || rep;
    if (!targetRep) return null;
    return buildDailyCallReportData(targetRep, currentDate, leads, tasks);
  }, [selectedRep, rep, currentDate, leads, tasks]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    const prevKey = toDateKey(d);
    setCurrentDate(prevKey);
    if (onSelectDate) onSelectDate(prevKey);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const nextKey = toDateKey(d);
    setCurrentDate(nextKey);
    if (onSelectDate) onSelectDate(nextKey);
  };

  const handleToday = () => {
    const todayKey = toDateKey(new Date());
    setCurrentDate(todayKey);
    if (onSelectDate) onSelectDate(todayKey);
  };

  const handleDownloadPdf = () => {
    if (!reportData) return;
    printOrDownloadDailyCallReport(reportData);
  };

  if (!isOpen || !rep || !reportData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ─── MODAL HEADER ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Daily Call & Follow-up Audit</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Official Audit Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed lead responses, conversation remarks, and connected callbacks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Download size={15} />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── CONTROLS BAR: DATE NAVIGATOR & REP PICKER ────────────────── */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs font-bold text-white flex items-center gap-2">
              <Calendar size={13} className="text-indigo-400" />
              {reportData.reportDateFormatted}
            </span>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Rep Selector (if multiple available) */}
          {allReps.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Rep:</span>
              <select
                value={selectedRep?.userId || rep.userId}
                onChange={(e) => {
                  const found = allReps.find((r) => r.userId === e.target.value);
                  if (found) {
                    setSelectedRep(found);
                    if (onSelectRep) onSelectRep(found);
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {allReps.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {r.userName} ({r.userRole})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ─── SCROLLABLE AUDIT CONTENT ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. SALES REP NAME & DATE ABOVE (PROMINENT BANNER) */}
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-lg"
                style={{ background: `${rep.avatarColor}25`, color: rep.avatarColor }}
              >
                {rep.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{reportData.repName}</h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {reportData.repRole}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {reportData.repEmail} · Squad: <strong className="text-slate-300">{reportData.teamLeaderName}</strong>
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-end gap-1 border-t md:border-t-0 md:border-l border-indigo-500/20 pt-3 md:pt-0 md:pl-6">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">
                Audit Report Date
              </span>
              <span className="text-base font-black text-white">{reportData.reportDate}</span>
              <span className="text-[10px] text-slate-400">{reportData.organizationName}</span>
            </div>
          </div>

          {/* 2. EXECUTIVE KPI TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Tile 1: Total Calls */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Calls</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{reportData.totalCalls}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Fresh: <strong className="text-white">{reportData.freshCalls}</strong> · FO:{' '}
                <strong className="text-white">{reportData.followupCalls}</strong>
              </div>
            </div>

            {/* Tile 2: Talk Time */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Talk Time</div>
              <div className="text-2xl font-black text-sky-400 mt-1">{reportData.totalTalkTimeFormatted}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cumulative duration</div>
            </div>

            {/* Tile 3: Daily Target Met */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Quota Met</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{reportData.completionPct}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {reportData.totalCalls} of {reportData.dailyCallsTarget} Target Calls
              </div>
            </div>

            {/* Tile 4: WhatsApp Sent */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Outreach</div>
              <div className="text-2xl font-black text-green-400 mt-1">{reportData.whatsappSent}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Direct manual chats</div>
            </div>
          </div>

          {/* 3. DISPOSITIONS BREAKDOWN */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
              Call Responses &amp; Dispositions Breakdown:
            </h4>
            <div className="flex flex-wrap gap-2">
              {reportData.dispositionsBreakdown.length > 0 ? (
                reportData.dispositionsBreakdown.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold"
                    style={{
                      borderColor: `${d.color}40`,
                      backgroundColor: `${d.color}15`,
                      color: d.color,
                    }}
                  >
                    <span>{d.name}</span>
                    <span className="px-1.5 py-0.2 bg-white/10 rounded-full font-black">{d.count}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500">No call responses recorded on this date.</span>
              )}
            </div>
          </div>

          {/* 4. ITEMISED LEAD CALLS & CONNECTED FOLLOW-UPS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <PhoneCall size={16} className="text-indigo-400" />
                <span>Lead-Wise Call Logs &amp; Follow-Up Details ({reportData.leadCalls.length})</span>
              </h4>
              <span className="text-xs text-slate-400">Chronological telemetry audit</span>
            </div>

            {reportData.leadCalls.length > 0 ? (
              reportData.leadCalls.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Lead Info Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/30">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-black text-white">{item.leadName}</h5>
                          <span className="text-xs text-slate-400 font-mono">{item.leadPhone}</span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building2 size={12} className="text-slate-500" />
                          <span>{item.leadCompany}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {item.leadStatus}
                    </span>
                  </div>

                  {/* Call Telemetry Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Call Type</span>
                      <span
                        className={`font-bold ${
                          item.callType === 'FRESH' ? 'text-emerald-400' : 'text-indigo-400'
                        }`}
                      >
                        {item.callType === 'FRESH' ? '🌱 Fresh Call' : '🔄 Follow-up'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Call Time</span>
                      <span className="font-bold text-white">{item.callTime}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Response</span>
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border mt-0.5"
                        style={{
                          backgroundColor: `${item.dispositionColor}20`,
                          borderColor: `${item.dispositionColor}50`,
                          color: item.dispositionColor,
                        }}
                      >
                        {item.disposition}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Duration</span>
                      <span className="font-bold text-white">{item.duration}</span>
                    </div>
                  </div>

                  {/* Conversation Remarks Box */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border-l-4 border-l-indigo-500 border border-slate-800/60">
                    <span className="text-[11px] font-bold text-indigo-400 block mb-1">
                      📝 Remarks &amp; Conversation Notes:
                    </span>
                    <p className="text-xs text-slate-200 italic leading-relaxed">&ldquo;{item.remarks}&rdquo;</p>
                  </div>

                  {/* Connected Follow-up Box */}
                  {item.followUp ? (
                    <div className="p-3 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Clock size={13} className="text-purple-400" />
                          <span>
                            {item.followUp.channel === 'WHATSAPP'
                              ? '💬 WhatsApp Follow-up'
                              : item.followUp.channel === 'MEETING'
                              ? '🤝 In-Person / Virtual Visit'
                              : '📞 Phone Call Callback'}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            item.followUp.isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.followUp.isCompleted ? '✓ Completed' : '⏳ Scheduled (Pending)'}
                        </span>
                      </div>

                      <p className="text-xs text-purple-200">
                        🗓️ Scheduled for:{' '}
                        <strong className="text-white">
                          {item.followUp.scheduledDate} at {item.followUp.scheduledTime}
                        </strong>
                      </p>

                      <p className="text-xs text-purple-300/90">
                        🎯 Objective: {item.followUp.purpose}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-500 italic">
                      ℹ️ No scheduled follow-up created for this call (Concluded)
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <div className="text-3xl mb-2">📞</div>
                <h5 className="text-base font-bold text-white">No Calls Logged on {reportData.reportDate}</h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Zero call telemetry interactions recorded for {reportData.repName} on this date. Use the date arrows
                  above to inspect other days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── MODAL FOOTER ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Generated: {reportData.generatedAt} · Database as Single Source of Truth
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyCallAuditReportModal;

