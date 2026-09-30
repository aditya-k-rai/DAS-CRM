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
  MoreVertical,
  X,
  CalendarDays,
  ListTodo,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetchApi = async (endpoint: string, token: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || 'API request failed');
  }
  return res.json();
};

type TabId = 'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'CALENDAR';

export default function FollowUpsModule() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('TODAY');
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [allData, setAllData] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  
  // UI state
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // Forms
  const [searchQuery, setSearchQuery] = useState('');
  
  const loadSummary = async () => {
    try {
      if (!token) return;
      const data = await fetchApi('/follow-ups/summary', token);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load follow-up summary', err);
    }
  };

  const loadTodayData = async () => {
    try {
      setLoading(true);

      if (!token) return;
      const data = await fetchApi('/follow-ups/today', token);
      setTodayData(data);
    } catch (err) {
      console.error('Failed to load today follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (statusFilter?: string) => {
    try {
      setLoading(true);

      if (!token) return;
      
      let endpoint = '/follow-ups?limit=100';
      if (statusFilter) endpoint += `&status=${statusFilter}`;
      
      const data = await fetchApi(endpoint, token);
      setAllData(data.data || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);

      if (!token) return;
      
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      
      const data = await fetchApi(`/follow-ups/calendar?dateFrom=${firstDay.toISOString()}&dateTo=${lastDay.toISOString()}`, token);
      setCalendarData(data || []);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query) return;
    try {
      setLoading(true);

      if (!token) return;
      const data = await fetchApi(`/follow-ups/search?q=${encodeURIComponent(query)}`, token);
      setAllData(data || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    
    if (activeTab === 'TODAY') {
      loadTodayData();
    } else if (activeTab === 'ALL') {
      loadAllData();
    } else if (activeTab === 'UPCOMING') {
      loadAllData('PENDING');
    } else if (activeTab === 'OVERDUE') {
      loadAllData('OVERDUE');
    } else if (activeTab === 'COMPLETED') {
      loadAllData('COMPLETED');
    } else if (activeTab === 'CALENDAR') {
      loadCalendarData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(() => performSearch(searchQuery), 500);
      return () => clearTimeout(delay);
    } else if (searchQuery.length === 0 && activeTab === 'ALL') {
      loadAllData();
    }
  }, [searchQuery]);

  // --- ACTIONS ---
  
  const handleComplete = async (payload: any) => {
    try {

      if (!token) return;
      await fetchApi(`/follow-ups/${selectedFollowUp.id}/complete`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setShowCompleteModal(false);
      setSelectedFollowUp(null);
      // Reload current tab
      if (activeTab === 'TODAY') loadTodayData();
      else loadAllData();
      loadSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to complete follow-up');
    }
  };

  const handleReschedule = async (payload: any) => {
    try {

      if (!token) return;
      await fetchApi(`/follow-ups/${selectedFollowUp.id}/reschedule`, token, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setShowRescheduleModal(false);
      setSelectedFollowUp(null);
      // Reload current tab
      if (activeTab === 'TODAY') loadTodayData();
      else loadAllData();
      loadSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule follow-up');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this follow-up?')) return;
    try {

      if (!token) return;
      await fetchApi(`/follow-ups/${id}/cancel`, token, { method: 'PATCH', body: JSON.stringify({}) });
      setSelectedFollowUp(null);
      if (activeTab === 'TODAY') loadTodayData();
      else loadAllData();
      loadSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel follow-up');
    }
  };

  // --- RENDERING HELPERS ---
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OVERDUE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DUE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'RESCHEDULED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-400';
      case 'MEDIUM': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };

  // ... (rest of the component will go here, keeping it organized)
  
  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER / SUMMARY CARDS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="text-brand-500" />
            Follow-ups
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track all your scheduled communications.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus size={16} /> New Follow-up
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setActiveTab('TODAY')}>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Today</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{summary.today || 0}</span>
              <CalendarIcon className="text-brand-400" size={20} />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setActiveTab('UPCOMING')}>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Upcoming</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{summary.upcoming || 0}</span>
              <CalendarDays className="text-sky-400" size={20} />
            </div>
          </div>
          <div className="bg-slate-900 border border-rose-900/30 rounded-xl p-4 flex flex-col justify-center cursor-pointer hover:border-rose-900/50 transition-colors" onClick={() => setActiveTab('OVERDUE')}>
            <span className="text-rose-400 text-xs font-medium uppercase tracking-wider mb-1">Overdue</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-rose-400">{summary.overdue || 0}</span>
              <AlertCircle className="text-rose-500" size={20} />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setActiveTab('COMPLETED')}>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Completed</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{summary.completed || 0}</span>
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setActiveTab('ALL')}>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Active</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{summary.total || 0}</span>
              <ListTodo className="text-slate-400" size={20} />
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        {(['TODAY', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'ALL', 'CALENDAR'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab 
                ? "border-brand-500 text-brand-400" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            )}
          >
            {tab === 'ALL' ? 'All Follow-ups' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 flex overflow-hidden">
        
        {/* LEFT LIST PANEL */}
        <div className={cn("flex flex-col border-r border-slate-800", selectedFollowUp ? "hidden lg:flex lg:w-[40%]" : "w-full")}>
          {/* List Header & Search */}
          {activeTab !== 'CALENDAR' && (
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search follow-ups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <button className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <Filter size={16} />
              </button>
            </div>
          )}

          {/* List Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                <RefreshCw className="animate-spin mr-2" size={16} /> Loading...
              </div>
            ) : activeTab === 'TODAY' && todayData ? (
              <div className="space-y-6">
                {todayData.dueNow.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Due Now</h3>
                    <div className="space-y-2">
                      {todayData.dueNow.map((item: any) => <FollowUpCard key={item.id} item={item} onSelect={setSelectedFollowUp} selected={selectedFollowUp?.id === item.id} />)}
                    </div>
                  </div>
                )}
                {todayData.missedToday.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">Missed Today</h3>
                    <div className="space-y-2">
                      {todayData.missedToday.map((item: any) => <FollowUpCard key={item.id} item={item} onSelect={setSelectedFollowUp} selected={selectedFollowUp?.id === item.id} />)}
                    </div>
                  </div>
                )}
                {todayData.upcomingToday.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Today</h3>
                    <div className="space-y-2">
                      {todayData.upcomingToday.map((item: any) => <FollowUpCard key={item.id} item={item} onSelect={setSelectedFollowUp} selected={selectedFollowUp?.id === item.id} />)}
                    </div>
                  </div>
                )}
                {todayData.completedToday.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Completed Today</h3>
                    <div className="space-y-2">
                      {todayData.completedToday.map((item: any) => <FollowUpCard key={item.id} item={item} onSelect={setSelectedFollowUp} selected={selectedFollowUp?.id === item.id} />)}
                    </div>
                  </div>
                )}
                {todayData.total === 0 && (
                  <div className="text-center text-slate-500 py-10 text-sm">No follow-ups scheduled for today.</div>
                )}
              </div>
            ) : activeTab === 'CALENDAR' ? (
              <SimpleCalendar data={calendarData} onSelectDate={(date: Date) => {}} onSelectFollowUp={setSelectedFollowUp} />
            ) : (
              <div className="space-y-2">
                {allData.length > 0 ? (
                  allData.map((item) => (
                    <FollowUpCard key={item.id} item={item} onSelect={setSelectedFollowUp} selected={selectedFollowUp?.id === item.id} />
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-10 text-sm">No follow-ups found in this view.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DETAIL PANEL */}
        <div className={cn("flex-1 bg-slate-900", selectedFollowUp ? "block" : "hidden lg:flex items-center justify-center")}>
          {!selectedFollowUp ? (
            <div className="text-center text-slate-500 flex flex-col items-center">
              <ListTodo size={48} className="text-slate-800 mb-4" />
              <p>Select a follow-up to view details</p>
            </div>
          ) : (
            <FollowUpDetails 
              item={selectedFollowUp} 
              onClose={() => setSelectedFollowUp(null)}
              onComplete={() => setShowCompleteModal(true)}
              onReschedule={() => setShowRescheduleModal(true)}
              onCancel={() => handleCancel(selectedFollowUp.id)}
            />
          )}
        </div>
      </div>
      
      {/* MODALS */}
      {showCreateModal && <CreateFollowUpModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); loadSummary(); activeTab==='TODAY'?loadTodayData():loadAllData(); }} />}
      {showCompleteModal && selectedFollowUp && <CompleteFollowUpModal item={selectedFollowUp} onClose={() => setShowCompleteModal(false)} onSubmit={handleComplete} />}
      {showRescheduleModal && selectedFollowUp && <RescheduleModal item={selectedFollowUp} onClose={() => setShowRescheduleModal(false)} onSubmit={handleReschedule} />}
      
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function FollowUpCard({ item, onSelect, selected }: { item: any; onSelect: (i:any)=>void; selected: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'OVERDUE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DUE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const Icon = item.followUpType === 'CALL' ? Phone : item.followUpType === 'WHATSAPP' ? MessageCircle : item.followUpType === 'EMAIL' ? Mail : Clock;

  return (
    <div 
      onClick={() => onSelect(item)}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all hover:bg-slate-800/50",
        selected ? "bg-slate-800 border-brand-500/50" : "bg-slate-950 border-slate-800"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ml-2", getStatusColor(item.computedStatus))}>
          {item.computedStatus}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={12} />
          {new Date(item.dueAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          {new Date(item.dueAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon size={12} />
          {item.followUpType || 'GENERAL'}
        </div>
      </div>
      
      {item.lead && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
            {item.lead.firstName.charAt(0)}{item.lead.lastName?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-slate-300 truncate">{item.lead.firstName} {item.lead.lastName}</p>
            {item.lead.company && <p className="text-[10px] text-slate-500 truncate">{item.lead.company.name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function FollowUpDetails({ item, onClose, onComplete, onReschedule, onCancel }: any) {
  const Icon = item.followUpType === 'CALL' ? Phone : item.followUpType === 'WHATSAPP' ? MessageCircle : item.followUpType === 'EMAIL' ? Mail : Clock;
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="lg:hidden p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{item.title}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1"><CalendarIcon size={12}/> {new Date(item.dueAt).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Icon size={12}/> {item.followUpType || 'GENERAL'}</span>
              <span className={cn("font-medium", item.priority === 'HIGH' ? 'text-rose-400' : item.priority === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400')}>
                {item.priority} Priority
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
            <>
              <button onClick={onReschedule} className="btn-secondary text-xs px-3 py-1.5 h-auto">Reschedule</button>
              <button onClick={onComplete} className="btn-primary text-xs px-3 py-1.5 h-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-emerald-500/20">
                <CheckCircle2 size={14} className="mr-1.5"/> Complete
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* Status Banner */}
        {item.computedStatus === 'OVERDUE' && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-sm font-semibold text-rose-400">This follow-up is overdue</h4>
              <p className="text-xs text-rose-400/80 mt-0.5">It was scheduled for {new Date(item.dueAt).toLocaleString()}. Please complete or reschedule it.</p>
            </div>
          </div>
        )}
        
        {item.computedStatus === 'COMPLETED' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 size={16} /> Completed on {new Date(item.completedAt).toLocaleString()}
            </div>
            {item.outcome && (
              <div className="mt-2 text-sm">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Outcome</span>
                <span className="text-emerald-100">{item.outcome}</span>
              </div>
            )}
            {item.completionNotes && (
              <div className="mt-2 text-sm">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">Notes</span>
                <span className="text-slate-300">{item.completionNotes}</span>
              </div>
            )}
          </div>
        )}

        {/* Lead Info */}
        {item.lead && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Linked Prospect</h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm border border-brand-500/30">
                  {item.lead.firstName.charAt(0)}{item.lead.lastName?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.lead.firstName} {item.lead.lastName}</h4>
                  <p className="text-xs text-slate-400">{item.lead.company?.name || 'No Company'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {item.lead.phone && (
                  <button className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                    <Phone size={14} />
                  </button>
                )}
                {item.lead.phone && (
                  <button className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle size={14} />
                  </button>
                )}
                {item.lead.email && (
                  <button className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-colors">
                    <Mail size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.purpose && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purpose / Agenda</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.purpose}</p>
            </div>
          )}
          {item.description && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
          {item.lastInteraction && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Interaction Summary</h3>
              <p className="text-sm text-slate-300">{item.lastInteraction}</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Created {new Date(item.createdAt).toLocaleDateString()} by {item.createdBy?.firstName} {item.createdBy?.lastName}
          </div>
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
            <button onClick={onCancel} className="text-xs text-rose-400 hover:text-rose-300">
              Cancel Follow-up
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function SimpleCalendar({ data, onSelectDate, onSelectFollowUp }: any) {
  // Ultra-simple rendering of the current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const getFollowUpsForDay = (day: number) => {
    return data.filter((d: any) => {
      const date = new Date(d.dueAt);
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
    });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-lg">{now.toLocaleString('default', { month: 'long' })} {year}</h3>
        <div className="flex gap-2">
          <button className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"><ChevronLeft size={16}/></button>
          <button className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"><ChevronRight size={16}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="bg-slate-900/20 rounded-xl" />;
          
          const isToday = day === now.getDate();
          const items = getFollowUpsForDay(day);
          
          return (
            <div 
              key={`day-${day}`} 
              className={cn(
                "bg-slate-950 border rounded-xl p-2 flex flex-col hover:border-slate-600 transition-colors cursor-pointer",
                isToday ? "border-brand-500/50" : "border-slate-800"
              )}
              onClick={() => onSelectDate(new Date(year, month, day))}
            >
              <div className={cn("text-xs font-semibold mb-1", isToday ? "text-brand-400" : "text-slate-400")}>
                {day}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {items.slice(0, 3).map((item: any) => (
                  <div 
                    key={item.id}
                    onClick={(e) => { e.stopPropagation(); onSelectFollowUp(item); }}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded truncate",
                      item.isCompleted ? "bg-emerald-500/10 text-emerald-400" :
                      item.computedStatus === 'OVERDUE' ? "bg-rose-500/10 text-rose-400" :
                      "bg-sky-500/10 text-sky-400"
                    )}
                  >
                    {new Date(item.dueAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} {item.title}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-slate-500 px-1 text-center">+{items.length - 3} more</div>
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
  const [outcome, setOutcome] = useState('Interested');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2"><CheckCircle2 className="text-emerald-400" size={18}/> Complete Follow-up</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Outcome</label>
            <select value={outcome} onChange={e=>setOutcome(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="Interested">Interested / Positive</option>
              <option value="Call Later">Call Later / Busy</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Quotation Requested">Quotation Requested</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Completion Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="What was discussed?" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"></textarea>
          </div>
          
          <div className="pt-3 border-t border-slate-800/50">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={createNext} onChange={e=>setCreateNext(e.target.checked)} className="rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-950" />
              <span className="text-sm font-medium text-white">Create next follow-up?</span>
            </label>
            
            {createNext && (
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Next Follow-up Date</label>
                <input type="date" required value={nextDate} onChange={e=>setNextDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
              </div>
            )}
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white">Mark Complete</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RescheduleModal({ item, onClose, onSubmit }: any) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  
  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({ newDate: date, newTime: time, reason });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2"><CalendarIcon className="text-brand-400" size={18}/> Reschedule</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">New Date *</label>
              <input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">New Time</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Reason (Optional)</label>
            <input type="text" value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Client requested delay" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateFollowUpModal({ onClose, onCreated }: any) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    followUpType: 'CALL',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'MEDIUM',
    purpose: '',
  });
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!token) return;
      await fetchApi('/follow-ups', token, { method: 'POST', body: JSON.stringify(formData) });
      onCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2"><Plus className="text-brand-400" size={18}/> New Follow-up</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Title *</label>
            <input type="text" required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="e.g. Call regarding pricing" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Type *</label>
              <select value={formData.followUpType} onChange={e=>setFormData({...formData, followUpType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Priority</label>
              <select value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Date *</label>
              <input type="date" required value={formData.scheduledDate} onChange={e=>setFormData({...formData, scheduledDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Time *</label>
              <input type="time" required value={formData.scheduledTime} onChange={e=>setFormData({...formData, scheduledTime: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Purpose / Agenda</label>
            <textarea value={formData.purpose} onChange={e=>setFormData({...formData, purpose: e.target.value})} rows={2} placeholder="What needs to be discussed?" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"></textarea>
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
