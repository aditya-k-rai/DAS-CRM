'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  Plus,
  Search,
  Filter,
  X,
  CalendarDays,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  Flame,
  User,
  Building2,
  Check,
  CalendarCheck,
  TrendingUp,
  FileText,
  Share2,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// API Configuration helper that safely normalizes baseURL
const getApiUrl = (endpoint: string) => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const base = raw.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

const fetchApi = async (endpoint: string, token: string | null, options: RequestInit = {}) => {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null);
  const res = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

type TabId = 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL' | 'CALENDAR';
type FilterType = 'ALL' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'HIGH_PRIORITY';

export default function FollowUpsModule() {
  const { token, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('TODAY');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FilterType>('ALL');

  // Data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>({
    total: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    completedToday: 0,
    priority: { high: 0, medium: 0, normal: 0 },
  });
  const [todayData, setTodayData] = useState<any>({
    dueNow: [],
    upcomingToday: [],
    completedToday: [],
    missedToday: [],
    total: 0,
  });
  const [allData, setAllData] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  // UI state
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [createPresetType, setCreatePresetType] = useState<'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING'>('CALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const loadSummary = async () => {
    try {
      const data = await fetchApi('/follow-ups/summary', token);
      if (data && typeof data === 'object') {
        setSummary(data);
      }
    } catch (err) {
      console.warn('Follow-up summary fetch notice:', err);
    }
  };

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/follow-ups/today', token);
      if (data && typeof data === 'object') {
        setTodayData({
          dueNow: data.dueNow || [],
          upcomingToday: data.upcomingToday || [],
          completedToday: data.completedToday || [],
          missedToday: data.missedToday || [],
          total: data.total ?? ((data.dueNow?.length || 0) + (data.upcomingToday?.length || 0) + (data.completedToday?.length || 0) + (data.missedToday?.length || 0)),
        });
      }
    } catch (err) {
      console.warn('Today follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (statusFilter?: string) => {
    try {
      setLoading(true);
      let endpoint = '/follow-ups?limit=100';
      if (statusFilter) endpoint += `&status=${statusFilter}`;
      const data = await fetchApi(endpoint, token);
      setAllData(Array.isArray(data) ? data : (data.data || data.items || []));
    } catch (err) {
      console.warn('Follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const data = await fetchApi(`/follow-ups/calendar?dateFrom=${firstDay.toISOString()}&dateTo=${lastDay.toISOString()}`, token);
      setCalendarData(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.warn('Calendar follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await loadSummary();
    if (activeTab === 'TODAY') await loadTodayData();
    else if (activeTab === 'CALENDAR') await loadCalendarData();
    else if (activeTab === 'ALL') await loadAllData();
    else if (activeTab === 'UPCOMING') await loadAllData('PENDING');
    else if (activeTab === 'OVERDUE') await loadAllData('OVERDUE');
    else if (activeTab === 'COMPLETED') await loadAllData('COMPLETED');
    setRefreshing(false);
  };

  useEffect(() => {
    loadSummary();
    if (activeTab === 'TODAY') loadTodayData();
    else if (activeTab === 'ALL') loadAllData();
    else if (activeTab === 'UPCOMING') loadAllData('PENDING');
    else if (activeTab === 'OVERDUE') loadAllData('OVERDUE');
    else if (activeTab === 'COMPLETED') loadAllData('COMPLETED');
    else if (activeTab === 'CALENDAR') loadCalendarData();
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          setLoading(true);
          const data = await fetchApi(`/follow-ups/search?q=${encodeURIComponent(searchQuery.trim())}`, token);
          setAllData(Array.isArray(data) ? data : (data.data || []));
        } catch (_) {} finally {
          setLoading(false);
        }
      }, 350);
      return () => clearTimeout(delay);
    } else if (searchQuery.trim().length === 0 && activeTab !== 'TODAY' && activeTab !== 'CALENDAR') {
      if (activeTab === 'ALL') loadAllData();
      else if (activeTab === 'UPCOMING') loadAllData('PENDING');
      else if (activeTab === 'OVERDUE') loadAllData('OVERDUE');
      else if (activeTab === 'COMPLETED') loadAllData('COMPLETED');
    }
  }, [searchQuery]);

  // Actions
  const handleComplete = async (payload: any) => {
    try {
      await fetchApi(`/follow-ups/${selectedFollowUp.id}/complete`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setShowCompleteModal(false);
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to complete follow-up');
    }
  };

  const handleReschedule = async (payload: any) => {
    try {
      await fetchApi(`/follow-ups/${selectedFollowUp.id}/reschedule`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setShowRescheduleModal(false);
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule follow-up');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled follow-up?')) return;
    try {
      await fetchApi(`/follow-ups/${id}/cancel`, token, { method: 'PATCH', body: JSON.stringify({}) });
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel follow-up');
    }
  };

  const handleQuickCreatePreset = (type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING') => {
    setCreatePresetType(type);
    setShowCreateModal(true);
  };

  // Filter list based on selected quick chip
  const filterList = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    let result = items;
    if (selectedTypeFilter === 'HIGH_PRIORITY') {
      result = result.filter(i => i.priority === 'HIGH');
    } else if (selectedTypeFilter !== 'ALL') {
      result = result.filter(i => (i.followUpType || 'CALL').toUpperCase() === selectedTypeFilter);
    }
    return result;
  };

  const filteredAllData = useMemo(() => filterList(allData), [allData, selectedTypeFilter]);
  const filteredDueNow = useMemo(() => filterList(todayData.dueNow), [todayData.dueNow, selectedTypeFilter]);
  const filteredUpcomingToday = useMemo(() => filterList(todayData.upcomingToday), [todayData.upcomingToday, selectedTypeFilter]);
  const filteredCompletedToday = useMemo(() => filterList(todayData.completedToday), [todayData.completedToday, selectedTypeFilter]);
  const filteredMissedToday = useMemo(() => filterList(todayData.missedToday), [todayData.missedToday, selectedTypeFilter]);

  const hasAnyTodayItems = filteredDueNow.length > 0 || filteredUpcomingToday.length > 0 || filteredCompletedToday.length > 0 || filteredMissedToday.length > 0;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── TOP HEADER & QUICK ACTION BAR ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Follow-ups & Outreach Center
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Never lose a deal: track calls, scheduled messages, meetings, and client follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => handleQuickCreatePreset('CALL')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Schedule a Phone Call"
          >
            <Phone size={13} className="text-amber-400" /> + Call
          </button>
          <button
            onClick={() => handleQuickCreatePreset('WHATSAPP')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Schedule WhatsApp Message"
          >
            <MessageSquare size={13} className="text-emerald-400" /> + WhatsApp
          </button>
          <button
            onClick={() => handleQuickCreatePreset('MEETING')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Book a Meeting"
          >
            <CalendarDays size={13} className="text-sky-400" /> + Meeting
          </button>
          <button
            onClick={() => refreshAll()}
            disabled={refreshing}
            className="p-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="Refresh Follow-ups"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin text-indigo-400')} />
          </button>
          <button
            onClick={() => {
              setCreatePresetType('CALL');
              setShowCreateModal(true);
            }}
            className="btn-primary text-xs sm:text-sm px-4 py-2 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 ml-auto md:ml-0"
          >
            <Plus size={16} /> New Follow-up
          </button>
        </div>
      </div>

      {/* ── 5 HIGH-IMPACT METRIC CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Today Due Card */}
        <div
          onClick={() => setActiveTab('TODAY')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'TODAY'
              ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/60 ring-2 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Due Today
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ACTION
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.today ?? 0}
            </span>
            <CalendarIcon size={18} className="text-amber-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending outreach today</p>
        </div>

        {/* Upcoming Card */}
        <div
          onClick={() => setActiveTab('UPCOMING')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'UPCOMING'
              ? 'bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 border-sky-500/60 ring-2 ring-sky-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-sky-400" /> Upcoming
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
              PIPELINE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.upcoming ?? 0}
            </span>
            <Clock size={18} className="text-sky-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Next 7 to 30 days</p>
        </div>

        {/* Overdue Card */}
        <div
          onClick={() => setActiveTab('OVERDUE')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'OVERDUE'
              ? 'bg-gradient-to-br from-rose-500/25 via-slate-900 to-slate-950 border-rose-500/60 ring-2 ring-rose-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-400" /> Overdue
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
              URGENT
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
              {summary.overdue ?? 0}
            </span>
            <Flame size={18} className="text-rose-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Missed / delayed actions</p>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'COMPLETED'
              ? 'bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 border-emerald-500/60 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" /> Completed
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DONE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {summary.completed ?? 0}
            </span>
            <CheckCircle2 size={18} className="text-emerald-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.completedToday > 0 ? `${summary.completedToday} closed today` : 'Closed communications'}
          </p>
        </div>

        {/* Total Active Card */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md col-span-2 sm:col-span-1',
            activeTab === 'ALL'
              ? 'bg-gradient-to-br from-purple-500/20 via-slate-900 to-slate-950 border-purple-500/60 ring-2 ring-purple-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-purple-400 mb-2">
            <span className="flex items-center gap-1.5">
              <ListTodo size={14} className="text-purple-400" /> All Follow-ups
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CATALOG
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.total ?? 0}
            </span>
            <ListTodo size={18} className="text-purple-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total active workload</p>
        </div>
      </div>

      {/* ── TABS & QUICK FILTER PILLS BAR ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
          {/* Main Segmented Tab Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {([
              { id: 'TODAY', label: 'Today', count: summary.today },
              { id: 'UPCOMING', label: 'Upcoming', count: summary.upcoming },
              { id: 'OVERDUE', label: 'Overdue', count: summary.overdue, badgeColor: 'bg-rose-500/20 text-rose-300' },
              { id: 'COMPLETED', label: 'Completed', count: summary.completed },
              { id: 'ALL', label: 'All Follow-ups', count: summary.total },
              { id: 'CALENDAR', label: 'Calendar View', count: undefined, badgeColor: undefined, isSpecial: true },
            ] as Array<{ id: TabId; label: string; count?: number; badgeColor?: string; isSpecial?: boolean }>).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedFollowUp(null);
                  }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  )}
                >
                  {tab.id === 'CALENDAR' && <CalendarIcon size={13} className={isActive ? 'text-white' : 'text-slate-400'} />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-black',
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.badgeColor || 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar inside tab row */}
          {activeTab !== 'CALENDAR' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search prospect or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Filter Sub-Pills */}
        {activeTab !== 'CALENDAR' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-semibold py-0.5">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider pl-1 flex items-center gap-1">
              <Filter size={11} /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Actions' },
              { id: 'CALL', label: '📞 Phone Calls' },
              { id: 'WHATSAPP', label: '💬 WhatsApp' },
              { id: 'EMAIL', label: '✉️ Email' },
              { id: 'MEETING', label: '🤝 Meetings' },
              { id: 'HIGH_PRIORITY', label: '🔥 High Priority' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedTypeFilter(f.id as FilterType)}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all text-[11px] whitespace-nowrap cursor-pointer border',
                  selectedTypeFilter === f.id
                    ? 'bg-slate-800 text-indigo-300 border-indigo-500/40 shadow-sm font-bold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── WORKSPACE SPLIT CONTAINER (NO MORE SQUISHED STRIP) ───────────────── */}
      <div className="flex-1 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col lg:flex-row overflow-hidden min-h-[580px] shadow-2xl backdrop-blur-xl">
        {/* LEFT COLUMN: LIST / CARDS */}
        <div
          className={cn(
            'flex flex-col border-r border-slate-800/80 transition-all',
            selectedFollowUp ? 'hidden lg:flex lg:w-[460px] xl:w-[500px] shrink-0' : 'w-full lg:w-[460px] xl:w-[520px] shrink-0'
          )}
        >
          <div className="p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <ListTodo size={14} className="text-indigo-400" />
              {activeTab === 'TODAY' && "Today's Agenda"}
              {activeTab === 'UPCOMING' && 'Upcoming Pipeline'}
              {activeTab === 'OVERDUE' && 'Overdue Attention List'}
              {activeTab === 'COMPLETED' && 'Completed Log'}
              {activeTab === 'ALL' && 'All Communications'}
              {activeTab === 'CALENDAR' && 'Calendar Month'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {activeTab === 'TODAY' ? todayData.total || 0 : filteredAllData.length} records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[720px]">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Synchronizing follow-ups with server...</p>
              </div>
            ) : activeTab === 'TODAY' ? (
              hasAnyTodayItems ? (
                <div className="space-y-4">
                  {/* Due Now */}
                  {filteredDueNow.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400 px-1">
                        <Flame size={12} className="animate-pulse" /> Due Now / Urgent ({filteredDueNow.length})
                      </div>
                      {filteredDueNow.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Missed Today */}
                  {filteredMissedToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-400 px-1">
                        <AlertCircle size={12} /> Overdue / Missed Earlier ({filteredMissedToday.length})
                      </div>
                      {filteredMissedToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Upcoming Today */}
                  {filteredUpcomingToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-400 px-1">
                        <Clock size={12} /> Scheduled Later Today ({filteredUpcomingToday.length})
                      </div>
                      {filteredUpcomingToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Today */}
                  {filteredCompletedToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400 px-1">
                        <CheckCircle2 size={12} /> Completed Today ({filteredCompletedToday.length})
                      </div>
                      {filteredCompletedToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onQuickComplete={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyFollowUpsState onNew={() => setShowCreateModal(true)} tab="TODAY" />
              )
            ) : activeTab === 'CALENDAR' ? (
              <SimpleCalendar data={calendarData} onSelectFollowUp={setSelectedFollowUp} />
            ) : filteredAllData.length > 0 ? (
              <div className="space-y-2">
                {filteredAllData.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedFollowUp}
                    selected={selectedFollowUp?.id === item.id}
                    onQuickComplete={() => {
                      setSelectedFollowUp(item);
                      setShowCompleteModal(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyFollowUpsState onNew={() => setShowCreateModal(true)} tab={activeTab} />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKBENCH / INTERACTIVE DETAIL (FIXED SQUISHED STRIP BUG) */}
        <div className={cn('flex-1 bg-slate-900/40 flex flex-col overflow-hidden min-w-0', selectedFollowUp ? 'flex' : 'hidden lg:flex')}>
          {selectedFollowUp ? (
            <FollowUpDetails
              item={selectedFollowUp}
              onClose={() => setSelectedFollowUp(null)}
              onComplete={() => setShowCompleteModal(true)}
              onReschedule={() => setShowRescheduleModal(true)}
              onCancel={() => handleCancel(selectedFollowUp.id)}
            />
          ) : (
            <ProductivityWorkbench
              summary={summary}
              todayData={todayData}
              onScheduleNew={() => setShowCreateModal(true)}
              onSelectQuickType={handleQuickCreatePreset}
            />
          )}
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateFollowUpModal
          presetType={createPresetType}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshAll();
          }}
        />
      )}
      {showCompleteModal && selectedFollowUp && (
        <CompleteFollowUpModal
          item={selectedFollowUp}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleComplete}
        />
      )}
      {showRescheduleModal && selectedFollowUp && (
        <RescheduleModal
          item={selectedFollowUp}
          onClose={() => setShowRescheduleModal(false)}
          onSubmit={handleReschedule}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function FollowUpCard({
  item,
  onSelect,
  selected,
  onQuickComplete,
}: {
  item: any;
  onSelect: (i: any) => void;
  selected: boolean;
  onQuickComplete: () => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'OVERDUE':
      case 'MISSED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'DUE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'RESCHEDULED':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  const Icon =
    item.followUpType === 'CALL'
      ? Phone
      : item.followUpType === 'WHATSAPP'
      ? MessageSquare
      : item.followUpType === 'EMAIL'
      ? Mail
      : item.followUpType === 'MEETING'
      ? CalendarDays
      : Clock;

  const typeIconColor =
    item.followUpType === 'CALL'
      ? 'text-amber-400 bg-amber-500/15'
      : item.followUpType === 'WHATSAPP'
      ? 'text-emerald-400 bg-emerald-500/15'
      : item.followUpType === 'EMAIL'
      ? 'text-sky-400 bg-sky-500/15'
      : item.followUpType === 'MEETING'
      ? 'text-purple-400 bg-purple-500/15'
      : 'text-indigo-400 bg-indigo-500/15';

  const priorityBorder =
    item.priority === 'HIGH'
      ? 'border-l-4 border-l-rose-500'
      : item.priority === 'MEDIUM'
      ? 'border-l-4 border-l-amber-500'
      : 'border-l-4 border-l-slate-700';

  const dueTime = item.dueAt ? new Date(item.dueAt) : null;
  const timeFormatted = dueTime
    ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'No time';
  const dateFormatted = dueTime
    ? dueTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        'p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative group flex flex-col gap-2',
        priorityBorder,
        selected
          ? 'bg-slate-850 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850/80'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/5', typeIconColor)}>
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-indigo-300 transition-colors">
              {item.title}
            </h4>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <span>{dateFormatted}</span> • <span>{timeFormatted}</span>
            </p>
          </div>
        </div>

        <span className={cn('text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider shrink-0', getStatusBadge(item.computedStatus || item.status))}>
          {item.computedStatus || item.status}
        </span>
      </div>

      {item.purpose && (
        <p className="text-[11px] text-slate-300 line-clamp-1 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800/50">
          {item.purpose}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
        <div className="flex items-center gap-1.5 truncate">
          <User size={11} className="text-slate-500 shrink-0" />
          <span className="truncate font-medium text-slate-300">
            {item.lead ? `${item.lead.firstName || ''} ${item.lead.lastName || ''}`.trim() : 'General Prospect'}
          </span>
          {item.lead?.company?.name && (
            <span className="text-[10px] text-slate-500 truncate">({item.lead.company.name})</span>
          )}
        </div>

        {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete();
            }}
            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-all flex items-center gap-1"
            title="Mark Complete"
          >
            <Check size={10} /> Done
          </button>
        )}
      </div>
    </div>
  );
}

function FollowUpDetails({ item, onClose, onComplete, onReschedule, onCancel }: any) {
  const Icon =
    item.followUpType === 'CALL'
      ? Phone
      : item.followUpType === 'WHATSAPP'
      ? MessageSquare
      : item.followUpType === 'EMAIL'
      ? Mail
      : item.followUpType === 'MEETING'
      ? CalendarDays
      : Clock;

  const leadName = item.lead ? `${item.lead.firstName || ''} ${item.lead.lastName || ''}`.trim() || 'Prospect' : 'Prospect';
  const leadPhone = item.lead?.phone || '';
  const leadEmail = item.lead?.email || '';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="lg:hidden p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-white truncate">{item.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-300">
                {new Date(item.dueAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <span>•</span>
              <span className="font-bold text-indigo-300">{item.followUpType || 'GENERAL'}</span>
              <span>•</span>
              <span
                className={cn(
                  'font-black text-[10px] px-2 py-0.2 rounded-full uppercase',
                  item.priority === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300'
                    : item.priority === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                )}
              >
                {item.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
            <>
              <button onClick={onReschedule} className="btn-secondary text-xs px-3 py-1.5 h-auto">
                <Clock size={12} className="mr-1" /> Reschedule
              </button>
              <button
                onClick={onComplete}
                className="btn-primary text-xs px-3 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
              >
                <CheckCircle2 size={13} className="mr-1" /> Mark Complete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Status Alert Banner */}
        {item.computedStatus === 'OVERDUE' && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Overdue Follow-up Attention</h4>
              <p className="text-xs text-rose-200/90 mt-0.5">
                This follow-up was scheduled for {new Date(item.dueAt).toLocaleString()}. Immediate outreach is recommended to keep lead engaged.
              </p>
            </div>
          </div>
        )}

        {item.isCompleted && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 size={16} /> Completed on {new Date(item.completedAt).toLocaleString()}
            </div>
            {item.outcome && (
              <div className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Outcome</span>
                <span className="text-emerald-200 font-semibold">{item.outcome}</span>
              </div>
            )}
            {item.completionNotes && (
              <div className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Notes</span>
                <span className="text-slate-200">{item.completionNotes}</span>
              </div>
            )}
          </div>
        )}

        {/* Linked Prospect Card with Direct Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-indigo-400" /> Linked Prospect Details
            </span>
            {item.lead?.status?.name && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {item.lead.status.name}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                {leadName.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{leadName}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-500" />
                  {item.lead?.company?.name || 'Independent Enterprise'}
                </p>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="flex items-center gap-2">
              {leadPhone && (
                <>
                  <a
                    href={`tel:${leadPhone}`}
                    className="p-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-1 text-xs font-bold transition-all"
                    title={`Call ${leadPhone}`}
                  >
                    <PhoneCall size={14} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${leadPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1 text-xs font-bold transition-all"
                    title={`WhatsApp ${leadPhone}`}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                </>
              )}
              {leadEmail && (
                <a
                  href={`mailto:${leadEmail}`}
                  className="p-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-xl flex items-center gap-1 text-xs font-bold transition-all"
                  title={`Email ${leadEmail}`}
                >
                  <Mail size={14} /> Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Purpose / Agenda */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Follow-up Agenda / Purpose</h3>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {item.purpose || item.description || 'General touchpoint to review client interest and discuss proposal progression.'}
          </p>
        </div>

        {/* Footer info & Cancel */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Created on {new Date(item.createdAt).toLocaleDateString()}</span>
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
            <button onClick={onCancel} className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer">
              Cancel Follow-up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductivityWorkbench({
  summary,
  todayData,
  onScheduleNew,
  onSelectQuickType,
}: {
  summary: any;
  todayData: any;
  onScheduleNew: () => void;
  onSelectQuickType: (type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING') => void;
}) {
  return (
    <div className="h-full flex flex-col justify-center items-center p-8 text-center max-w-lg mx-auto space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
          <CalendarCheck size={40} />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
          ✓
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-black text-white">Daily Outreach & Follow-up Workbench</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select any scheduled communication from the list to view full lead details, make calls, dispatch WhatsApp messages, or mark outcomes.
        </p>
      </div>

      {/* Quick Launchpad Buttons */}
      <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-left">
          ⚡ Quick Schedule Launcher
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={() => onSelectQuickType('CALL')}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <Phone size={15} className="text-amber-400" />
            <div>
              <p className="font-black">Phone Call</p>
              <p className="text-[10px] text-slate-400 font-normal">Direct outreach</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('WHATSAPP')}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <MessageSquare size={15} className="text-emerald-400" />
            <div>
              <p className="font-black">WhatsApp</p>
              <p className="text-[10px] text-slate-400 font-normal">Fast response</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('MEETING')}
            className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <CalendarDays size={15} className="text-sky-400" />
            <div>
              <p className="font-black">Demo / Meeting</p>
              <p className="text-[10px] text-slate-400 font-normal">Close prospect</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('EMAIL')}
            className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <Mail size={15} className="text-purple-400" />
            <div>
              <p className="font-black">Formal Email</p>
              <p className="text-[10px] text-slate-400 font-normal">Quote / Spec</p>
            </div>
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Sparkles size={13} className="text-indigo-400" />
        <span>Pro Tip: 80% of sales require 5 follow-ups after the initial meeting.</span>
      </div>
    </div>
  );
}

function EmptyFollowUpsState({ onNew, tab }: { onNew: () => void; tab: string }) {
  return (
    <div className="py-16 px-6 text-center space-y-4 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
        <Sparkles size={28} />
      </div>
      <div>
        <h4 className="text-sm font-black text-white">All Caught Up In This View!</h4>
        <p className="text-xs text-slate-400 mt-1">
          {tab === 'TODAY'
            ? 'No follow-ups due today. Take initiative and schedule your next outreach.'
            : tab === 'OVERDUE'
            ? 'Awesome! No overdue follow-ups on your desk.'
            : 'No follow-ups found for the selected view.'}
        </p>
      </div>
      <button onClick={onNew} className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 shadow-md">
        <Plus size={14} /> Schedule Follow-up
      </button>
    </div>
  );
}

function SimpleCalendar({ data, onSelectFollowUp }: any) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const getFollowUpsForDay = (day: number) => {
    return (data || []).filter((d: any) => {
      const date = new Date(d.dueAt);
      return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  };

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-black text-white text-sm sm:text-base">
          {monthName} {currentYear}
        </h3>
        <div className="flex gap-1.5">
          <button onClick={handlePrev} className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNext} className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="bg-slate-950/30 rounded-xl" />;
          const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
          const items = getFollowUpsForDay(day);

          return (
            <div
              key={`day-${day}`}
              className={cn(
                'min-h-[70px] bg-slate-950 border rounded-xl p-1.5 flex flex-col hover:border-slate-600 transition-colors',
                isToday ? 'border-indigo-500/60 bg-indigo-950/20' : 'border-slate-800/80'
              )}
            >
              <span className={cn('text-[10px] font-black', isToday ? 'text-indigo-400' : 'text-slate-400')}>{day}</span>
              <div className="flex-1 space-y-1 mt-1 overflow-y-auto no-scrollbar">
                {items.slice(0, 2).map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectFollowUp(item)}
                    className="text-[9px] font-bold p-1 rounded bg-slate-900 border border-slate-800 text-slate-200 truncate cursor-pointer hover:border-indigo-400"
                  >
                    {item.title}
                  </div>
                ))}
                {items.length > 2 && (
                  <span className="text-[8px] font-bold text-slate-500 block text-center">+{items.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MODALS
// ============================================================================

function CompleteFollowUpModal({ item, onClose, onSubmit }: any) {
  const [outcome, setOutcome] = useState('Interested / Positive');
  const [notes, setNotes] = useState('');
  const [createNext, setCreateNext] = useState(false);
  const [nextDate, setNextDate] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      outcome,
      completionNotes: notes,
      createNextFollowUp: createNext,
      nextFollowUpDate: createNext ? nextDate : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <CheckCircle2 className="text-emerald-400" size={18} /> Complete Follow-up
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Communication Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Interested / Positive">Interested / Positive</option>
              <option value="Call Later / Busy">Call Later / Busy</option>
              <option value="Quotation Requested">Quotation Requested</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Not Interested">Not Interested</option>
              <option value="General Conversation">General Conversation</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Conversation Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Summary of conversation, questions asked, next step..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createNext}
                onChange={(e) => setCreateNext(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 bg-slate-950"
              />
              <span className="text-xs font-bold text-white">Schedule Next Follow-up Immediately</span>
            </label>

            {createNext && (
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Next Date</label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark]"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500">
              Save Outcome
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RescheduleModal({ item, onClose, onSubmit }: any) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({ newDate: date, newTime: time, reason });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Clock className="text-indigo-400" size={18} /> Reschedule Follow-up
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">New Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">New Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Reason for Rescheduling</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client requested Monday afternoon"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LeadOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  status?: string;
}

function CreateFollowUpModal({
  presetType = 'CALL',
  onClose,
  onCreated,
}: {
  presetType?: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsList, setLeadsList] = useState<LeadOption[]>([]);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    followUpType: presetType,
    leadId: undefined as string | undefined,
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00',
    priority: 'MEDIUM',
    purpose: '',
  });

  // Fetch available leads for selection
  useEffect(() => {
    let isMounted = true;
    const loadLeads = async () => {
      try {
        setLeadsLoading(true);
        const data = await fetchApi('/leads?limit=100', token);
        const raw = Array.isArray(data) ? data : data?.data || data?.leads || [];
        if (isMounted) {
          const parsed: LeadOption[] = raw.map((l: any) => ({
            id: String(l.id),
            name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
            phone: l.phone || l.mobilePhone || '',
            email: l.email || '',
            company: l.company || l.companyName || '',
            status: l.status?.name || l.status || 'Active',
          }));
          setLeadsList(parsed);
        }
      } catch (err) {
        console.warn('Leads fetch notice:', err);
      } finally {
        if (isMounted) setLeadsLoading(false);
      }
    };
    loadLeads();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Filtered leads based on search query
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery.trim()) return leadsList.slice(0, 8);
    const q = leadSearchQuery.toLowerCase().trim();
    return leadsList
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.phone && l.phone.includes(q)) ||
          (l.company && l.company.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [leadsList, leadSearchQuery]);

  const handleSelectLead = (lead: LeadOption) => {
    setSelectedLead(lead);
    setIsDropdownOpen(false);
    setLeadSearchQuery('');

    const typePrefix =
      formData.followUpType === 'MEETING'
        ? 'Demo & Meeting with'
        : formData.followUpType === 'CALL'
        ? 'Call with'
        : formData.followUpType === 'WHATSAPP'
        ? 'WhatsApp Follow-up with'
        : formData.followUpType === 'EMAIL'
        ? 'Email Touchpoint with'
        : 'Follow-up with';

    const suggestedTitle = `${typePrefix} ${lead.name}${lead.company ? ` (${lead.company})` : ''}`;

    setFormData((prev) => ({
      ...prev,
      leadId: lead.id,
      title: prev.title && !prev.title.startsWith('Call with') && !prev.title.startsWith('Meeting with') && !prev.title.startsWith('Demo') && !prev.title.startsWith('Follow-up with') && !prev.title.startsWith('WhatsApp') && !prev.title.startsWith('Email')
        ? prev.title
        : suggestedTitle,
    }));
  };

  const handleClearSelectedLead = () => {
    setSelectedLead(null);
    setFormData((prev) => ({ ...prev, leadId: undefined }));
  };

  const handleChannelChange = (newType: any) => {
    const typePrefix =
      newType === 'MEETING'
        ? 'Demo & Meeting with'
        : newType === 'CALL'
        ? 'Call with'
        : newType === 'WHATSAPP'
        ? 'WhatsApp Follow-up with'
        : newType === 'EMAIL'
        ? 'Email Touchpoint with'
        : 'Follow-up with';

    setFormData((prev) => ({
      ...prev,
      followUpType: newType,
      title: selectedLead
        ? `${typePrefix} ${selectedLead.name}${selectedLead.company ? ` (${selectedLead.company})` : ''}`
        : prev.title,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      await fetchApi('/follow-ups', token, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      onCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    formData.followUpType === 'MEETING'
      ? 'Schedule Product Demo / Meeting'
      : formData.followUpType === 'CALL'
      ? 'Schedule Phone Call'
      : formData.followUpType === 'WHATSAPP'
      ? 'Schedule WhatsApp Touchpoint'
      : 'Schedule New Follow-up';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            {formData.followUpType === 'MEETING' ? (
              <CalendarCheck className="text-amber-400" size={18} />
            ) : (
              <Plus className="text-indigo-400" size={18} />
            )}
            {modalTitle}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
          {/* ── 1. SEARCH & SELECT LEAD / PROSPECT ───────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User size={13} className="text-indigo-400" /> Select Lead / Prospect
              </label>
              {selectedLead && (
                <button
                  type="button"
                  onClick={handleClearSelectedLead}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Change Lead
                </button>
              )}
            </div>

            {selectedLead ? (
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
                    {selectedLead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{selectedLead.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-extrabold shrink-0 border border-indigo-500/30">
                        {selectedLead.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                      {selectedLead.phone && <span>📞 {selectedLead.phone}</span>}
                      {selectedLead.company && <span className="truncate">🏢 {selectedLead.company}</span>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedLead}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 ml-2"
                  title="Remove lead association"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <input
                    type="text"
                    placeholder="Search prospect by name, company, phone, or email..."
                    value={leadSearchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setLeadSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  {leadSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLeadSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                    {leadsLoading ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw size={13} className="animate-spin text-indigo-400" />
                        Loading assigned leads...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {leadSearchQuery ? 'No matching leads found.' : 'No leads available.'}
                      </div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0">
                              {lead.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                <span className="truncate">{lead.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
                                  {lead.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                                {lead.phone && <span>📞 {lead.phone}</span>}
                                {lead.company && <span className="truncate">🏢 {lead.company}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400 hover:underline shrink-0 ml-2">
                            Select
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 2. CHANNEL TYPE & PRIORITY ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Channel Type *</label>
              <select
                value={formData.followUpType}
                onChange={(e) => handleChannelChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="MEETING">🤝 Demo / Meeting</option>
                <option value="CALL">📞 Phone Call</option>
                <option value="WHATSAPP">💬 WhatsApp Message</option>
                <option value="EMAIL">✉️ Email Touchpoint</option>
                <option value="GENERAL">⚡ General Follow-up</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="HIGH">🔥 High Priority</option>
                <option value="MEDIUM">⚡ Medium Priority</option>
                <option value="NORMAL">Normal Priority</option>
              </select>
            </div>
          </div>

          {/* ── 3. TITLE / TOPIC ──────────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Title / Topic *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Discuss Q4 software quotation & onboarding"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* ── 4. SCHEDULED DATE & TIME ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Date *</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Time *</label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ── 5. AGENDA & NOTES ─────────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Agenda & Key Talking Points</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={2}
              placeholder="What questions to ask, key objectives, discount limits..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* ── 6. SUBMIT BUTTONS ─────────────────────────────────────────────── */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800/80">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Scheduling...
                </>
              ) : formData.followUpType === 'MEETING' ? (
                'Save & Schedule Meeting'
              ) : (
                'Save & Schedule Follow-up'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
