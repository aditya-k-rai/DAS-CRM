'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Plus,
  Edit2,
  Calendar as CalendarIcon,
  Phone,
  MessageCircle,
  FileText,
  DollarSign,
  Users,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Package,
  Layers,
  Flame,
  Zap,
  Briefcase,
  ChevronRight,
  Eye,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  PerformanceRecord,
  DayPerformanceHeatmap,
  fetchUnifiedCRMData,
  calculatePerformanceRecords,
  generateMonthlyHeatmap,
  toDateKey,
} from '@/lib/goalMetricsEngine';
import { GlobalGoalSettings, UserGoalTarget } from '@/lib/serverGoals';
import { SetGoalModal } from './SetGoalModal';
import { GoalsCalendar } from './GoalsCalendar';

export function SalesGoals() {
  const { currentUser } = useAuth();

  // Primary Filters & State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date())); // "YYYY-MM-DD"
  const [isMonthView, setIsMonthView] = useState<boolean>(false);
  const [viewScope, setViewScope] = useState<'ALL' | 'TEAM' | 'INDIVIDUAL'>('ALL');
  const [selectedTlFilter, setSelectedTlFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loaded Data State
  const [rawCRMData, setRawCRMData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals
  const [isSetGoalOpen, setIsSetGoalOpen] = useState<boolean>(false);
  const [drilldownRep, setDrilldownRep] = useState<PerformanceRecord | null>(null);

  // Role detection
  const userRoleStr = (currentUser?.role || 'ADMIN').toUpperCase();
  const isAdminOrManager = userRoleStr.includes('ADMIN') || userRoleStr.includes('MANAGER') || userRoleStr.includes('SUPER') || userRoleStr.includes('OWNER');
  const isTeamLeader = userRoleStr.includes('LEAD') || userRoleStr.includes('TL');
  const isSalesExec = !isAdminOrManager && !isTeamLeader;

  // Auto-set initial view scope based on role
  useEffect(() => {
    if (isSalesExec) {
      setViewScope('INDIVIDUAL');
    } else if (isTeamLeader) {
      setViewScope('TEAM');
    } else {
      setViewScope('ALL');
    }
  }, [isSalesExec, isTeamLeader]);

  // Load CRM Data
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await fetchUnifiedCRMData();
      setRawCRMData(data);
    } catch (err) {
      console.warn('Failed to load goals CRM data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to real-time events
    const handleSync = () => loadData(false);
    window.addEventListener('das_crm_activities_updated', handleSync);
    window.addEventListener('das_crm_leads_updated', handleSync);
    window.addEventListener('das_crm_quotes_updated', handleSync);
    window.addEventListener('das_crm_goals_updated', handleSync);

    return () => {
      window.removeEventListener('das_crm_activities_updated', handleSync);
      window.removeEventListener('das_crm_leads_updated', handleSync);
      window.removeEventListener('das_crm_quotes_updated', handleSync);
      window.removeEventListener('das_crm_goals_updated', handleSync);
    };
  }, [loadData]);

  // Execute Calculation Engine
  const { records, teamRollup, globalSettings, tlAssignments } = useMemo(() => {
    if (!rawCRMData) {
      return {
        records: [],
        teamRollup: {} as PerformanceRecord,
        globalSettings: {
          dailyCallsTarget: 40,
          dailyWhatsappTarget: 25,
          dailyQuotesTarget: 2,
          dailyNewLeadsTarget: 5,
          monthlyRevenueTarget: 500000,
          monthlyDealsTarget: 10,
          monthlyLeadsTarget: 60,
          monthlyQuotesTarget: 20,
          monthlyQuotesValueTarget: 1000000,
          activeMonth: selectedMonth,
        },
        tlAssignments: {},
      };
    }

    return calculatePerformanceRecords({
      users: rawCRMData.users,
      leads: rawCRMData.leads,
      activities: rawCRMData.activities,
      quotes: rawCRMData.quotes,
      goalsConfig: rawCRMData.goalsConfig,
      selectedDate,
      selectedMonth,
      currentUser,
    });
  }, [rawCRMData, selectedDate, selectedMonth, currentUser]);

  // Monthly Calendar Heatmap
  const heatmapDays = useMemo(() => {
    return generateMonthlyHeatmap({
      records,
      selectedMonth,
      globalSettings,
    });
  }, [records, selectedMonth, globalSettings]);

  // Filter records based on role and active filters
  const filteredRecords = useMemo(() => {
    let list = [...records];

    // Role-based visibility isolation
    if (isSalesExec) {
      list = list.filter(r => r.userId === currentUser?.id || r.userEmail === currentUser?.email);
      if (list.length === 0 && records.length > 0) {
        list = [records[0]];
      }
    } else if (isTeamLeader) {
      const myId = currentUser?.id || 'usr_tl';
      const myAssignedRepIds = tlAssignments[myId] || [];
      list = list.filter(r => r.userId === myId || r.teamLeaderId === myId || myAssignedRepIds.includes(r.userId));
    }

    // Secondary UI TL filter (for Admin / Manager)
    if (selectedTlFilter !== 'ALL') {
      const assignedReps = tlAssignments[selectedTlFilter] || [];
      list = list.filter(r => r.userId === selectedTlFilter || r.teamLeaderId === selectedTlFilter || assignedReps.includes(r.userId));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q) || r.userRole.toLowerCase().includes(q));
    }

    // Sort by overallScore descending
    return list.sort((a, b) => b.overallScore - a.overallScore);
  }, [records, isSalesExec, isTeamLeader, currentUser, tlAssignments, selectedTlFilter, searchQuery]);

  // Active aggregated card stats (Calculated from filtered records)
  const activeStats = useMemo(() => {
    const list = filteredRecords;
    const isM = isMonthView;

    const callsAchieved = isM ? list.reduce((s, r) => s + r.monthlyCallsTotal, 0) : list.reduce((s, r) => s + r.dateCallsTotal, 0);
    const callsTarget = isM ? list.reduce((s, r) => s + r.dailyCallsTarget * 22, 0) : list.reduce((s, r) => s + r.dailyCallsTarget, 0);
    const newCalls = isM ? list.reduce((s, r) => s + r.monthlyNewCalls, 0) : list.reduce((s, r) => s + r.dateNewCalls, 0);
    const followupCalls = isM ? list.reduce((s, r) => s + r.monthlyFollowupCalls, 0) : list.reduce((s, r) => s + r.dateFollowupCalls, 0);

    const waAchieved = isM ? list.reduce((s, r) => s + r.monthlyWhatsappTotal, 0) : list.reduce((s, r) => s + r.dateWhatsappTotal, 0);
    const waTarget = isM ? list.reduce((s, r) => s + r.dailyWhatsappTarget * 22, 0) : list.reduce((s, r) => s + r.dailyWhatsappTarget, 0);
    const waDirect = isM ? list.reduce((s, r) => s + r.monthlyWaDirect, 0) : list.reduce((s, r) => s + r.dateWaDirect, 0);
    const waCloud = isM ? list.reduce((s, r) => s + r.monthlyWaCloud, 0) : list.reduce((s, r) => s + r.dateWaCloud, 0);

    const productsShared = isM ? list.reduce((s, r) => s + r.monthlyProductsShared, 0) : list.reduce((s, r) => s + r.dateProductsShared, 0);
    const quotesCount = isM ? list.reduce((s, r) => s + r.monthlyQuotesCount, 0) : list.reduce((s, r) => s + r.dateQuotesCount, 0);
    const quotesAmount = isM ? list.reduce((s, r) => s + r.monthlyQuotesAmount, 0) : list.reduce((s, r) => s + r.dateQuotesAmount, 0);
    const pipelineValue = list.reduce((s, r) => s + r.pipelineValue, 0);

    const leadsReceived = isM ? list.reduce((s, r) => s + r.monthlyLeadsReceived, 0) : list.reduce((s, r) => s + r.dateLeadsReceived, 0);
    const dealsWon = list.reduce((s, r) => s + r.monthlyDealsWon, 0);
    const revenueWon = list.reduce((s, r) => s + r.monthlyRevenueWon, 0);
    const revenueTarget = list.reduce((s, r) => s + r.monthlyRevenueTarget, 0);

    const callsPct = callsTarget > 0 ? Math.min(200, Math.round((callsAchieved / callsTarget) * 100)) : 100;
    const waPct = waTarget > 0 ? Math.min(200, Math.round((waAchieved / waTarget) * 100)) : 100;
    const revPct = revenueTarget > 0 ? Math.min(200, Math.round((revenueWon / revenueTarget) * 100)) : 0;

    return {
      callsAchieved,
      callsTarget,
      newCalls,
      followupCalls,
      callsPct,
      waAchieved,
      waTarget,
      waDirect,
      waCloud,
      waPct,
      productsShared,
      quotesCount,
      quotesAmount,
      pipelineValue,
      leadsReceived,
      dealsWon,
      revenueWon,
      revenueTarget,
      revPct,
    };
  }, [filteredRecords, isMonthView]);

  // Save Goals Handler
  const handleSaveGoals = async (payload: {
    globalSettings: GlobalGoalSettings;
    userOverrides: UserGoalTarget[];
    tlAssignments: Record<string, string[]>;
  }) => {
    const res = await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to save goals configuration');
    }

    await loadData(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_goals_updated'));
    }
  };

  const teamLeadersList = useMemo(() => {
    return records.filter(r => r.userRole.includes('LEAD') || r.userRole.includes('TL') || r.userRole.includes('MANAGER'));
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw size={28} className="text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Synchronizing Goals & Real-Time Performance Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── TOP ACTION & HEADER BAR ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Sales Goals & Performance Targets
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isAdminOrManager ? 'Admin & Manager Hub' : isTeamLeader ? 'Team Leader Squad View' : 'Personal Sales Dashboard'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live sync with Leads, Follow-ups, WhatsApp, Catalog Proposals, and Quotations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Time Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Selector / Month Selector */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setSelectedMonth(e.target.value.slice(0, 7));
                  setIsMonthView(false);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-200 px-2 py-1 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh Live Metrics"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
          </button>

          {/* Set Goal Button (Admin & Manager only) */}
          {isAdminOrManager && (
            <button
              onClick={() => setIsSetGoalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sliders size={14} />
              Set Goals & Quotas
            </button>
          )}
        </div>
      </div>

      {/* ─── TOP 4 METRIC CARDS (REAL-TIME AGGREGATED) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: DAILY CALLS TARGET */}
        <div className="crm-card bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-400" />
              {isMonthView ? 'Monthly Calls' : 'Daily Calls'}
            </span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeStats.callsPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {activeStats.callsPct}% Done
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">{activeStats.callsAchieved}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">/ {activeStats.callsTarget}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {isMonthView ? 'Month Total' : selectedDate}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeStats.callsPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, activeStats.callsPct)}%` }}
            />
          </div>

          {/* Breakdown Pills: New Calls vs Follow-up Calls */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              New Calls: {activeStats.newCalls}
            </span>
            <span className="flex items-center gap-1 text-indigo-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Follow-ups: {activeStats.followupCalls}
            </span>
          </div>
        </div>

        {/* CARD 2: DAILY WHATSAPP MESSAGES */}
        <div className="crm-card bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageCircle size={14} className="text-indigo-400" />
              {isMonthView ? 'Monthly WhatsApp' : 'Daily WhatsApp'}
            </span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeStats.waPct >= 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {activeStats.waPct}% Done
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">{activeStats.waAchieved}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">/ {activeStats.waTarget}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {isMonthView ? 'Month Total' : selectedDate}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeStats.waPct >= 100 ? 'bg-emerald-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, activeStats.waPct)}%` }}
            />
          </div>

          {/* Breakdown Pills: WA Direct vs WA Cloud */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-indigo-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              WA Direct: {activeStats.waDirect}
            </span>
            <span className="flex items-center gap-1 text-purple-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              WA Cloud: {activeStats.waCloud}
            </span>
          </div>
        </div>

        {/* CARD 3: PRODUCTS SHARED & QUOTES PIPELINE */}
        <div className="crm-card bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package size={14} className="text-purple-400" />
              Products & Quotes
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {activeStats.quotesCount} Quotes
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">₹{(activeStats.quotesAmount / 100000).toFixed(1)}L</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">Quotes Val</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              ₹{(activeStats.pipelineValue / 100000).toFixed(1)}L Pipeline
            </span>
          </div>

          {/* Mini progress / bar indicator */}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
              style={{ width: `${Math.min(100, (activeStats.quotesCount / 5) * 100)}%` }}
            />
          </div>

          {/* Breakdown Pills: Products Shared & Quotes Generated */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-purple-400 font-bold">
              <Package size={11} /> Products: {activeStats.productsShared}
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <FileText size={11} /> Quotes: {activeStats.quotesCount}
            </span>
          </div>
        </div>

        {/* CARD 4: LEAD INFLOW & REVENUE WON */}
        <div className="crm-card bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame size={14} className="text-amber-400" />
              Lead Inflow & Revenue
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {activeStats.dealsWon} Won
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-emerald-400">₹{(activeStats.revenueWon / 100000).toFixed(1)}L</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">
                / ₹{(activeStats.revenueTarget / 100000).toFixed(1)}L
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-400">
              {activeStats.leadsReceived} Leads {isMonthView ? 'Month' : 'Today'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, activeStats.revPct)}%` }}
            />
          </div>

          {/* Breakdown: Deals won & Revenue */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 size={11} /> Won: {activeStats.dealsWon} deals
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-bold">
              Quota: {activeStats.revPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE CALENDAR & DATE INSPECTOR ──────────────────────── */}
      <GoalsCalendar
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
        onMonthChange={setSelectedMonth}
        onDateSelect={setSelectedDate}
        heatmapDays={heatmapDays}
        isMonthView={isMonthView}
        onToggleMonthView={setIsMonthView}
      />

      {/* ─── REP & TEAM LEADER PERFORMANCE BREAKDOWN TABLE ─────────────── */}
      <div className="crm-card bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-0">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Performance Leaderboard & Breakdown
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {isMonthView ? `Month of ${selectedMonth}` : `Date: ${selectedDate}`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Rankings, calls breakdown, WhatsApp channels, product shares, quotation values, and pipeline metrics.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TL Squad Filter for Admins */}
            {isAdminOrManager && teamLeadersList.length > 0 && (
              <select
                value={selectedTlFilter}
                onChange={e => setSelectedTlFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Squads & Teams</option>
                {teamLeadersList.map(tl => (
                  <option key={tl.userId} value={tl.userId}>
                    Squad: {tl.userName}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rep name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Employee / Rep</th>
                <th className="py-3 px-4">Calls (New / Follow-up)</th>
                <th className="py-3 px-4">WhatsApp (Direct / Cloud)</th>
                <th className="py-3 px-4">Products & Quotes</th>
                <th className="py-3 px-4">Pipeline & Leads</th>
                <th className="py-3 px-4 text-center">Completion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    No sales rep records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rep, idx) => {
                  const callsAch = isMonthView ? rep.monthlyCallsTotal : rep.dateCallsTotal;
                  const callsTgt = isMonthView ? rep.dailyCallsTarget * 22 : rep.dailyCallsTarget;
                  const newCalls = isMonthView ? rep.monthlyNewCalls : rep.dateNewCalls;
                  const foCalls = isMonthView ? rep.monthlyFollowupCalls : rep.dateFollowupCalls;

                  const waAch = isMonthView ? rep.monthlyWhatsappTotal : rep.dateWhatsappTotal;
                  const waTgt = isMonthView ? rep.dailyWhatsappTarget * 22 : rep.dailyWhatsappTarget;
                  const waDirect = isMonthView ? rep.monthlyWaDirect : rep.dateWaDirect;
                  const waCloud = isMonthView ? rep.monthlyWaCloud : rep.dateWaCloud;

                  const products = isMonthView ? rep.monthlyProductsShared : rep.dateProductsShared;
                  const quotesCount = isMonthView ? rep.monthlyQuotesCount : rep.dateQuotesCount;
                  const quotesAmt = isMonthView ? rep.monthlyQuotesAmount : rep.dateQuotesAmount;

                  const leadsCount = isMonthView ? rep.monthlyLeadsReceived : rep.dateLeadsReceived;

                  return (
                    <tr
                      key={rep.userId}
                      className="hover:bg-slate-800/40 transition-all group"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>

                      {/* Rep Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                            style={{ background: `${rep.avatarColor}20`, color: rep.avatarColor }}
                          >
                            {rep.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{rep.userName}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                              <span>{rep.userRole}</span>
                              {rep.teamLeaderName && rep.teamLeaderName !== rep.userName && (
                                <span className="text-indigo-400 font-semibold truncate">
                                  · Squad: {rep.teamLeaderName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Calls Progress & Breakdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-white font-bold">{callsAch}</span>
                            <span className="text-slate-400">/ {callsTgt}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              New: {newCalls}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                              FO: {foCalls}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp Progress & Breakdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-white font-bold">{waAch}</span>
                            <span className="text-slate-400">/ {waTgt}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                              Direct: {waDirect}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                              Cloud: {waCloud}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Products & Quotes */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white flex items-center gap-1">
                            <Package size={11} className="text-purple-400" />
                            {products} Prods Shared
                          </p>
                          <p className="text-[10px] text-amber-400 font-semibold">
                            {quotesCount} Quotes (₹{(quotesAmt / 1000).toFixed(0)}k)
                          </p>
                        </div>
                      </td>

                      {/* Pipeline & Leads */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-emerald-400">
                            ₹{(rep.pipelineValue / 100000).toFixed(1)}L Pipeline
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {leadsCount} Leads Inflow ({rep.monthlyDealsWon} Won)
                          </p>
                        </div>
                      </td>

                      {/* Overall Completion Progress */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`font-black text-xs ${
                              rep.overallScore >= 100
                                ? 'text-emerald-400'
                                : rep.overallScore >= 70
                                ? 'text-indigo-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {rep.overallScore}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rep.overallScore >= 100
                                  ? 'bg-emerald-400'
                                  : rep.overallScore >= 70
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, rep.overallScore)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDrilldownRep(rep)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> Drilldown
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── REP DRILLDOWN MODAL ────────────────────────────────────────── */}
      {drilldownRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: `${drilldownRep.avatarColor}20`, color: drilldownRep.avatarColor }}
                >
                  {drilldownRep.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {drilldownRep.userName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                      {drilldownRep.userRole}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {drilldownRep.userEmail} · Team Leader: {drilldownRep.teamLeaderName || 'Direct'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownRep(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Daily Calls</p>
                  <p className="text-lg font-black text-white">{drilldownRep.dateCallsTotal} / {drilldownRep.dailyCallsTarget}</p>
                  <p className="text-[10px] text-emerald-400">{drilldownRep.dateNewCalls} New · {drilldownRep.dateFollowupCalls} FO</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Daily WhatsApp</p>
                  <p className="text-lg font-black text-white">{drilldownRep.dateWhatsappTotal} / {drilldownRep.dailyWhatsappTarget}</p>
                  <p className="text-[10px] text-indigo-300">{drilldownRep.dateWaDirect} Direct · {drilldownRep.dateWaCloud} Cloud</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Products Shared</p>
                  <p className="text-lg font-black text-purple-400">{drilldownRep.dateProductsShared}</p>
                  <p className="text-[10px] text-slate-400">Month: {drilldownRep.monthlyProductsShared}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Quotes Issued</p>
                  <p className="text-lg font-black text-amber-400">{drilldownRep.dateQuotesCount}</p>
                  <p className="text-[10px] text-slate-400">Val: ₹{(drilldownRep.dateQuotesAmount / 1000).toFixed(0)}k</p>
                </div>
              </div>

              {/* Monthly Overview Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase size={14} className="text-indigo-400" /> Monthly Pipeline & Revenue Progress
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Pipeline Value:</span>
                    <strong className="text-emerald-400 font-bold text-sm">₹{(drilldownRep.pipelineValue / 100000).toFixed(2)} Lakhs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Monthly Deals Won:</span>
                    <strong className="text-white font-bold text-sm">{drilldownRep.monthlyDealsWon} Deals (₹{(drilldownRep.monthlyRevenueWon / 100000).toFixed(2)}L)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Monthly Leads Inflow:</span>
                    <strong className="text-indigo-400 font-bold text-sm">{drilldownRep.monthlyLeadsReceived} Leads</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setDrilldownRep(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SET GOAL MODAL ────────────────────────────────────────────── */}
      <SetGoalModal
        isOpen={isSetGoalOpen}
        onClose={() => setIsSetGoalOpen(false)}
        globalSettings={globalSettings}
        userOverrides={rawCRMData?.goalsConfig?.userOverrides || []}
        tlAssignments={tlAssignments}
        allUsers={records}
        onSave={handleSaveGoals}
      />
    </div>
  );
}
