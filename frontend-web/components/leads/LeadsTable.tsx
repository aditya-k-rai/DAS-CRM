'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Phone, Mail, MoreHorizontal, ExternalLink, Star, Shield, Lock, ArrowLeftRight, Edit3, MoveLeft, MoveRight, Maximize2, Table, LayoutList, GitBranch, Brain, Filter, User, Calendar, RotateCcw, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LeadAllocationTrail, AllocationEvent } from './LeadAllocationTrail';
import { AILeadScoreCell, generateMockAIScore, AIScoreData } from './AILeadScoreCell';

interface LeadDataWeb {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  statusColor: string;
  source: string;
  score: number;
  aiScore?: AIScoreData;
  owner: string;
  value: string;
  created: string;
  tags: string[];
  city: string;
  budget: string;
  requirement: string;
  // Allocation & Assignment Chain
  allocationTrail?: AllocationEvent[];
  currentAssignee?: string;
  currentAssigneeRole?: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
  // Call History & Telemetry Summaries
  totalCalls?: number;
  lastCalledAt?: string;
}

const LEADS: LeadDataWeb[] = [
  {
    id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210',
    status: 'Qualified', statusColor: '#3b82f6', source: 'Website', score: 85,
    aiScore: generateMockAIScore(8.7),
    owner: 'Rajesh K.', value: '₹2,40,000', created: 'Aug 9, 2026',
    tags: ['hot', 'real-estate'], city: 'Delhi NCR', budget: '₹2.5L - ₹5L', requirement: '50-Seat Enterprise CRM',
    currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 6, lastCalledAt: 'Today 2:45 PM',
    allocationTrail: [
      { id: 'a1', fromRole: 'ADMIN', fromName: 'Super Admin', toRole: 'MANAGER', toName: 'Vikram Singh (Manager A)', action: 'ALLOCATED', assignedAt: '2026-08-09T08:00:00+05:30', note: 'High-value enterprise lead from Website campaign.' },
      { id: 'a2', fromRole: 'MANAGER', fromName: 'Vikram Singh (Manager A)', toRole: 'TEAM_LEADER', toName: 'Priya Sharma (TL A)', action: 'ALLOCATED', assignedAt: '2026-08-09T09:30:00+05:30', note: 'Delhi NCR territory. CRM vertical.' },
      { id: 'a3', fromRole: 'TEAM_LEADER', fromName: 'Priya Sharma (TL A)', toRole: 'SALES_EXEC', toName: 'Rajesh K. (Sales Rep)', action: 'ALLOCATED', assignedAt: '2026-08-09T10:45:00+05:30', note: 'Assigned for outreach. Follow up by EOD.' },
    ],
  },
  {
    id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109',
    status: 'New', statusColor: '#6366f1', source: 'LinkedIn', score: 72,
    aiScore: generateMockAIScore(7.5),
    owner: 'Priya S.', value: '₹1,80,000', created: 'Aug 9, 2026',
    tags: ['warm'], city: 'Mumbai', budget: '₹1.5L - ₹3L', requirement: 'WhatsApp Bot Integration',
    currentAssignee: 'Priya S. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC',
    totalCalls: 3, lastCalledAt: 'Yesterday 4:20 PM',
    allocationTrail: [
      { id: 'b1', fromRole: 'ADMIN', fromName: 'Super Admin', toRole: 'MANAGER', toName: 'Anil Kumar (Manager B)', action: 'ALLOCATED', assignedAt: '2026-08-09T08:15:00+05:30', note: 'LinkedIn inbound lead.' },
      { id: 'b2', fromRole: 'MANAGER', fromName: 'Anil Kumar (Manager B)', toRole: 'SALES_EXEC', toName: 'Priya S. (Sales Rep)', action: 'ALLOCATED', assignedAt: '2026-08-09T11:00:00+05:30', note: 'Direct assignment — small ticket, no TL needed.' },
    ],
  },
  { id: '3', name: 'TechCorp Ltd', email: 'contact@techcorp.com', phone: '+91 22 1234 5678', status: 'Proposal', statusColor: '#8b5cf6', source: 'Referral', score: 91, aiScore: generateMockAIScore(9.2), owner: 'Rajesh K.', value: '₹5,20,000', created: 'Aug 8, 2026', tags: ['hot', 'enterprise'], city: 'Bengaluru', budget: '₹5L+', requirement: 'AI Scoring Engine Pro', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '4', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 76543 21098', status: 'Contacted', statusColor: '#f59e0b', source: 'Cold Call', score: 58, aiScore: generateMockAIScore(5.2), owner: 'Amit P.', value: '₹90,000', created: 'Aug 8, 2026', tags: [], city: 'Ahmedabad', budget: '₹50k - ₹1L', requirement: 'Cloud Telemetry License', currentAssignee: 'Amit P. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '5', name: 'Sunita Real Estate', email: 'info@sunita.com', phone: '+91 44 9876 5432', status: 'Negotiation', statusColor: '#ec4899', source: 'Events', score: 77, aiScore: generateMockAIScore(8.4), owner: 'Rajesh K.', value: '₹8,50,000', created: 'Aug 7, 2026', tags: ['warm'], city: 'Chennai', budget: '₹7L - ₹10L', requirement: 'Full CRM Suite + Mobile App', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '6', name: 'Construkt Inc.', email: 'bd@construkt.in', phone: '+91 80 1111 2222', status: 'New', statusColor: '#6366f1', source: 'Website', score: 63, aiScore: generateMockAIScore(6.1), owner: 'Priya S.', value: '₹3,60,000', created: 'Aug 7, 2026', tags: ['construction'], city: 'Pune', budget: '₹3L - ₹5L', requirement: 'Lead Scoring Engine', currentAssignee: 'Priya S. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '7', name: 'Lakshmi Automobiles', email: 'sales@lakshmi.com', phone: '+91 99887 76655', status: 'Won', statusColor: '#22c55e', source: 'Events', score: 98, aiScore: generateMockAIScore(9.8), owner: 'Rajesh K.', value: '₹12,00,000', created: 'Aug 6, 2026', tags: ['auto', 'won'], city: 'Hyderabad', budget: '₹10L+', requirement: 'Custom Workflow + Auto Dialer', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
];

export const isLeadContactedAndLocked = (lead: { status?: string; stage?: string; totalCalls?: number; lastCalledAt?: string }) => {
  if ((lead.totalCalls || 0) > 0) return true;
  if (lead.lastCalledAt && lead.lastCalledAt !== 'Never' && lead.lastCalledAt !== '—') return true;
  const s = (lead.status || lead.stage || '').toUpperCase();
  if (s.includes('CONTACT') || s.includes('QUALIFIED') || s.includes('NEGOTIAT') || s.includes('PROPOSAL') || s.includes('WON') || s.includes('FOLLOW')) {
    return true;
  }
  return false;
};

const STATUSES = ['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadsTable() {
  const [leadsList, setLeadsList] = useState<LeadDataWeb[]>(LEADS);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [isExcelMode, setIsExcelMode] = useState(true);
  const [expandedTrailLeadId, setExpandedTrailLeadId] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Multi-Dimensional Filtering State
  const [filterPerson, setFilterPerson] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Excel Interactive Column Order State
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'status', 'aiScore', 'value', 'owner', 'city', 'budget', 'requirement', 'source', 'created'
  ]);

  // Dynamic Column Names (Renameable)
  const [columnTitles, setColumnTitles] = useState<Record<string, string>>({
    name: 'Lead Name / Client',
    status: 'Status',
    aiScore: 'AI Score',
    value: 'Lead Value',
    owner: 'Assigned Rep',
    city: 'City',
    budget: 'Budget',
    requirement: 'Requirement',
    source: 'Source',
    created: 'Created Date',
  });

  // Column Width Resizers
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 240,
    status: 130,
    aiScore: 110,
    value: 130,
    owner: 140,
    city: 120,
    budget: 130,
    requirement: 180,
    source: 110,
    created: 110,
  });

  // Rename Header Modal State
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');

  const userRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userName = currentUser?.name || 'Mighty Rai';
  const isRep = !userRole.includes('ADMIN');

  const filtered = leadsList.filter((l) => {
    // 🔒 Role-Based Data Isolation Scoping (Except Admin)
    if (!userRole.includes('ADMIN')) {
      if (userRole.includes('MANAGER')) {
        // Manager A sees only Manager A's allocated leads or team leads
        if (l.allocationTrail) {
          const inTrail = l.allocationTrail.some((a) => a.toRole === 'MANAGER' && a.toName.toLowerCase().includes(userName.toLowerCase()));
          if (!inTrail && !l.owner.toLowerCase().includes(userName.toLowerCase())) return false;
        }
      } else if (userRole.includes('TL') || userRole.includes('LEADER')) {
        // TL A sees only TL A's allocated leads or sales rep leads under TL A
        if (l.allocationTrail) {
          const inTrail = l.allocationTrail.some((a) => a.toRole === 'TEAM_LEADER' && a.toName.toLowerCase().includes(userName.toLowerCase()));
          if (!inTrail && !l.owner.toLowerCase().includes(userName.toLowerCase())) return false;
        }
      } else {
        // Sales Rep (e.g. Amit Patel): can ONLY see leads explicitly assigned to him
        const isAssignedToUser = l.owner.toLowerCase().includes(userName.toLowerCase()) || (l.currentAssignee && l.currentAssignee.toLowerCase().includes(userName.toLowerCase()));
        if (!isAssignedToUser) return false;
      }
    }

    // 👤 Person-Wise Filtering
    if (filterPerson !== 'ALL') {
      if (filterPerson === 'UNASSIGNED') {
        const isUnassigned = !l.owner || l.owner === 'Unassigned' || !l.currentAssignee || l.currentAssignee === 'Unassigned';
        if (!isUnassigned) return false;
      } else {
        const matchesOwner = l.owner.toLowerCase().includes(filterPerson.toLowerCase());
        const matchesAssignee = l.currentAssignee ? l.currentAssignee.toLowerCase().includes(filterPerson.toLowerCase()) : false;
        if (!matchesOwner && !matchesAssignee) return false;
      }
    }

    // 🛡️ Role-Wise Filtering
    if (filterRole !== 'ALL') {
      if (filterRole === 'UNASSIGNED') {
        if (l.currentAssigneeRole) return false;
      } else {
        if (l.currentAssigneeRole !== filterRole) return false;
      }
    }

    // 📅 Date-Wise Filtering
    if (filterDate !== 'ALL') {
      const createdStr = l.created.toLowerCase();
      if (filterDate === 'TODAY' && (!createdStr.includes('today') && !createdStr.includes('aug 9'))) return false;
      if (filterDate === 'YESTERDAY' && (!createdStr.includes('yesterday') && !createdStr.includes('aug 8'))) return false;
      if (filterDate === 'THIS_MONTH' && !createdStr.includes('aug')) return false;
    }

    // 📌 Status/Stage Filtering (Tabs or Modal)
    if (filterStatus !== 'ALL') {
      if (l.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    }

    // Status tab filter
    const matchStatusTab = activeStatus === 'All' || l.status === activeStatus;
    if (!matchStatusTab) return false;

    // Multi-field search — works identically in BOTH Excel Grid & Standard Tab view
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchSearch =
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.owner.toLowerCase().includes(q) ||
        l.value.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.budget.toLowerCase().includes(q) ||
        l.requirement.toLowerCase().includes(q) ||
        l.created.toLowerCase().includes(q) ||
        l.tags.some(tag => tag.toLowerCase().includes(q)) ||
        String(l.score).includes(q);
      if (!matchSearch) return false;
    }

    return true;
  });

  const activeFilterCount =
    (filterPerson !== 'ALL' ? 1 : 0) +
    (filterRole !== 'ALL' ? 1 : 0) +
    (filterDate !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0);

  const resetFilters = () => {
    setFilterPerson('ALL');
    setFilterRole('ALL');
    setFilterDate('ALL');
    setFilterStatus('ALL');
    setActiveStatus('All');
  };

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Shift Column Left or Right
  const moveColumn = (colKey: string, direction: 'left' | 'right') => {
    const idx = columnOrder.indexOf(colKey);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= columnOrder.length) return;

    const newOrder = [...columnOrder];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setColumnOrder(newOrder);
  };

  // Cycle Column Widths (110px -> 180px -> 280px -> 110px)
  const cycleWidth = (colKey: string) => {
    setColumnWidths(prev => {
      const current = prev[colKey] || 140;
      const next = current <= 130 ? 180 : current <= 200 ? 280 : 110;
      return { ...prev, [colKey]: next };
    });
  };

  // Handle Header Title Save
  const handleSaveHeaderTitle = () => {
    if (editingColKey && newTitleInput.trim()) {
      setColumnTitles(prev => ({ ...prev, [editingColKey]: newTitleInput.trim() }));
      setEditingColKey(null);
    }
  };

  return (
    <div className="crm-card overflow-hidden p-0 space-y-0">
      {/* Role Scoping Banner */}
      {isRep && (
        <div className="bg-indigo-500/15 border-b border-indigo-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Lock size={13} />
            <span>Role Access Restriction (SALES_EXEC): Viewing assigned leads only for <strong>{currentUser.name}</strong>.</span>
          </div>
          <span className="font-semibold text-brand-400">Scoped View</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b flex flex-col gap-3" style={{ borderColor: 'rgb(var(--border))' }}>
          {/* View Toggle, Multi-Filter Launcher & Status Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap items-center">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setActiveStatus(s)} className={`pill-tab text-xs py-1 px-3 ${activeStatus === s ? 'active' : ''}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Right Action Tools: Multi-Filter Trigger & Data Grid Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  activeFilterCount > 0
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Filter size={14} className={activeFilterCount > 0 ? 'text-indigo-400' : 'text-slate-400'} />
                <span>🎛️ Multi-Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsExcelMode(!isExcelMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isExcelMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-muted border-slate-800 hover:text-white'
                }`}
              >
                <Table size={14} />
                <span>{isExcelMode ? '📊 Interactive Excel Data Grid' : '📋 Standard List View'}</span>
              </button>
            </div>
          </div>

          {/* Quick Person Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-t border-b border-slate-800/60 text-xs">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 pr-1">
              <User size={12} className="text-slate-500" /> Person:
            </span>
            {[
              { id: 'ALL', label: 'All Persons' },
              { id: 'Rajesh', label: 'Rajesh K. (Sales)' },
              { id: 'Priya', label: 'Priya S. (Sales)' },
              { id: 'Amit', label: 'Amit P. (Sales)' },
              { id: 'UNASSIGNED', label: 'Unassigned Leads' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterPerson(item.id)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                  filterPerson === item.id
                    ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="ml-auto text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pl-2"
              >
                <RotateCcw size={11} /> Reset All ({activeFilterCount})
              </button>
            )}
          </div>

        {/* Search row — full-width, multi-field, works in both Excel & Standard view */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="crm-input pl-9 pr-9 h-9 w-full text-sm"
              placeholder="🔍 Search by name, email, phone, status, city, budget, requirement, source, rep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm font-bold px-1 rounded"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Count + Active Field Indicator */}
          {search.trim() && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                filtered.length > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}>
                {filtered.length > 0 ? `✓ ${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : '✗ No results'}
              </span>
            </div>
          )}

          {/* Bulk Actions (when rows selected) */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'rgb(var(--muted-foreground))' }}>
              <span className="font-medium" style={{ color: 'rgb(var(--brand-400))' }}>{selected.length} selected</span>
              <button className="btn-secondary text-xs py-1 px-3">Assign</button>
              <button className="btn-secondary text-xs py-1 px-3">Change Status</button>
            </div>
          )}
        </div>
      </div>

      {/* Table (Excel Spreadsheet Grid View vs Standard) */}
      <div className="overflow-x-auto">
        <table className="crm-table w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/80">
              <th className="w-10 px-3 py-3 border-b border-slate-800">
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? filtered.map((l) => l.id) : [])}
                  checked={selected.length === filtered.length && filtered.length > 0}
                />
              </th>

              {columnOrder.map((colKey) => (
                <th
                  key={colKey}
                  style={{ width: columnWidths[colKey] }}
                  className="px-3 py-2.5 border-b border-r border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider relative group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{columnTitles[colKey]}</span>

                    {/* Excel Column Tools (Reorder, Rename, Resize) */}
                    {isExcelMode && (
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {/* Shift Left */}
                        <button
                          onClick={() => moveColumn(colKey, 'left')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Move Column Left (←)"
                        >
                          ←
                        </button>
                        {/* Shift Right */}
                        <button
                          onClick={() => moveColumn(colKey, 'right')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Move Column Right (→)"
                        >
                          →
                        </button>
                        {/* Rename Header */}
                        <button
                          onClick={() => {
                            setEditingColKey(colKey);
                            setNewTitleInput(columnTitles[colKey]);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-indigo-400"
                          title="Rename Header Title"
                        >
                          ✏️
                        </button>
                        {/* Line Separator Resizer */}
                        <button
                          onClick={() => cycleWidth(colKey)}
                          className="p-1 rounded hover:bg-slate-800 text-emerald-400 font-mono text-[10px]"
                          title="Resize Column Width"
                        >
                          │↔│
                        </button>
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 px-3 py-3 border-b border-slate-800"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columnOrder.length + 2} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">🔍</div>
                    <p className="text-sm font-bold text-white">No leads match your search</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      No results for <strong className="text-indigo-300">"{search}"</strong> across all fields.
                      Try searching by name, phone, email, city, status, or any other field.
                    </p>
                    <button
                      onClick={() => setSearch('')}
                      className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-xl hover:bg-indigo-500/10 transition-all"
                    >
                      ✕ Clear Search & Show All Leads
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
            filtered.map((lead) => (
              <React.Fragment key={lead.id}>
              <tr className={`hover:bg-slate-900/50 transition-colors ${selected.includes(lead.id) ? 'bg-brand/5' : ''}`}>
                <td className="px-3 py-3 border-b border-slate-800/60">
                  <input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </td>

                {columnOrder.map((colKey) => (
                  <td key={colKey} className="px-3 py-3 border-b border-r border-slate-800/60 text-xs">
                    {colKey === 'name' && (
                      <div>
                        <Link href={`/leads/${lead.id}`} className="font-bold text-white hover:text-indigo-400 hover:underline">
                          {lead.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{lead.email}</span>
                          <span>·</span>
                          <span>{lead.phone}</span>
                        </div>
                        {/* Badges Container: Allocation Chain + Call Telemetry */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {/* Allocation Chain Mini-Badge */}
                          {lead.allocationTrail && lead.allocationTrail.length > 0 && (
                            <button
                              onClick={() => setExpandedTrailLeadId(expandedTrailLeadId === lead.id ? null : lead.id)}
                              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
                              style={{
                                background: expandedTrailLeadId === lead.id ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
                                borderColor: 'rgba(99,102,241,0.35)',
                                color: '#818cf8',
                              }}
                            >
                              <GitBranch size={9} />
                              {lead.allocationTrail.length}-Step Chain
                              <span className="ml-0.5">{expandedTrailLeadId === lead.id ? '▲' : '▼'}</span>
                            </button>
                          )}

                          {/* Call Telemetry Count Badge */}
                          <Link
                            href={`/leads/${lead.id}`}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
                            style={{
                              background: 'rgba(52,211,153,0.1)',
                              borderColor: 'rgba(52,211,153,0.35)',
                              color: '#34d399',
                            }}
                            title="Click to view full call contact timeline & audit"
                          >
                            <Phone size={9} />
                            {lead.totalCalls || 4} Calls (Last: {lead.lastCalledAt || 'Today 2:45 PM'})
                          </Link>
                        </div>
                      </div>
                    )}

                    {colKey === 'status' && (
                      <span
                        className="status-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: `${lead.statusColor}20`, color: lead.statusColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: lead.statusColor }} />
                        {lead.status}
                      </span>
                    )}

                    {colKey === 'aiScore' && (
                      <div className="flex items-center gap-2">
                        {lead.aiScore ? (
                          <AILeadScoreCell score={lead.aiScore} />
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Brain size={12} />
                            <span>No Score</span>
                          </div>
                        )}
                      </div>
                    )}

                    {colKey === 'value' && (
                      <span className="font-bold text-indigo-400">{lead.value}</span>
                    )}

                    {colKey === 'owner' && (() => {
                      const isLocked = isLeadContactedAndLocked(lead);
                      const isUnassigned = !lead.owner || lead.owner === 'Unassigned' || lead.owner === '—';

                      if (isLocked) {
                        return (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800" title="🔒 Lead Assignment Locked: This lead has already been contacted by Sales/TL and cannot be reassigned to anyone else.">
                            <Lock size={12} className="text-amber-400" />
                            <span className="font-bold text-slate-300 text-xs">{lead.owner}</span>
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">LOCKED</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={lead.owner || 'Unassigned'}
                            onChange={(e) => {
                              const newOwner = e.target.value;
                              setLeadsList(prev => prev.map(item => item.id === lead.id ? { ...item, owner: newOwner, currentAssignee: newOwner } : item));
                            }}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                              isUnassigned
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-extrabold animate-pulse'
                                : 'bg-slate-900 border-slate-700 text-indigo-300 hover:border-indigo-500'
                            }`}
                          >
                            <option value="Unassigned">⚠️ Unassigned</option>
                            <option value="Rajesh K.">Rajesh K. (Sales Rep)</option>
                            <option value="Priya S.">Priya S. (TL A)</option>
                            <option value="Rohan Kumar">Rohan Kumar (Sales Exec)</option>
                            <option value="Amit P.">Amit P. (Sales Exec)</option>
                            <option value="Neha Gupta">Neha Gupta (Sales Exec)</option>
                          </select>
                        </div>
                      );
                    })()}

                    {colKey === 'city' && <span className="text-slate-300 font-medium">{lead.city}</span>}
                    {colKey === 'budget' && <span className="text-emerald-400 font-mono font-semibold">{lead.budget}</span>}
                    {colKey === 'requirement' && <span className="text-slate-300 truncate max-w-[160px] inline-block">{lead.requirement}</span>}
                    {colKey === 'source' && <span className="text-slate-400">{lead.source}</span>}
                    {colKey === 'created' && <span className="text-slate-400">{lead.created}</span>}
                  </td>
                ))}

                <td className="px-3 py-3 border-b border-slate-800/60">
                  <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-400 hover:text-white">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>

              {/* 🔗 Inline Allocation Trail Expanded Row */}
              {expandedTrailLeadId === lead.id && lead.allocationTrail && (
                <tr key={`trail-${lead.id}`}>
                  <td colSpan={columnOrder.length + 2} className="px-4 py-0 bg-slate-950/60 border-b border-slate-800">
                    <div className="py-4">
                      {/* Compact Timeline */}
                      <div className="flex items-center gap-1 mb-3">
                        <GitBranch size={13} className="text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-300">Lead Allocation & Assignment Chain</span>
                        <span className="text-[10px] text-slate-500 ml-auto">Admin → Manager → TL → Sales Rep</span>
                      </div>
                      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                        {lead.allocationTrail.map((event, idx) => {
                          const roleColors: Record<string, { color: string; bg: string; border: string; label: string }> = {
                            ADMIN: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', label: 'Admin' },
                            MANAGER: { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.35)', label: 'Manager' },
                            TEAM_LEADER: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', label: 'TL' },
                            SALES_EXEC: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', label: 'Sales Rep' },
                          };
                          const toMeta = roleColors[event.toRole] || roleColors.SALES_EXEC;
                          const fromMeta = roleColors[event.fromRole] || roleColors.ADMIN;
                          const dt = new Date(event.assignedAt);
                          const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                          const isFinal = event.toRole === 'SALES_EXEC';

                          return (
                            <div key={event.id} className="flex items-center gap-0 flex-shrink-0">
                              {/* Event Node */}
                              <div
                                className="min-w-[180px] max-w-[220px] p-2.5 rounded-xl border space-y-1.5"
                                style={{ background: toMeta.bg, borderColor: toMeta.border }}
                              >
                                {/* From badge */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: fromMeta.bg, color: fromMeta.color, border: `1px solid ${fromMeta.border}` }}>
                                    {fromMeta.label}
                                  </span>
                                  <span className="text-[9px] text-slate-500">→</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: toMeta.bg, color: toMeta.color, border: `1px solid ${toMeta.border}` }}>
                                    {toMeta.label}
                                  </span>
                                  {isFinal && <span className="text-[8px] font-black text-emerald-400 ml-auto">✓ Final</span>}
                                </div>
                                {/* Action text */}
                                <p className="text-[11px] font-bold text-white leading-tight">
                                  {isFinal ? '🎯 Assigned to' : '📁 Allocated to'} {event.toName}
                                </p>
                                {/* By whom */}
                                <p className="text-[10px] text-slate-400">By <span style={{ color: fromMeta.color }} className="font-bold">{event.fromName}</span></p>
                                {/* Date + Time */}
                                <div className="flex items-center gap-1 pt-0.5">
                                  <span className="text-[9px] font-bold text-slate-500">{dateStr}</span>
                                  <span className="text-[9px] text-slate-600">·</span>
                                  <span className="text-[10px] font-extrabold" style={{ color: toMeta.color }}>{timeStr}</span>
                                </div>
                                {/* Note */}
                                {event.note && (
                                  <p className="text-[9px] text-slate-400 italic leading-tight border-t border-slate-800 pt-1 mt-1">"{event.note.substring(0, 60)}{event.note.length > 60 ? '...' : ''}"</p>
                                )}
                              </div>

                              {/* Arrow connector */}
                              {idx < lead.allocationTrail!.length - 1 && (
                                <div className="flex items-center px-1">
                                  <div className="w-6 h-0.5 bg-slate-700" />
                                  <div className="text-slate-500 text-[10px]">▶</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* Header Title Editor Modal */}
      {editingColKey && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>✏️ Rename Column Header</span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter a custom label for the <strong>{editingColKey}</strong> column in your Excel Data Grid:
            </p>

            <input
              type="text"
              className="crm-input w-full text-sm font-semibold"
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="e.g. Client Mobile Number"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setEditingColKey(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleSaveHeaderTitle} className="btn-primary text-xs">Save Column Title</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎛️ Advanced Lead Multi-Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">🎛️ Multi-Dimensional Lead Filter</h3>
                  <p className="text-xs text-slate-400">Filter by assigned person, role, date range & stage status</p>
                </div>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 1. Person Wise Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User size={14} className="text-indigo-400" />
                  Assigned Employee / Person
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: '👥 All Persons' },
                    { id: 'Rajesh', label: '👤 Rajesh K. (Sales)' },
                    { id: 'Priya', label: '👤 Priya S. (Sales)' },
                    { id: 'Amit', label: '👤 Amit P. (Sales)' },
                    { id: 'UNASSIGNED', label: '🔓 Unassigned Only' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilterPerson(item.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        filterPerson === item.id
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {filterPerson === item.id && <Check size={14} className="text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Person Role Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-400" />
                  Assignee Role Scoping
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: '🌐 All Roles' },
                    { id: 'SALES_EXEC', label: '💼 Sales Executive' },
                    { id: 'TEAM_LEADER', label: '👑 Team Leader (TL)' },
                    { id: 'MANAGER', label: '📊 Manager' },
                    { id: 'ADMIN', label: '⚡ Admin / HQ' },
                    { id: 'UNASSIGNED', label: '🔓 Unassigned' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilterRole(item.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        filterRole === item.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {filterRole === item.id && <Check size={14} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Date Range Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-400" />
                  Lead Created Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: '📆 All Dates' },
                    { id: 'TODAY', label: '⚡ Today' },
                    { id: 'YESTERDAY', label: '🕒 Yesterday' },
                    { id: 'THIS_MONTH', label: '📅 This Month' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilterDate(item.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        filterDate === item.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {filterDate === item.id && <Check size={14} className="text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Star size={14} className="text-purple-400" />
                  Stage / Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        const val = st === 'All' ? 'ALL' : st;
                        setFilterStatus(val);
                        if (st !== 'All') setActiveStatus('All');
                      }}
                      className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                        (filterStatus === 'ALL' && st === 'All') || filterStatus === st
                          ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} /> Reset Filters
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="btn-primary text-xs py-2 px-5 font-bold shadow-lg"
              >
                Apply Filters ({filtered.length} Leads Matching)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
