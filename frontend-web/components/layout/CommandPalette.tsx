'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Target, Users, Building2, Briefcase, CheckSquare,
  FileText, BarChart3, Plus, Zap, UserCog, Settings, ArrowRight, X
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Create New Lead', icon: Target, href: '/leads?action=new', color: '#6366f1' },
  { label: 'Create Contact', icon: Users, href: '/contacts?action=new', color: '#3b82f6' },
  { label: 'Add Deal to Pipeline', icon: Briefcase, href: '/deals?action=new', color: '#8b5cf6' },
  { label: 'Create Follow-up Task', icon: CheckSquare, href: '/tasks?action=new', color: '#f59e0b' },
  { label: 'New Quotation', icon: FileText, href: '/quotes?action=new', color: '#ec4899' },
  { label: 'View HR Attendance', icon: UserCog, href: '/hr/attendance', color: '#22c55e' },
];

const RECENT_ITEMS = [
  { type: 'lead', title: 'Rajesh Kumar', sub: 'TechCorp Ltd · ₹2.4L', href: '/leads/1', icon: Target, color: '#6366f1' },
  { type: 'deal', title: 'Grand Palace Hotel', sub: 'Negotiation · ₹8.5L', href: '/deals', icon: Briefcase, color: '#8b5cf6' },
  { type: 'company', title: 'Sunita Real Estate', sub: 'Mumbai · 45 employees', href: '/companies', icon: Building2, color: '#3b82f6' },
  { type: 'contact', title: 'Priya Sharma', sub: 'CTO · priya@sunita.com', href: '/contacts', icon: Users, color: '#22c55e' },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose(); else setQuery('');
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const filteredActions = QUICK_ACTIONS.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRecent = RECENT_ITEMS.filter(i =>
    !query || i.title.toLowerCase().includes(query.toLowerCase()) || i.sub.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden animate-scale-in z-10"
        style={{ background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <Search size={18} className="text-muted" />
          <input
            className="w-full bg-transparent text-white text-base focus:outline-none placeholder:text-muted"
            placeholder="Search leads, contacts, deals, or type a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-1.5">Quick Actions</p>
              <div className="space-y-0.5">
                {filteredActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all hover:bg-muted/20 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${action.color}15`, color: action.color }}>
                        <action.icon size={14} />
                      </div>
                      <span className="text-sm font-medium text-white">{action.label}</span>
                    </div>
                    <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Records */}
          {filteredRecent.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-1.5">Recent & Matching Records</p>
              <div className="space-y-0.5">
                {filteredRecent.map(item => (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all hover:bg-muted/20 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15`, color: item.color }}>
                        <item.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white leading-tight truncate">{item.title}</p>
                        <p className="text-xs text-muted truncate">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase text-muted" style={{ background: 'rgb(var(--muted))' }}>
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredRecent.length === 0 && (
            <div className="py-8 text-center text-muted text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t flex items-center justify-between text-xs text-muted" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">↵</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">ESC</kbd> to close</span>
          </div>
          <span className="font-semibold text-brand-400">DAS CRM Search</span>
        </div>
      </div>
    </div>
  );
}
