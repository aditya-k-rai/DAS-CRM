'use client';

import Link from 'next/link';
import { ExternalLink, Database } from 'lucide-react';

interface RecentLead {
  id: string;
  name: string;
  email: string;
  status: string;
  statusColor: string;
  source: string;
  score: number;
  owner: string;
  value: string;
  created: string;
}

const leads: RecentLead[] = [];

export function RecentLeads() {
  return (
    <div className="crm-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Recent Leads</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>Latest activity in your pipeline</p>
        </div>
        <Link href="/leads" className="btn-secondary text-xs px-3 py-1.5">View all →</Link>
      </div>

      {leads.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border/80 text-center text-muted">
          <Database size={28} className="mx-auto mb-2 text-muted/60" />
          <p className="font-bold text-sm text-foreground">No leads in pipeline yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add or import your first lead to see recent pipeline activity.</p>
          <Link href="/leads" className="btn-primary text-xs px-3 py-1.5 mt-3 inline-flex items-center gap-1">
            + Add First Lead
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Score</th>
                <th>Value</th>
                <th>Source</th>
                <th>Owner</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>{lead.email}</p>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: `${lead.statusColor}18`, color: lead.statusColor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: lead.statusColor }} />
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                        <div className="h-full rounded-full" style={{ width: `${lead.score}%`, background: lead.score > 80 ? 'rgb(34 197 94)' : lead.score > 60 ? 'rgb(245 158 11)' : 'rgb(239 68 68)' }} />
                      </div>
                      <span className="text-xs font-medium">{lead.score}</span>
                    </div>
                  </td>
                  <td><span className="font-semibold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>{lead.value}</span></td>
                  <td><span className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>{lead.source}</span></td>
                  <td>
                    <div className="avatar w-7 h-7 text-xs">{lead.owner}</div>
                  </td>
                  <td><span className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>{lead.created}</span></td>
                  <td>
                    <Link href={`/leads/${lead.id}`}>
                      <button className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center">
                        <ExternalLink size={13} />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
