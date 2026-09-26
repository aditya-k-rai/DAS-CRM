'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Users, Plus, Shield, Mail, MoreHorizontal, UserPlus, Building2, CreditCard, User, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth, getPlanSeatQuota, formatPlanName, normalizeRoleStr } from '@/context/AuthContext';

export default function TeamSettingsPage() {
  const { currentUser, subscription } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole);
  const [members, setMembers] = useState<any[]>([]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        <Topbar title="Team & Member Management" />
        <main className="flex-1 p-6 flex items-center justify-center min-h-[70vh]">
          <div className="crm-card p-8 text-center max-w-md w-full space-y-5 border border-rose-500/30 bg-rose-500/5 shadow-2xl rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg">
              <Shield size={32} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Admin Dashboard Only
              </span>
              <h2 className="text-xl font-extrabold text-white mt-3">Access Restricted</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Team and member management settings are restricted exclusively to Workspace Administrators.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/leads"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                ← Return to My Workspace
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  useEffect(() => {
    fetch('/api/v1/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data.map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Member',
            email: u.email,
            role: u.role || 'MEMBER',
            teamLeader: u.reportsTo || 'Admin',
            status: u.status || 'ACTIVE'
          })));
        } else if (currentUser?.email) {
          setMembers([{
            id: currentUser.id || 'usr_1',
            name: currentUser.name || 'Organization Admin',
            email: currentUser.email,
            role: currentUser.role || 'OWNER',
            teamLeader: 'Self',
            status: 'ACTIVE'
          }]);
        }
      })
      .catch(() => {
        if (currentUser?.email) {
          setMembers([{
            id: currentUser.id || 'usr_1',
            name: currentUser.name || 'Organization Admin',
            email: currentUser.email,
            role: currentUser.role || 'OWNER',
            teamLeader: 'Self',
            status: 'ACTIVE'
          }]);
        }
      });
  }, [currentUser]);

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
            <Link href="/about" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Info size={16} /> About & Developer
            </Link>
          </div>
        </div>

        {/* Team Content */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <div className="crm-card p-0 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'rgb(var(--border))' }}>
              {(() => {
                const planSeats = subscription?.userSeatsAllocated || getPlanSeatQuota(subscription?.planType);
                const planName = formatPlanName(subscription?.planType);
                const seatsRemaining = Math.max(0, planSeats - members.length);
                return (
                  <>
                    <h3 className="font-semibold text-sm">Active Members ({members.length} / {planSeats} seats used)</h3>
                    <span className="text-xs text-brand font-medium">{planName} · {seatsRemaining} seats remaining</span>
                  </>
                );
              })()}
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
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-8 h-8 text-xs">{m.name.split(' ').map((n: string) => n[0]).join('')}</div>
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
