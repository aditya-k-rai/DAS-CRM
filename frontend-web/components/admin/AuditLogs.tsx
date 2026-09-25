'use client';

import { useState } from 'react';
import { Shield, Search, Filter, User, Target, Settings, Key, Trash2, Edit2, Download } from 'lucide-react';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'PERMISSION';

interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: AuditAction;
  resource: string;
  detail: string;
  ip: string;
  time: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const ACTION_CFG: Record<AuditAction, { label: string; icon: any; color: string }> = {
  CREATE:     { label: 'Created',    icon: Target,   color: '#22c55e' },
  UPDATE:     { label: 'Updated',    icon: Edit2,    color: '#6366f1' },
  DELETE:     { label: 'Deleted',    icon: Trash2,   color: '#ef4444' },
  LOGIN:      { label: 'Login',      icon: Key,      color: '#f59e0b' },
  EXPORT:     { label: 'Exported',   icon: Download, color: '#8b5cf6' },
  PERMISSION: { label: 'Permission', icon: Shield,   color: '#ec4899' },
};

const RISK_CFG = {
  low:    { label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const LOGS: AuditEntry[] = [];

export function AuditLogs() {
  const [search, setSearch]       = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter]     = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filtered = LOGS.filter(l => {
    const ms = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase());
    const ma = actionFilter === 'ALL' || l.action === actionFilter;
    const mr = riskFilter === 'all' || l.riskLevel === riskFilter;
    return ms && ma && mr;
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {(Object.entries(ACTION_CFG) as [AuditAction, typeof ACTION_CFG[AuditAction]][]).map(([key, cfg]) => {
          const count = LOGS.filter(l => l.action === key).length;
          return (
            <button key={key} onClick={() => setActionFilter(actionFilter === key ? 'ALL' : key)}
              className="crm-card py-3 text-center transition-all"
              style={{ borderColor: actionFilter === key ? cfg.color : 'rgb(var(--border))' }}>
              <p className="text-xl font-extrabold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-xs text-muted mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-muted" />
            <input className="crm-input pl-9 h-8 text-sm w-52" placeholder="Search user or detail..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {['all', 'low', 'medium', 'high'].map(r => {
              const cfg = r === 'all' ? null : RISK_CFG[r as keyof typeof RISK_CFG];
              return (
                <button key={r} onClick={() => setRiskFilter(r as any)}
                  className="text-xs px-3 py-1 rounded-full font-semibold capitalize transition-all"
                  style={{
                    background: riskFilter === r ? (cfg?.bg ?? 'rgba(99,102,241,0.2)') : 'rgb(var(--muted))',
                    color: riskFilter === r ? (cfg?.color ?? 'rgb(129,140,248)') : 'rgb(var(--muted-foreground))',
                  }}>
                  {r === 'all' ? 'All Risks' : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-muted ml-auto">{filtered.length} events</span>
        </div>

        {/* Log entries */}
        <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Shield size={36} className="text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-foreground">No audit logs recorded</p>
              <p className="text-xs text-muted mt-0.5">User security actions, logins, and permission changes will appear here.</p>
            </div>
          ) : (
            filtered.map(log => {
              const actCfg  = ACTION_CFG[log.action];
              const riskCfg = RISK_CFG[log.riskLevel];
              return (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3.5 hover:bg-muted/10 transition-all">
                  {/* Action icon */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${actCfg.color}15`, color: actCfg.color }}>
                    <actCfg.icon size={14} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm">{log.user}</span>
                      <span className="text-xs text-muted">{log.role}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${actCfg.color}15`, color: actCfg.color }}>
                        {actCfg.label}
                      </span>
                      <span className="text-xs font-semibold">{log.resource}</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{log.detail}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))', opacity: 0.5 }}>
                      IP: {log.ip}
                    </p>
                  </div>

                  {/* Risk + Time */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: riskCfg.bg, color: riskCfg.color }}>
                      {riskCfg.label} Risk
                    </span>
                    <p className="text-xs text-muted mt-1">{log.time}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
