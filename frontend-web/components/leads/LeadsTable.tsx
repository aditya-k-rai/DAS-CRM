'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Phone, Mail, MoreHorizontal, ExternalLink, Star, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LEADS = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210', status: 'Qualified', statusColor: '#3b82f6', source: 'Website', score: 85, owner: 'Rajesh K.', value: '₹2,40,000', created: 'Aug 9, 2026', tags: ['hot', 'real-estate'] },
  { id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109', status: 'New', statusColor: '#6366f1', source: 'LinkedIn', score: 72, owner: 'Priya S.', value: '₹1,80,000', created: 'Aug 9, 2026', tags: ['warm'] },
  { id: '3', name: 'TechCorp Ltd', email: 'contact@techcorp.com', phone: '+91 22 1234 5678', status: 'Proposal', statusColor: '#8b5cf6', source: 'Referral', score: 91, owner: 'Rajesh K.', value: '₹5,20,000', created: 'Aug 8, 2026', tags: ['hot', 'enterprise'] },
  { id: '4', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 76543 21098', status: 'Contacted', statusColor: '#f59e0b', source: 'Cold Call', score: 58, owner: 'Amit P.', value: '₹90,000', created: 'Aug 8, 2026', tags: [] },
  { id: '5', name: 'Sunita Real Estate', email: 'info@sunita.com', phone: '+91 44 9876 5432', status: 'Negotiation', statusColor: '#ec4899', source: 'Events', score: 77, owner: 'Rajesh K.', value: '₹8,50,000', created: 'Aug 7, 2026', tags: ['warm'] },
  { id: '6', name: 'Construkt Inc.', email: 'bd@construkt.in', phone: '+91 80 1111 2222', status: 'New', statusColor: '#6366f1', source: 'Website', score: 63, owner: 'Priya S.', value: '₹3,60,000', created: 'Aug 7, 2026', tags: ['construction'] },
  { id: '7', name: 'Lakshmi Automobiles', email: 'sales@lakshmi.com', phone: '+91 99887 76655', status: 'Won', statusColor: '#22c55e', source: 'Events', score: 98, owner: 'Rajesh K.', value: '₹12,00,000', created: 'Aug 6, 2026', tags: ['auto', 'won'] },
];

const STATUSES = ['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadsTable() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const { currentUser } = useAuth();

  const isRep = currentUser.role === 'SALES_EXEC';

  const filtered = LEADS.filter((l) => {
    // If role is Sales Rep, only show leads assigned to Rajesh K.
    if (isRep && l.owner !== 'Rajesh K.') return false;

    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeStatus === 'All' || l.status === activeStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="crm-card overflow-hidden p-0">
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
        {/* Status pills */}
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setActiveStatus(s)} className={`pill-tab text-xs py-1 px-3 ${activeStatus === s ? 'active' : ''}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--muted-foreground))' }} />
            <input
              className="crm-input pl-9 h-9"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
              <span className="font-medium" style={{ color: 'rgb(var(--brand-400))' }}>{selected.length} selected</span>
              <button className="btn-secondary text-xs py-1 px-3">Assign</button>
              <button className="btn-secondary text-xs py-1 px-3">Change Status</button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? filtered.map((l) => l.id) : [])}
                  checked={selected.length === filtered.length && filtered.length > 0}
                />
              </th>
              <th>Lead Name</th>
              <th>Status</th>
              <th>Score</th>
              <th>Value</th>
              <th>Assigned Rep</th>
              <th>Source</th>
              <th>Created</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className={selected.includes(lead.id) ? 'bg-brand/5' : ''}>
                <td>
                  <input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggleSelect(lead.id)} />
                </td>
                <td>
                  <div>
                    <Link href={`/leads/${lead.id}`} className="font-semibold hover:underline" style={{ color: 'rgb(var(--foreground))' }}>
                      {lead.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      <span>{lead.email}</span>
                      <span>·</span>
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="status-badge"
                    style={{ background: `${lead.statusColor}20`, color: lead.statusColor }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: lead.statusColor }} />
                    {lead.status}
                  </span>
                </td>
                <td>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                    background: lead.score > 80 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: lead.score > 80 ? '#22c55e' : '#f59e0b',
                  }}>
                    {lead.score}
                  </span>
                </td>
                <td className="font-semibold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>
                  {lead.value}
                </td>
                <td>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="avatar w-6 h-6 text-[10px]">{lead.owner.split(' ').map(n=>n[0]).join('')}</div>
                    <span>{lead.owner}</span>
                  </div>
                </td>
                <td className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>{lead.source}</td>
                <td className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>{lead.created}</td>
                <td>
                  <button className="btn-ghost w-8 h-8 p-0 rounded flex items-center justify-center">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
