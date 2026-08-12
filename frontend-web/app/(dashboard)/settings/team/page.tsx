import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Users, Plus, Shield, Mail, MoreHorizontal, UserPlus, Building2, CreditCard, User } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Team & Members | Settings' };

const MEMBERS = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'OWNER', teamLeader: 'Self', status: 'ACTIVE' },
  { id: '2', name: 'Amit Shah', email: 'amit.shah@company.com', role: 'TEAM_LEADER', teamLeader: 'Admin', status: 'ACTIVE' },
  { id: '3', name: 'Neha Joshi', email: 'neha.joshi@company.com', role: 'TEAM_LEADER', teamLeader: 'Admin', status: 'ACTIVE' },
  { id: '4', name: 'Rajesh Kumar', email: 'rajesh@company.com', role: 'SALES', teamLeader: 'Amit Shah', status: 'ACTIVE' },
  { id: '5', name: 'Priya Sharma', email: 'priya@company.com', role: 'HR', teamLeader: 'Admin', status: 'ACTIVE' },
];

export default function TeamSettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Team & Member Management" actions={
        <button className="btn-primary text-sm gap-1.5"><UserPlus size={14} /> Invite Member</button>
      } />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-6">
        {/* Settings Sub-nav */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Building2 size={16} /> Organization Profile
            </Link>
            <Link href="/settings/team" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand/10 text-white border-l-2 border-brand">
              <Users size={16} /> Team & Members
            </Link>
            <Link href="/settings/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <CreditCard size={16} /> Subscription & Billing
            </Link>
            <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <User size={16} /> My Account Profile
            </Link>
          </div>
        </div>

        {/* Team Content */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <div className="crm-card p-0 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'rgb(var(--border))' }}>
              <h3 className="font-semibold text-sm">Active Members ({MEMBERS.length} / 15 seats used)</h3>
              <span className="text-xs text-brand font-medium">Pro Plan · 10 seats remaining</span>
            </div>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Assigned Role</th>
                  <th>Reporting Team Leader</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-8 h-8 text-xs">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{
                        background: m.role === 'OWNER' ? 'rgba(139,92,246,0.2)' : m.role === 'TEAM_LEADER' ? 'rgba(99,102,241,0.2)' : m.role === 'HR' ? 'rgba(236,72,153,0.2)' : 'rgba(59,130,246,0.2)',
                        color: m.role === 'OWNER' ? 'rgb(167,139,250)' : m.role === 'TEAM_LEADER' ? 'rgb(129,140,248)' : m.role === 'HR' ? 'rgb(244,114,182)' : 'rgb(96,165,250)',
                      }}>
                        {m.role}
                      </span>
                    </td>
                    <td><span className="text-xs text-muted">{m.teamLeader}</span></td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 font-semibold">
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded">
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
