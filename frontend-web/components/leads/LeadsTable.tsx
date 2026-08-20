'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Phone, Mail, MoreHorizontal, ExternalLink, Star, Shield, Lock, ArrowLeftRight, Edit3, MoveLeft, MoveRight, Maximize2, Table, LayoutList, GitBranch } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LeadAllocationTrail, AllocationEvent } from './LeadAllocationTrail';

interface LeadDataWeb {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  statusColor: string;
  source: string;
  score: number;
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
}

const LEADS: LeadDataWeb[] = [
  {
    id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210',
    status: 'Qualified', statusColor: '#3b82f6', source: 'Website', score: 85,
    owner: 'Rajesh K.', value: '₹2,40,000', created: 'Aug 9, 2026',
    tags: ['hot', 'real-estate'], city: 'Delhi NCR', budget: '₹2.5L - ₹5L', requirement: '50-Seat Enterprise CRM',
    currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC',
    allocationTrail: [
      { id: 'a1', fromRole: 'ADMIN', fromName: 'Super Admin', toRole: 'MANAGER', toName: 'Vikram Singh (Manager A)', action: 'ALLOCATED', assignedAt: '2026-08-09T08:00:00+05:30', note: 'High-value enterprise lead from Website campaign.' },
      { id: 'a2', fromRole: 'MANAGER', fromName: 'Vikram Singh (Manager A)', toRole: 'TEAM_LEADER', toName: 'Priya Sharma (TL A)', action: 'ALLOCATED', assignedAt: '2026-08-09T09:30:00+05:30', note: 'Delhi NCR territory. CRM vertical.' },
      { id: 'a3', fromRole: 'TEAM_LEADER', fromName: 'Priya Sharma (TL A)', toRole: 'SALES_EXEC', toName: 'Rajesh K. (Sales Rep)', action: 'ALLOCATED', assignedAt: '2026-08-09T10:45:00+05:30', note: 'Assigned for outreach. Follow up by EOD.' },
    ],
  },
  {
    id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109',
    status: 'New', statusColor: '#6366f1', source: 'LinkedIn', score: 72,
    owner: 'Priya S.', value: '₹1,80,000', created: 'Aug 9, 2026',
    tags: ['warm'], city: 'Mumbai', budget: '₹1.5L - ₹3L', requirement: 'WhatsApp Bot Integration',
    currentAssignee: 'Priya S. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC',
    allocationTrail: [
      { id: 'b1', fromRole: 'ADMIN', fromName: 'Super Admin', toRole: 'MANAGER', toName: 'Anil Kumar (Manager B)', action: 'ALLOCATED', assignedAt: '2026-08-09T08:15:00+05:30', note: 'LinkedIn inbound lead.' },
      { id: 'b2', fromRole: 'MANAGER', fromName: 'Anil Kumar (Manager B)', toRole: 'SALES_EXEC', toName: 'Priya S. (Sales Rep)', action: 'ALLOCATED', assignedAt: '2026-08-09T11:00:00+05:30', note: 'Direct assignment — small ticket, no TL needed.' },
    ],
  },
  { id: '3', name: 'TechCorp Ltd', email: 'contact@techcorp.com', phone: '+91 22 1234 5678', status: 'Proposal', statusColor: '#8b5cf6', source: 'Referral', score: 91, owner: 'Rajesh K.', value: '₹5,20,000', created: 'Aug 8, 2026', tags: ['hot', 'enterprise'], city: 'Bengaluru', budget: '₹5L+', requirement: 'AI Scoring Engine Pro', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '4', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 76543 21098', status: 'Contacted', statusColor: '#f59e0b', source: 'Cold Call', score: 58, owner: 'Amit P.', value: '₹90,000', created: 'Aug 8, 2026', tags: [], city: 'Ahmedabad', budget: '₹50k - ₹1L', requirement: 'Cloud Telemetry License', currentAssignee: 'Amit P. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '5', name: 'Sunita Real Estate', email: 'info@sunita.com', phone: '+91 44 9876 5432', status: 'Negotiation', statusColor: '#ec4899', source: 'Events', score: 77, owner: 'Rajesh K.', value: '₹8,50,000', created: 'Aug 7, 2026', tags: ['warm'], city: 'Chennai', budget: '₹7L - ₹10L', requirement: 'Full CRM Suite + Mobile App', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '6', name: 'Construkt Inc.', email: 'bd@construkt.in', phone: '+91 80 1111 2222', status: 'New', statusColor: '#6366f1', source: 'Website', score: 63, owner: 'Priya S.', value: '₹3,60,000', created: 'Aug 7, 2026', tags: ['construction'], city: 'Pune', budget: '₹3L - ₹5L', requirement: 'Lead Scoring Engine', currentAssignee: 'Priya S. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
  { id: '7', name: 'Lakshmi Automobiles', email: 'sales@lakshmi.com', phone: '+91 99887 76655', status: 'Won', statusColor: '#22c55e', source: 'Events', score: 98, owner: 'Rajesh K.', value: '₹12,00,000', created: 'Aug 6, 2026', tags: ['auto', 'won'], city: 'Hyderabad', budget: '₹10L+', requirement: 'Custom Workflow + Auto Dialer', currentAssignee: 'Rajesh K. (Sales Rep)', currentAssigneeRole: 'SALES_EXEC' },
];

const STATUSES = ['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadsTable() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [isExcelMode, setIsExcelMode] = useState(true);
  const [expandedTrailLeadId, setExpandedTrailLeadId] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Excel Interactive Column Order State
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'status', 'score', 'value', 'owner', 'city', 'budget', 'requirement', 'source', 'created'
  ]);

  // Dynamic Column Names (Renameable)
  const [columnTitles, setColumnTitles] = useState<Record<string, string>>({
    name: 'Lead Name / Client',
    status: 'Status',
    score: 'Score',
    value: 'Lead Value',
    owner: 'Assigned Rep',
    city: 'City (Custom)',
    budget: 'Budget (Custom)',
    requirement: 'Requirement (Custom)',
    source: 'Source',
    created: 'Created Date',
  });

  // Column Width Resizers
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 240,
    status: 130,
    score: 90,
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

  const isRep = currentUser.role === 'SALES_EXEC';

  const filtered = LEADS.filter((l) => {
    // Role-based scoping for Sales Reps
    if (isRep && l.owner !== 'Rajesh K.') return false;

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

    // Status tab filter
    const matchStatus = activeStatus === 'All' || l.status === activeStatus;
    return matchStatus;
  });

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
        {/* Top Control Bar: View Toggle & Status Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setActiveStatus(s)} className={`pill-tab text-xs py-1 px-3 ${activeStatus === s ? 'active' : ''}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Interactive Excel Spreadsheet Grid Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExcelMode(!isExcelMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isExcelMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-muted border-slate-800 hover:text-white'
              }`}
            >
              <Table size={14} />
              <span>{isExcelMode ? '📊 Interactive Excel Data Grid (Active)' : '📋 Standard List View'}</span>
            </button>
          </div>
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
                        {/* Allocation Chain Mini-Badge */}
                        {lead.allocationTrail && lead.allocationTrail.length > 0 && (
                          <button
                            onClick={() => setExpandedTrailLeadId(expandedTrailLeadId === lead.id ? null : lead.id)}
                            className="mt-1.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
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

                    {colKey === 'score' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                        background: lead.score > 80 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: lead.score > 80 ? '#22c55e' : '#f59e0b',
                      }}>
                        {lead.score}
                      </span>
                    )}

                    {colKey === 'value' && (
                      <span className="font-bold text-indigo-400">{lead.value}</span>
                    )}

                    {colKey === 'owner' && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="avatar w-6 h-6 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{lead.owner.split(' ').map(n=>n[0]).join('')}</div>
                        <span className="font-semibold text-slate-200">{lead.owner}</span>
                      </div>
                    )}

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
    </div>
  );
}
