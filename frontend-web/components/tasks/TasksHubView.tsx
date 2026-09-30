'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckSquare, Clock, Calendar, Plus, Filter, Search, CheckCircle2,
  AlertCircle, Users, ArrowRight, Trash2, X, Phone, Video, RefreshCw,
  User, Building2, CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  type: 'FOLLOW_UP' | 'MEETING' | 'CALL' | 'TODO';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  dueTime?: string;
  leadName?: string;
  assigneeName?: string;
  isCompleted: boolean;
  completedAt?: string;
}

const INITIAL_DEMO_TASKS: TaskRecord[] = [
  {
    id: 'tsk-101',
    title: 'Call prospect for software demo requirement',
    description: 'Review custom ERP features requested by Aditya during initial inquiry',
    type: 'FOLLOW_UP',
    priority: 'HIGH',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '11:30 AM',
    leadName: 'Aditya Kumar (Apex Dynamics)',
    assigneeName: 'Sales Representative',
    isCompleted: false,
  },
  {
    id: 'tsk-102',
    title: 'Product Walkthrough & Quotation Review',
    description: 'Virtual demo call with procurement team to finalize pricing tiers',
    type: 'MEETING',
    priority: 'HIGH',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '03:00 PM',
    leadName: 'Rajesh Sharma (NexTech)',
    assigneeName: 'Sales Representative',
    isCompleted: false,
  },
  {
    id: 'tsk-103',
    title: 'Follow-up on payment terms and contract signature',
    description: 'Check if legal team reviewed MSA draft sent yesterday',
    type: 'FOLLOW_UP',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '02:00 PM',
    leadName: 'Pooja Verma (Starlight Logistics)',
    assigneeName: 'Sales Representative',
    isCompleted: false,
  },
  {
    id: 'tsk-104',
    title: 'Quarterly Team Performance & Pipeline Check-in',
    description: 'TL alignment session on lead conversions and monthly quotas',
    type: 'MEETING',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '05:00 PM',
    leadName: 'Internal Team',
    assigneeName: 'Team Leader',
    isCompleted: false,
  },
  {
    id: 'tsk-105',
    title: 'Touch base with cold lead regarding new promo discount',
    description: 'Offer 15% discount before quarter close',
    type: 'CALL',
    priority: 'LOW',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '04:30 PM',
    leadName: 'Vikram Joshi (Metro Infra)',
    assigneeName: 'Sales Representative',
    isCompleted: true,
    completedAt: '10:15 AM',
  },
];

