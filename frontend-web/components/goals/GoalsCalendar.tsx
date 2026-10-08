'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  MessageCircle,
  FileText,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DayPerformanceHeatmap } from '@/lib/goalMetricsEngine';

interface GoalsCalendarProps {
  selectedMonth: string; // "YYYY-MM"
  selectedDate: string; // "YYYY-MM-DD"
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
  heatmapDays: DayPerformanceHeatmap[];
  isMonthView: boolean;
  onToggleMonthView: (isMonth: boolean) => void;
}

export function GoalsCalendar({
  selectedMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  heatmapDays,
  isMonthView,
  onToggleMonthView,
}: GoalsCalendarProps) {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const selectedDayData = heatmapDays.find(d => d.dateStr === selectedDate);

  return (
    <div className="crm-card p-5 bg-slate-900/90 border border-slate-800 space-y-4 rounded-2xl shadow-xl">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Performance Calendar & Date Inspector
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {monthNames[month - 1]} {year}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Select any date to view historical breakdown of daily calls, WhatsApp, products, and quotes.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onToggleMonthView(false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isMonthView ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => onToggleMonthView(true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isMonthView ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Month
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                onMonthChange(todayStr.slice(0, 7));
                onDateSelect(todayStr);
                onToggleMonthView(false);
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid & Inspector View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Monthly Heatmap Grid */}
        <div className="lg:col-span-2 space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 py-1 border-b border-slate-800/60">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {/* Empty slots for first week offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-950/20 opacity-30" />
            ))}

            {heatmapDays.map(d => {
              const isSelected = d.dateStr === selectedDate && !isMonthView;
              const isToday = d.dateStr === todayStr;

              // Color coding based on completion score
              const score = d.completionScore;
              const isHigh = score >= 80;
              const isMed = score >= 50 && score < 80;

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    onDateSelect(d.dateStr);
                    onToggleMonthView(false);
                  }}
                  className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-500/50'
                      : isToday
                      ? 'bg-slate-800/80 border-indigo-500/50 text-slate-200 hover:border-indigo-400'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-400' : ''}`}>
                      {d.dayNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isHigh ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : isMed ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                      title={`Target Completion: ${score}%`}
                    />
                  </div>

                  {/* Micro Indicators */}
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium truncate">
                    <span title="Calls">📞 {d.callsCount}</span>
                    <span title="WhatsApp">💬 {d.whatsappCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Date Performance Summary Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isMonthView ? 'Monthly Rollup' : 'Selected Date'}
              </span>
              <span className="text-xs font-black text-indigo-400">
                {isMonthView ? `${monthNames[month - 1]} ${year}` : selectedDate}
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Calls Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Calls Logged</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {selectedDayData?.callsCount || 0}
                </span>
              </div>

              {/* WhatsApp Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">WhatsApp Messages</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {selectedDayData?.whatsappCount || 0}
                </span>
              </div>

              {/* Products Shared */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-purple-400" />
                  <span className="text-xs font-semibold text-slate-300">Products Shared</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {selectedDayData?.productsCount || 0}
                </span>
              </div>

              {/* Quotations Generated */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300">Quotes Value</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">
                    ₹{((selectedDayData?.quotesAmount || 0) / 1000).toFixed(1)}k
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedDayData?.quotesCount || 0} issued
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                (selectedDayData?.completionScore || 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <CheckCircle2 size={12} />
              {(selectedDayData?.completionScore || 0) >= 80 ? 'Target Accomplished' : 'In Progress'} (
              {selectedDayData?.completionScore || 0}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