export function TasksHubView() {
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<TaskRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('@das_crm_tasks_v1');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_DEMO_TASKS;
  });

  const [activeTab, setActiveTab] = useState<'ALL' | 'FOLLOW_UP' | 'MEETING' | 'CALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'FOLLOW_UP' | 'MEETING' | 'CALL' | 'TODO'>('FOLLOW_UP');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newLeadName, setNewLeadName] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueTime, setNewDueTime] = useState('11:00 AM');
  const [newDescription, setNewDescription] = useState('');

  // Searchable lead picker state
  const [leadsList, setLeadsList] = useState<Array<{ id: string; name: string; phone?: string; company?: string; status?: string }>>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string; phone?: string; company?: string; status?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch available leads for activity scheduling
  useEffect(() => {
    let isMounted = true;
    const loadLeads = async () => {
      try {
        setLeadsLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        const res = await fetch(`${apiBase}/leads?limit=100`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : data?.data || data?.leads || [];
          const parsed = raw.map((l: any) => ({
            id: String(l.id),
            name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
            phone: l.phone || l.mobilePhone || '',
            company: l.company || l.companyName || '',
            status: l.status?.name || l.status || 'Active',
          }));
          setLeadsList(parsed);
        }
      } catch (err) {
        console.warn('Leads fetch notice in TasksHubView:', err);
      } finally {
        if (isMounted) setLeadsLoading(false);
      }
    };
    loadLeads();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery.trim()) return leadsList.slice(0, 8);
    const q = leadSearchQuery.toLowerCase().trim();
    return leadsList
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.phone && l.phone.includes(q)) ||
          (l.company && l.company.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [leadsList, leadSearchQuery]);

  const handleSelectLeadInTask = (lead: { id: string; name: string; phone?: string; company?: string; status?: string }) => {
    setSelectedLead(lead);
    setIsDropdownOpen(false);
    setLeadSearchQuery('');
    setNewLeadName(lead.name + (lead.company ? ` (${lead.company})` : ''));

    const typePrefix =
      newType === 'MEETING'
        ? 'Demo & Meeting with'
        : newType === 'CALL'
        ? 'Call with'
        : 'Follow-up with';

    if (!newTitle || newTitle.startsWith('Call with') || newTitle.startsWith('Demo') || newTitle.startsWith('Meeting') || newTitle.startsWith('Follow-up with')) {
      setNewTitle(`${typePrefix} ${lead.name}${lead.company ? ` (${lead.company})` : ''}`);
    }
  };

  const handleClearLeadInTask = () => {
    setSelectedLead(null);
    setNewLeadName('');
  };

  // Sync tab with URL search params (e.g. ?type=follow-up or ?type=meeting or ?filter=follow-ups)
  useEffect(() => {
    if (!searchParams) return;
    const typeParam = searchParams.get('type')?.toLowerCase();
    const filterParam = searchParams.get('filter')?.toLowerCase();

    if (typeParam === 'follow-up' || filterParam === 'follow-ups') {
      setActiveTab('FOLLOW_UP');
    } else if (typeParam === 'meeting') {
      setActiveTab('MEETING');
    } else if (typeParam === 'call') {
      setActiveTab('CALL');
    } else {
      setActiveTab('ALL');
    }
  }, [searchParams]);

  // Persist tasks in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('@das_crm_tasks_v1', JSON.stringify(tasks));
    } catch (_) {}
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle complete state
  const handleToggleComplete = async (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      }
      return t;
    });
    setTasks(updated);

    const task = tasks.find(t => t.id === taskId);
    showToast(task?.isCompleted ? `Task restored to pending.` : `✓ Task marked as complete!`);

    // Attempt backend sync
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      if (token) {
        await fetch(`${apiBase}/tasks/${taskId}/complete`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (_) {}
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Task removed from workspace.');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a task title.');
      return;
    }

    const newTask: TaskRecord = {
      id: `tsk-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      priority: newPriority,
      leadName: newLeadName.trim() || undefined,
      dueDate: newDueDate,
      dueTime: newDueTime,
      description: newDescription.trim() || undefined,
      assigneeName: currentUser?.name || 'Assigned User',
      isCompleted: false,
    };

    setTasks(prev => [newTask, ...prev]);
    setShowCreateModal(false);
    showToast(`✓ Scheduled: "${newTask.title}" added to schedule!`);

    // Reset form
    setNewTitle('');
    setNewLeadName('');
    setNewDescription('');
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTab !== 'ALL' && t.type !== activeTab) return false;
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          t.title.toLowerCase().includes(q) ||
          (t.leadName && t.leadName.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [tasks, activeTab, filterPriority, searchQuery]);

  // Today's schedule items
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.isCompleted);

  const getHeaderInfo = () => {
    if (activeTab === 'FOLLOW_UP') {
      return {
        title: 'Client Follow-ups & Reminders',
        subtitle: 'Stay on top of every prospect relationship and never miss a critical touchpoint.',
      };
    }
    if (activeTab === 'MEETING') {
      return {
        title: 'Scheduled Meetings & Demos',
        subtitle: 'Live demos, client discovery sessions, and negotiation calls.',
      };
    }
    if (activeTab === 'CALL') {
      return {
        title: 'Client Calls & Outreach',
        subtitle: 'Outbound and inbound phone touchpoints logged with client leads.',
      };
    }
    return {
      title: 'Tasks & Activity Calendar',
      subtitle: 'Unified workspace hub for follow-ups, meetings, and client obligations.',
    };
  };

  const header = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-indigo-400/40 animate-in fade-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CheckSquare className="text-indigo-400" size={22} />
            {header.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{header.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={15} />
            Schedule Follow-up / Task
          </button>
        </div>
      </div>

      {/* Control bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Activities', count: tasks.length },
            { id: 'FOLLOW_UP', label: 'Follow-ups', count: tasks.filter(t => t.type === 'FOLLOW_UP').length },
            { id: 'MEETING', label: 'Meetings', count: tasks.filter(t => t.type === 'MEETING').length },
            { id: 'CALL', label: 'Calls', count: tasks.filter(t => t.type === 'CALL').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full',
                activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, clients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Tasks Table / Cards + Today's Schedule Sidebar */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Task List (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <CheckSquare size={36} className="text-slate-600 mb-2.5" />
              <h4 className="text-sm font-bold text-white">No tasks matching your filter</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Schedule a new client follow-up, meeting or call to maintain momentum on opportunities.
              </p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isHigh = task.priority === 'HIGH';
              const isMedium = task.priority === 'MEDIUM';

              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all flex items-start gap-3.5 group',
                    task.isCompleted
                      ? 'bg-slate-950/40 border-slate-850 opacity-60'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 shadow-sm'
                  )}
                >
                  {/* Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                    title={task.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <CheckCircle2
                      size={20}
                      className={cn(
                        'transition-colors',
                        task.isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-600 hover:text-indigo-400'
                      )}
                    />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        task.type === 'FOLLOW_UP' && 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                        task.type === 'MEETING' && 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                        task.type === 'CALL' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                        task.type === 'TODO' && 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      )}>
                        {task.type.replace('_', ' ')}
                      </span>

                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                        isHigh && 'bg-rose-500/15 text-rose-400',
                        isMedium && 'bg-amber-500/15 text-amber-400',
                        !isHigh && !isMedium && 'bg-slate-800 text-slate-400'
                      )}>
                        {task.priority}
                      </span>

                      {task.leadName && (
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          · {task.leadName}
                        </span>
                      )}
                    </div>

                    <h4 className={cn(
                      'text-sm font-semibold text-white mt-1.5 leading-snug',
                      task.isCompleted && 'line-through text-slate-500'
                    )}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-400" />
                        {task.dueDate} {task.dueTime && `(${task.dueTime})`}
                      </span>
                      {task.assigneeName && (
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-500" />
                          {task.assigneeName}
                        </span>
                      )}
                      {task.isCompleted && task.completedAt && (
                        <span className="text-emerald-400 font-medium">
                          Completed at {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Schedule & Overview (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Today's Schedule Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock size={14} className="text-indigo-400" />
                Today's Schedule
              </h3>
              <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {todayTasks.length} Due
              </span>
            </div>

            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                  <CheckCircle2 size={24} className="mx-auto mb-1.5 text-emerald-400/80" />
                  <p className="text-xs font-bold text-white">All caught up for today!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No overdue follow-ups or meetings scheduled.</p>
                </div>
              ) : (
                todayTasks.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.leadName || 'General Follow-up'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md flex-shrink-0">
                      {item.dueTime || 'Today'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Productivity Tip Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              🎯 Pro Tip for Sales Reps &amp; TLs
            </h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Leads contacted within 15 minutes of status update convert 3x higher. Schedule next-step follow-ups immediately following any prospect call.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Schedule Follow-up / Task */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🗓️ Schedule Activity
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Title / Activity *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call client to discuss commercial proposal"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Activity Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="MEETING">Meeting / Demo</option>
                    <option value="CALL">Phone Call</option>
                    <option value="TODO">To-Do Task</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Searchable Lead Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <User size={13} className="text-indigo-400" /> Related Client / Lead
                  </label>
                  {selectedLead && (
                    <button
                      type="button"
                      onClick={handleClearLeadInTask}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {selectedLead ? (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
                        {selectedLead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{selectedLead.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold shrink-0">
                            {selectedLead.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                          {selectedLead.phone && <span>📞 {selectedLead.phone}</span>}
                          {selectedLead.company && <span className="truncate">🏢 {selectedLead.company}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearLeadInTask}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                      <input
                        type="text"
                        placeholder="Search lead by name, company, or phone..."
                        value={newLeadName || leadSearchQuery}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => {
                          setNewLeadName(e.target.value);
                          setLeadSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      {(newLeadName || leadSearchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewLeadName('');
                            setLeadSearchQuery('');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                        {leadsLoading ? (
                          <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw size={13} className="animate-spin text-indigo-400" />
                            Loading assigned leads...
                          </div>
                        ) : filteredLeads.length === 0 ? (
                          <div className="p-2.5 text-center text-xs text-slate-400">
                            {leadSearchQuery ? 'No matching leads. (Custom text will be saved)' : 'No leads found.'}
                          </div>
                        ) : (
                          filteredLeads.map((lead) => (
                            <div
                              key={lead.id}
                              onClick={() => handleSelectLeadInTask(lead)}
                              className="p-2 hover:bg-slate-900 cursor-pointer flex items-center justify-between transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {lead.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate">{lead.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {lead.company || lead.phone || 'Direct'}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-400 shrink-0 ml-2">Select</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Due Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 02:30 PM"
                    value={newDueTime}
                    onChange={e => setNewDueTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional context, agenda or action points..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Schedule Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
